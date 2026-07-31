#!/usr/bin/env python3
"""
Advanced SOC Lab — block_ip.py
================================
Automated IP blocking via pfSense/OPNsense API and iptables.
Triggered by auto_investigate.py when malicious IPs are confirmed.

Usage:
    python3 block_ip.py --ip 203.0.113.45 --reason "Brute force T1110"
    python3 block_ip.py --ip 203.0.113.45 --unblock
    python3 block_ip.py --list-blocked
    python3 block_ip.py --test

Environment Variables:
    PFSENSE_HOST, PFSENSE_USER, PFSENSE_PASS
    THEHIVE_HOST, THEHIVE_API_KEY
"""

import os
import sys
import json
import logging
import argparse
import ipaddress
import subprocess
from datetime import datetime, timezone
import requests
import urllib3

urllib3.disable_warnings()

# ── Logging ───────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler("/var/log/soc-block-ip.log"),
    ],
)
log = logging.getLogger("block_ip")

# ── Configuration ─────────────────────────────────────────
PFSENSE_HOST   = os.getenv("PFSENSE_HOST",    "https://192.168.56.1")
PFSENSE_USER   = os.getenv("PFSENSE_USER",    "admin")
PFSENSE_PASS   = os.getenv("PFSENSE_PASS",    "pfsense")
THEHIVE_HOST   = os.getenv("THEHIVE_HOST",    "http://192.168.56.10:9000")
THEHIVE_KEY    = os.getenv("THEHIVE_API_KEY", "your-thehive-api-key")
BLOCK_LOG_FILE = os.getenv("BLOCK_LOG_FILE",  "/var/log/soc-blocked-ips.json")

# IPs never to block — SOC infrastructure and lab management
NEVER_BLOCK = {
    "127.0.0.1",
    "192.168.56.1",    # pfSense / gateway
    "192.168.56.10",   # SIEM server
    "192.168.56.20",   # Kali attacker (lab only)
    "10.0.2.2",        # VirtualBox NAT gateway
    "10.0.2.15",       # VirtualBox NAT host
}

PRIVATE_PREFIXES = (
    "10.", "192.168.", "172.16.", "172.17.", "172.18.", "172.19.",
    "172.20.", "172.21.", "172.22.", "172.23.", "172.24.", "172.25.",
    "172.26.", "172.27.", "172.28.", "172.29.", "172.30.", "172.31.",
    "127.", "169.254.", "::1",
)


# ──────────────────────────────────────────────────────────
# Block log persistence
# ──────────────────────────────────────────────────────────
def load_block_log() -> list:
    """Load the JSON block log from disk."""
    try:
        with open(BLOCK_LOG_FILE) as f:
            return json.load(f)
    except FileNotFoundError:
        return []
    except json.JSONDecodeError as e:
        log.error(f"Block log corrupt: {e} — starting fresh")
        return []


def save_block_log(entries: list) -> None:
    """Persist the block log to disk atomically."""
    tmp = BLOCK_LOG_FILE + ".tmp"
    with open(tmp, "w") as f:
        json.dump(entries, f, indent=2)
    os.replace(tmp, BLOCK_LOG_FILE)


def is_already_blocked(ip: str) -> bool:
    return any(
        e["ip"] == ip and e["status"] == "blocked"
        for e in load_block_log()
    )


# ──────────────────────────────────────────────────────────
# Validation helpers
# ──────────────────────────────────────────────────────────
def validate_ip(ip: str) -> bool:
    """Return True if ip is a valid IPv4/IPv6 address."""
    try:
        ipaddress.ip_address(ip)
        return True
    except ValueError:
        return False


def is_public_ip(ip: str) -> bool:
    return not any(ip.startswith(p) for p in PRIVATE_PREFIXES)


