#!/usr/bin/env python3
"""
Advanced SOC Lab — abuseipdb_enrichment.py
===========================================
Enriches IP addresses from Wazuh alerts with AbuseIPDB reputation data.
Can be run standalone or called by auto_investigate.py.

Usage:
    python3 abuseipdb_enrichment.py --ip 203.0.113.45
    python3 abuseipdb_enrichment.py --file ips.txt
    python3 abuseipdb_enrichment.py --wazuh-alerts   # Read from Wazuh API
    python3 abuseipdb_enrichment.py --test

Environment Variables:
    ABUSEIPDB_API_KEY   — Required
    VIRUSTOTAL_API_KEY  — Optional, for VT cross-check
"""

import os
import sys
import json
import time
import logging
import argparse
import ipaddress
from datetime import datetime, timezone
from typing import Optional
import requests
import urllib3

urllib3.disable_warnings()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)]
)
log = logging.getLogger("abuseipdb_enrichment")

# ── Config ────────────────────────────────────────────────
ABUSEIPDB_API_KEY  = os.getenv("ABUSEIPDB_API_KEY",  "your-abuseipdb-api-key")
VIRUSTOTAL_API_KEY = os.getenv("VIRUSTOTAL_API_KEY",  "your-virustotal-api-key")

# Confidence threshold to flag as malicious
MALICIOUS_THRESHOLD = int(os.getenv("MALICIOUS_THRESHOLD", "50"))

# Private IP ranges — never enrich these
PRIVATE_RANGES = [
    ipaddress.ip_network("10.0.0.0/8"),
    ipaddress.ip_network("172.16.0.0/12"),
    ipaddress.ip_network("192.168.0.0/16"),
    ipaddress.ip_network("127.0.0.0/8"),
    ipaddress.ip_network("169.254.0.0/16"),
]

# In-memory cache to avoid redundant API calls
_cache: dict = {}


def is_private(ip: str) -> bool:
    """Return True if the IP is in a private range."""
    try:
        addr = ipaddress.ip_address(ip.split(":")[0])
        return any(addr in net for net in PRIVATE_RANGES)
    except ValueError:
        return False


def check_abuseipdb(ip: str, max_age_days: int = 90) -> dict:
    """
    Query AbuseIPDB for IP reputation.
    Returns enrichment dict with confidence score, country, ISP, etc.
    """
    if ip in _cache:
        log.debug(f"Cache hit for {ip}")
        return _cache[ip]

    if is_private(ip):
        result = {"ip": ip, "is_public": False, "skipped": "private_ip"}
        _cache[ip] = result
        return result

    try:
        response = requests.get(
            "https://api.abuseipdb.com/api/v2/check",
            params={"ipAddress": ip, "maxAgeInDays": max_age_days, "verbose": ""},
            headers={"Key": ABUSEIPDB_API_KEY, "Accept": "application/json"},
            timeout=10,
        )

        if response.status_code == 429:
            log.warning("AbuseIPDB rate limit hit. Sleeping 60s...")
            time.sleep(60)
            return check_abuseipdb(ip, max_age_days)

        response.raise_for_status()
        data = response.json().get("data", {})

        result = {
            "ip":               ip,
            "is_public":        True,
            "abuse_score":      data.get("abuseConfidenceScore", 0),
            "is_malicious":     data.get("abuseConfidenceScore", 0) >= MALICIOUS_THRESHOLD,
            "country_code":     data.get("countryCode", "Unknown"),
            "country_name":     data.get("countryName", "Unknown"),
            "isp":              data.get("isp", "Unknown"),
            "domain":           data.get("domain", ""),
            "usage_type":       data.get("usageType", ""),
            "is_tor":           data.get("isTor", False),
            "is_proxy":         data.get("isProxy", False),
            "total_reports":    data.get("totalReports", 0),
            "last_reported_at": data.get("lastReportedAt", ""),
            "whitelisted":      data.get("isWhitelisted", False),
            "num_distinct_users": data.get("numDistinctUsers", 0),
            "source":           "AbuseIPDB",
            "queried_at":       datetime.now(timezone.utc).isoformat(),
        }

        # Add recent report categories if verbose
        recent_reports = data.get("reports", [])[:3]
        if recent_reports:
            result["recent_categories"] = [r.get("categories", []) for r in recent_reports]

        _cache[ip] = result
        log.info(f"AbuseIPDB {ip}: score={result['abuse_score']}%, country={result['country_code']}, ISP={result['isp']}")
        return result

    except requests.exceptions.ConnectionError:
        log.error(f"Cannot reach AbuseIPDB API. Check network.")
    except Exception as e:
        log.error(f"AbuseIPDB error for {ip}: {e}")

    error_result = {"ip": ip, "is_public": True, "error": str(e), "source": "AbuseIPDB"}
    _cache[ip] = error_result
    return error_result


def check_virustotal(ip: str) -> dict:
    """
    Cross-check IP reputation with VirusTotal.
    Returns detection count and malicious engines.
    """
    if not VIRUSTOTAL_API_KEY or VIRUSTOTAL_API_KEY == "your-virustotal-api-key":
        return {"ip": ip, "skipped": "no_api_key"}

    try:
        response = requests.get(
            f"https://www.virustotal.com/api/v3/ip_addresses/{ip}",
            headers={"x-apikey": VIRUSTOTAL_API_KEY},
            timeout=10,
        )
        if response.status_code == 429:
            log.warning("VirusTotal rate limit. Sleeping 30s...")
            time.sleep(30)
            return check_virustotal(ip)

        response.raise_for_status()
        data = response.json().get("data", {}).get("attributes", {})
        stats = data.get("last_analysis_stats", {})

        return {
            "ip":                    ip,
            "vt_malicious_engines":  stats.get("malicious", 0),
            "vt_suspicious_engines": stats.get("suspicious", 0),
            "vt_clean_engines":      stats.get("harmless", 0),
            "vt_total_engines":      sum(stats.values()),
            "vt_reputation":         data.get("reputation", 0),
            "vt_as_owner":           data.get("as_owner", ""),
            "vt_country":            data.get("country", ""),
            "vt_is_malicious":       stats.get("malicious", 0) > 3,
            "source":                "VirusTotal",
        }
    except Exception as e:
        log.warning(f"VirusTotal error for {ip}: {e}")
        return {"ip": ip, "error": str(e), "source": "VirusTotal"}


def enrich_ip(ip: str, use_virustotal: bool = False) -> dict:
    """Full enrichment pipeline: AbuseIPDB + optional VirusTotal."""
    enrichment = check_abuseipdb(ip)

    if use_virustotal:
        vt_data = check_virustotal(ip)
        enrichment.update(vt_data)

    # Aggregate risk score
    abuse = enrichment.get("abuse_score", 0)
    vt_mal = enrichment.get("vt_malicious_engines", 0)

    risk_score = min(100, abuse + (vt_mal * 5))
    enrichment["composite_risk_score"] = risk_score
    enrichment["risk_level"] = (
        "Critical" if risk_score >= 90 else
        "High"     if risk_score >= 70 else
        "Medium"   if risk_score >= 40 else
        "Low"
    )

    return enrichment


def enrich_list(ips: list, delay: float = 0.5) -> list:
    """Enrich a list of IPs with rate limiting."""
    results = []
    for i, ip in enumerate(ips):
        ip = ip.strip()
        if not ip or ip.startswith("#"):
            continue
        log.info(f"[{i+1}/{len(ips)}] Enriching {ip}")
        result = enrich_ip(ip)
        results.append(result)
        if i < len(ips) - 1:
            time.sleep(delay)
    return results


def print_enrichment(data: dict):
    """Pretty-print an IP enrichment result."""
    risk = data.get("risk_level", "Unknown")
    color = {"Critical": "🔴", "High": "🟠", "Medium": "🟡", "Low": "🟢"}.get(risk, "⚪")

    print(f"\n{color} IP Enrichment: {data.get('ip')}")
    print(f"  {'─'*40}")
    if data.get("skipped"):
        print(f"  Skipped: {data['skipped']}")
        return

    for k, v in data.items():
        if k in ("ip", "source", "queried_at") or v is None or v == "":
            continue
        key_label = k.replace("_", " ").title()
        print(f"  {key_label:<28}: {v}")


# ── Mock data for testing ─────────────────────────────────
MOCK_ENRICHMENTS = {
    "203.0.113.45": {
        "ip": "203.0.113.45", "is_public": True, "abuse_score": 94,
        "is_malicious": True, "country_code": "RU", "country_name": "Russia",
        "isp": "Hosting Services Ltd", "is_tor": False, "total_reports": 847,
        "source": "AbuseIPDB (mock)", "risk_level": "Critical", "composite_risk_score": 94,
    },
    "198.51.100.23": {
        "ip": "198.51.100.23", "is_public": True, "abuse_score": 78,
        "is_malicious": True, "country_code": "RO", "country_name": "Romania",
        "isp": "VPN Service Inc", "is_tor": True, "total_reports": 312,
        "source": "AbuseIPDB (mock)", "risk_level": "High", "composite_risk_score": 78,
    },
}


def main():
    parser = argparse.ArgumentParser(description="SOC IP Reputation Enrichment Tool")
    parser.add_argument("--ip",    type=str, help="Single IP to enrich")
    parser.add_argument("--file",  type=str, help="File with one IP per line")
    parser.add_argument("--vt",    action="store_true", help="Also check VirusTotal")
    parser.add_argument("--json",  action="store_true", help="Output as JSON")
    parser.add_argument("--test",  action="store_true", help="Use mock data")
    parser.add_argument("--wazuh-alerts", action="store_true", help="Process IPs from Wazuh alerts")
    args = parser.parse_args()

    if args.test:
        log.info("TEST MODE — Using mock enrichment data")
        for ip, data in MOCK_ENRICHMENTS.items():
            print_enrichment(data)
        return

    results = []

    if args.ip:
        result = enrich_ip(args.ip, use_virustotal=args.vt)
        results = [result]
        if not args.json:
            print_enrichment(result)

    elif args.file:
        try:
            with open(args.file) as f:
                ips = [line.strip() for line in f if line.strip()]
            results = enrich_list(ips)
            if not args.json:
                for r in results:
                    print_enrichment(r)
        except FileNotFoundError:
            log.error(f"File not found: {args.file}")
            sys.exit(1)

    elif args.wazuh_alerts:
        log.info("Fetching recent Wazuh alerts for IP extraction...")
        # Integration point with auto_investigate.py
        log.warning("Use auto_investigate.py --daemon for full Wazuh integration")

    else:
        parser.print_help()
        return

    if args.json and results:
        print(json.dumps(results, indent=2, default=str))


if __name__ == "__main__":
    main()