# ──────────────────────────────────────────────────────────
# Enforcement backends
# ──────────────────────────────────────────────────────────
def _run(cmd: list, dry_run: bool) -> bool:
    """Execute a system command, or print it in dry-run mode."""
    if dry_run:
        log.info(f"  DRY RUN: {' '.join(cmd)}")
        return True
    try:
        result = subprocess.run(
            cmd, capture_output=True, text=True, timeout=10
        )
        if result.returncode != 0:
            log.error(f"Command failed: {' '.join(cmd)}\n{result.stderr.strip()}")
            return False
        return True
    except subprocess.TimeoutExpired:
        log.error(f"Timeout: {' '.join(cmd)}")
        return False
    except FileNotFoundError:
        log.error(f"Binary not found: {cmd[0]}")
        return False


def block_via_iptables(ip: str, dry_run: bool = False) -> bool:
    """
    Drop all traffic to/from ip using iptables.
    Inserts rules at position 1 to ensure they take precedence.
    """
    log.info(f"Applying iptables rules for {ip}")
    rules = [
        ["iptables", "-I", "INPUT",   "1", "-s", ip, "-j", "DROP"],
        ["iptables", "-I", "OUTPUT",  "1", "-d", ip, "-j", "DROP"],
        ["iptables", "-I", "FORWARD", "1", "-s", ip, "-j", "DROP"],
    ]
    ok = all(_run(r, dry_run) for r in rules)

    # Persist rules so they survive reboot
    if ok and not dry_run:
        _run(["iptables-save", "-f", "/etc/iptables/rules.v4"], dry_run=False)

    return ok


def unblock_via_iptables(ip: str, dry_run: bool = False) -> bool:
    """Remove iptables DROP rules for ip."""
    log.info(f"Removing iptables rules for {ip}")
    rules = [
        ["iptables", "-D", "INPUT",   "-s", ip, "-j", "DROP"],
        ["iptables", "-D", "OUTPUT",  "-d", ip, "-j", "DROP"],
        ["iptables", "-D", "FORWARD", "-s", ip, "-j", "DROP"],
    ]
    # Don't fail if a rule doesn't exist — DELETE is idempotent
    for r in rules:
        _run(r, dry_run)

    if not dry_run:
        _run(["iptables-save", "-f", "/etc/iptables/rules.v4"], dry_run=False)
    return True


def block_via_pfsense(ip: str, reason: str, dry_run: bool = False) -> bool:
    """
    Add a WAN block rule via the pfSense API package.
    Requires: pkg install pfSense-pkg-API on the firewall.
    Falls back gracefully if pfSense is unreachable.
    """
    if dry_run:
        log.info(f"  DRY RUN: Would POST block rule for {ip} to pfSense")
        return True

    payload = {
        "type":      "block",
        "interface": "wan",
        "src":       ip,
        "dst":       "any",
        "ipprotocol": "inet",
        "descr":     f"[SOC-AUTO] {reason[:80]} — {datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')}",
    }
    try:
        r = requests.post(
            f"{PFSENSE_HOST}/api/v1/firewall/rule",
            json=payload,
            auth=(PFSENSE_USER, PFSENSE_PASS),
            verify=False,
            timeout=15,
        )
        if r.status_code in (200, 201):
            log.info(f"pfSense WAN block rule created for {ip}")
            # Apply the ruleset
            requests.post(
                f"{PFSENSE_HOST}/api/v1/firewall/apply",
                auth=(PFSENSE_USER, PFSENSE_PASS),
                verify=False, timeout=10,
            )
            return True
        log.warning(f"pfSense returned HTTP {r.status_code}: {r.text[:200]}")
        return False
    except requests.exceptions.ConnectionError:
        log.warning("pfSense unreachable — iptables-only enforcement applied")
        return False
    except Exception as e:
        log.warning(f"pfSense error: {e}")
        return False


# ──────────────────────────────────────────────────────────
# TheHive notification
# ──────────────────────────────────────────────────────────
def notify_thehive(ip: str, action: str, reason: str) -> None:
    """
    Find TheHive cases mentioning this IP and add a completed task
    to record the block/unblock action.
    """
    headers = {
        "Authorization": f"Bearer {THEHIVE_KEY}",
        "Content-Type":  "application/json",
    }
    try:
        # Search for cases containing this IP in the title
        r = requests.post(
            f"{THEHIVE_HOST}/api/v1/query",
            json={"query": [
                {"_name": "listCase"},
                {"_name": "filter", "_like": {"_field": "title", "_value": ip}},
                {"_name": "page", "from": 0, "to": 5},
            ]},
            headers=headers, timeout=10,
        )
        if r.status_code != 200:
            return

        cases = r.json()
        for case in cases[:2]:
            case_id = case.get("_id")
            if not case_id:
                continue
            requests.post(
                f"{THEHIVE_HOST}/api/v1/case/{case_id}/task",
                json={
                    "title":       f"IP {action}: {ip}",
                    "description": f"**Action:** {action}\n**IP:** {ip}\n**Reason:** {reason}\n"
                                   f"**Time:** {datetime.now(timezone.utc).isoformat()}\n"
                                   f"**Methods:** iptables + pfSense API",
                    "status":      "Completed",
                    "group":       "Containment",
                },
                headers=headers, timeout=10,
            )
            log.info(f"TheHive case {case_id} updated with {action} task")
    except Exception as e:
        log.warning(f"TheHive notification failed: {e}")


# ──────────────────────────────────────────────────────────
# Public API
# ──────────────────────────────────────────────────────────
def block_ip(ip: str, reason: str = "SOC Auto-Block", dry_run: bool = False) -> bool:
    """
    Block an IP address via iptables (always) and pfSense (if available).

    Safety checks applied:
      - Validates IP format
      - Refuses to block whitelisted SOC infrastructure IPs
      - Skips if already blocked
      - Logs all actions to BLOCK_LOG_FILE
    """
    # ── Validation ────────────────────────────────────────
    if not validate_ip(ip):
        log.error(f"Invalid IP address format: {ip!r}")
        return False

    if ip in NEVER_BLOCK:
        log.error(
            f"REFUSED: {ip} is in the SOC infrastructure whitelist. "
            f"Blocking it would break SOC operations."
        )
        return False

    if not is_public_ip(ip):
        log.warning(f"Skipping private/reserved IP: {ip}")
        return False

    if is_already_blocked(ip):
        log.warning(f"{ip} is already blocked — nothing to do")
        return True

    # ── Enforcement ───────────────────────────────────────
    log.info(f"{'[DRY RUN] ' if dry_run else ''}Blocking IP: {ip} — {reason}")

    iptables_ok = block_via_iptables(ip, dry_run)
    pfsense_ok  = block_via_pfsense(ip, reason, dry_run)

    # ── Persistence and notification ──────────────────────
    if not dry_run:
        entries = load_block_log()
        entries.append({
            "ip":         ip,
            "reason":     reason,
            "blocked_at": datetime.now(timezone.utc).isoformat(),
            "status":     "blocked",
            "methods": {
                "iptables": iptables_ok,
                "pfsense":  pfsense_ok,
            },
        })
        save_block_log(entries)
        notify_thehive(ip, "BLOCKED", reason)

    log.info(
        f"{'[DRY RUN] ' if dry_run else ''}Block result — "
        f"iptables: {'✓' if iptables_ok else '✗'}  "
        f"pfSense: {'✓' if pfsense_ok else '✗ (fallback)'}"
    )
    return iptables_ok   # iptables is the guaranteed enforcement path


def unblock_ip(ip: str, dry_run: bool = False) -> bool:
    """
    Remove an existing block for ip.
    Updates the block log status to 'unblocked'.
    """
    if not validate_ip(ip):
        log.error(f"Invalid IP address: {ip!r}")
        return False

    log.info(f"{'[DRY RUN] ' if dry_run else ''}Unblocking IP: {ip}")
    ok = unblock_via_iptables(ip, dry_run)

    if not dry_run:
        entries = load_block_log()
        updated = False
        for entry in entries:
            if entry["ip"] == ip and entry["status"] == "blocked":
                entry["status"]       = "unblocked"
                entry["unblocked_at"] = datetime.now(timezone.utc).isoformat()
                updated = True
        if updated:
            save_block_log(entries)
            notify_thehive(ip, "UNBLOCKED", "Manual unblock via block_ip.py")
        else:
            log.warning(f"{ip} was not found in the block log as 'blocked'")

    log.info(f"Unblock complete: {ip}")
    return ok


def list_blocked() -> None:
    """Print a table of all currently blocked IPs."""
    entries = load_block_log()
    blocked = [e for e in entries if e.get("status") == "blocked"]

    if not blocked:
        print("No IPs are currently blocked.")
        return

    header = f"{'IP Address':<20} {'Blocked At':<28} {'Methods':<20} {'Reason'}"
    print(f"\n{header}")
    print("-" * 90)
    for e in blocked:
        methods = "+".join(
            k for k, v in e.get("methods", {}).items() if v
        )
        print(
            f"{e['ip']:<20} "
            f"{e['blocked_at']:<28} "
            f"{methods:<20} "
            f"{e['reason'][:35]}"
        )
    print(f"\nTotal blocked: {len(blocked)}")


def block_from_file(filepath: str, reason: str, dry_run: bool = False) -> None:
    """Block every IP listed in a file (one per line, # for comments)."""
    try:
        with open(filepath) as f:
            ips = [
                line.strip() for line in f
                if line.strip() and not line.startswith("#")
            ]
    except FileNotFoundError:
        log.error(f"File not found: {filepath}")
        sys.exit(1)

    log.info(f"Blocking {len(ips)} IPs from {filepath}")
    ok_count = 0
    for ip in ips:
        if block_ip(ip, reason=reason, dry_run=dry_run):
            ok_count += 1

    log.info(f"Bulk block complete: {ok_count}/{len(ips)} succeeded")


# ──────────────────────────────────────────────────────────
# CLI
# ──────────────────────────────────────────────────────────
def main():
    parser = argparse.ArgumentParser(
        description="SOC Lab — Automated IP Blocker (iptables + pfSense)",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python3 block_ip.py --ip 203.0.113.45 --reason "SSH brute force T1110"
  python3 block_ip.py --ip 203.0.113.45 --test          # dry run
  python3 block_ip.py --ip 203.0.113.45 --unblock
  python3 block_ip.py --file malicious_ips.txt --reason "MISP IOC"
  python3 block_ip.py --list-blocked
        """,
    )
    parser.add_argument("--ip",           type=str,  help="Single IP address to act on")
    parser.add_argument("--file",         type=str,  help="File with one IP per line")
    parser.add_argument("--reason",       type=str,  default="SOC Auto-Block",
                        help="Reason recorded in block log and TheHive")
    parser.add_argument("--unblock",      action="store_true",
                        help="Remove existing block for --ip")
    parser.add_argument("--list-blocked", action="store_true",
                        help="Show all currently blocked IPs")
    parser.add_argument("--test",         action="store_true",
                        help="Dry run — print commands without executing")
    args = parser.parse_args()

    if args.list_blocked:
        list_blocked()
        return

    if args.file:
        block_from_file(args.file, reason=args.reason, dry_run=args.test)
        return

    if not args.ip:
        parser.print_help()
        sys.exit(1)

    if args.unblock:
        sys.exit(0 if unblock_ip(args.ip, dry_run=args.test) else 1)
    else:
        sys.exit(0 if block_ip(args.ip, reason=args.reason, dry_run=args.test) else 1)


if __name__ == "__main__":
    main()