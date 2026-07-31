#!/usr/bin/env python3
"""
Advanced SOC Lab — auto_investigate.py
======================================
Fetches critical Wazuh alerts → Enriches with AbuseIPDB/VirusTotal
→ Auto-creates TheHive cases with severity, MITRE mapping, and IOCs.

Usage:
    python3 auto_investigate.py --run-once
    python3 auto_investigate.py --daemon
    python3 auto_investigate.py --test

Environment Variables:
    WAZUH_HOST, WAZUH_USER, WAZUH_PASS
    THEHIVE_HOST, THEHIVE_API_KEY
    ABUSEIPDB_API_KEY
    VIRUSTOTAL_API_KEY
"""

import os
import sys
import json
import time
import logging
import argparse
import requests
from datetime import datetime, timedelta, timezone
from typing import Optional
import urllib3

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

# ── Logging ───────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler("/var/log/soc-auto-investigate.log"),
    ],
)
log = logging.getLogger("auto_investigate")

# ── Configuration ─────────────────────────────────────────
CONFIG = {
    "wazuh": {
        "host":       os.getenv("WAZUH_HOST", "https://192.168.56.10:55000"),
        "user":       os.getenv("WAZUH_USER", "wazuh-wui"),
        "password":   os.getenv("WAZUH_PASS", "MyS3cr37P450r.*-"),
        "index_host": os.getenv("ES_HOST",    "https://192.168.56.10:9200"),
        "index_user": os.getenv("ES_USER",    "admin"),
        "index_pass": os.getenv("ES_PASS",    "SecretPassword1!"),
    },
    "thehive": {
        "host":    os.getenv("THEHIVE_HOST",    "http://192.168.56.10:9000"),
        "api_key": os.getenv("THEHIVE_API_KEY", "your-thehive-api-key"),
    },
    "abuseipdb": {
        "api_key":   os.getenv("ABUSEIPDB_API_KEY", "your-abuseipdb-key"),
        "threshold": int(os.getenv("MALICIOUS_THRESHOLD", "50")),
    },
    "virustotal": {
        "api_key": os.getenv("VIRUSTOTAL_API_KEY", "your-vt-key"),
    },
    "alert_min_level":  int(os.getenv("ALERT_MIN_LEVEL",   "10")),
    "check_interval":   int(os.getenv("CHECK_INTERVAL_S",  "60")),
    "lookback_minutes": int(os.getenv("LOOKBACK_MINUTES",  "5")),
}

# Wazuh rule level → TheHive severity (1=Low … 4=Critical)
LEVEL_TO_SEVERITY = {
    range(1,  8):  1,   # Low
    range(8,  12): 2,   # Medium
    range(12, 15): 3,   # High
    range(15, 16): 4,   # Critical
}

PRIVATE_PREFIXES = ("10.", "192.168.", "172.16.", "172.17.", "172.18.",
                    "172.19.", "172.20.", "172.21.", "172.22.", "172.23.",
                    "172.24.", "172.25.", "172.26.", "172.27.", "172.28.",
                    "172.29.", "172.30.", "172.31.", "127.", "0.", "169.254.")


def _level_to_severity(level: int) -> int:
    if level >= 15: return 4
    if level >= 12: return 3
    if level >= 8:  return 2
    return 1


def _is_public_ip(ip: str) -> bool:
    return ip and not any(ip.startswith(p) for p in PRIVATE_PREFIXES)


def _get_nested(d: dict, path: str):
    """Safely traverse a dotted field path in a nested dict."""
    for key in path.split("."):
        if not isinstance(d, dict):
            return None
        d = d.get(key)
    return d


# ──────────────────────────────────────────────────────────
# Wazuh / Elasticsearch client
# ──────────────────────────────────────────────────────────
class WazuhClient:
    """Authenticate to Wazuh API and query alerts from the Indexer."""

    def __init__(self):
        self.base     = CONFIG["wazuh"]["host"]
        self.es_host  = CONFIG["wazuh"]["index_host"]
        self.es_auth  = (CONFIG["wazuh"]["index_user"], CONFIG["wazuh"]["index_pass"])
        self.token    = None

    def authenticate(self) -> bool:
        """Obtain a JWT from the Wazuh Manager API."""
        try:
            r = requests.post(
                f"{self.base}/security/user/authenticate",
                auth=(CONFIG["wazuh"]["user"], CONFIG["wazuh"]["password"]),
                verify=False, timeout=10,
            )
            r.raise_for_status()
            self.token = r.json()["data"]["token"]
            log.info("Authenticated with Wazuh API ✓")
            return True
        except Exception as e:
            log.error(f"Wazuh authentication failed: {e}")
            return False

    def get_recent_alerts(self, min_level: int = 10, lookback_minutes: int = 5) -> list:
        """
        Query Wazuh Indexer (Elasticsearch-compatible) for alerts
        within the lookback window at or above min_level.
        """
        since = (datetime.now(timezone.utc) - timedelta(minutes=lookback_minutes)).isoformat()
        query = {
            "query": {
                "bool": {
                    "must": [
                        {"range": {"timestamp":   {"gte": since}}},
                        {"range": {"rule.level":  {"gte": min_level}}},
                    ]
                }
            },
            "sort": [{"timestamp": {"order": "desc"}}],
            "size": 200,
        }
        try:
            r = requests.post(
                f"{self.es_host}/wazuh-alerts-*/_search",
                json=query,
                auth=self.es_auth,
                verify=False,
                timeout=20,
                headers={"Content-Type": "application/json"},
            )
            r.raise_for_status()
            hits = r.json().get("hits", {}).get("hits", [])
            log.info(f"Fetched {len(hits)} alerts (level >= {min_level}, last {lookback_minutes}m)")
            return [h["_source"] for h in hits]
        except Exception as e:
            log.error(f"Elasticsearch query failed: {e}")
            return []


# ──────────────────────────────────────────────────────────
# Threat Intelligence enrichment
# ──────────────────────────────────────────────────────────
class ThreatEnricher:
    """Enrich IPs and file hashes using AbuseIPDB and VirusTotal."""

    def __init__(self):
        self._cache: dict = {}

    # ── AbuseIPDB ─────────────────────────────────────────
    def enrich_ip(self, ip: str) -> dict:
        """Return AbuseIPDB reputation data for a public IP."""
        if ip in self._cache:
            return self._cache[ip]

        try:
            r = requests.get(
                "https://api.abuseipdb.com/api/v2/check",
                params={"ipAddress": ip, "maxAgeInDays": 90},
                headers={
                    "Key":    CONFIG["abuseipdb"]["api_key"],
                    "Accept": "application/json",
                },
                timeout=10,
            )
            if r.status_code == 429:
                log.warning("AbuseIPDB rate limit — sleeping 60s")
                time.sleep(60)
                return self.enrich_ip(ip)
            if r.status_code == 200:
                data = r.json().get("data", {})
                score = data.get("abuseConfidenceScore", 0)
                result = {
                    "ip":            ip,
                    "abuse_score":   score,
                    "is_malicious":  score >= CONFIG["abuseipdb"]["threshold"],
                    "country":       data.get("countryCode", "??"),
                    "isp":           data.get("isp", "Unknown"),
                    "total_reports": data.get("totalReports", 0),
                    "last_reported": data.get("lastReportedAt", ""),
                    "is_tor":        data.get("isTor", False),
                    "source":        "AbuseIPDB",
                }
                self._cache[ip] = result
                log.info(f"AbuseIPDB {ip}: score={score}%, country={result['country']}")
                return result
        except Exception as e:
            log.warning(f"AbuseIPDB error for {ip}: {e}")
        return {"ip": ip, "abuse_score": 0, "is_malicious": False, "source": "AbuseIPDB(error)"}

    # ── VirusTotal ────────────────────────────────────────
    def enrich_hash(self, file_hash: str) -> dict:
        """Return VirusTotal detection stats for a file hash."""
        key = CONFIG["virustotal"]["api_key"]
        if not key or key == "your-vt-key":
            return {"hash": file_hash, "skipped": "no_api_key"}
        try:
            r = requests.get(
                f"https://www.virustotal.com/api/v3/files/{file_hash}",
                headers={"x-apikey": key},
                timeout=10,
            )
            if r.status_code == 429:
                log.warning("VirusTotal rate limit — sleeping 30s")
                time.sleep(30)
                return self.enrich_hash(file_hash)
            if r.status_code == 200:
                attrs = r.json().get("data", {}).get("attributes", {})
                stats = attrs.get("last_analysis_stats", {})
                mal   = stats.get("malicious", 0)
                return {
                    "hash":              file_hash,
                    "malicious_engines": mal,
                    "total_engines":     sum(stats.values()),
                    "is_malicious":      mal > 3,
                    "reputation":        attrs.get("reputation", 0),
                    "source":            "VirusTotal",
                }
        except Exception as e:
            log.warning(f"VirusTotal error for {file_hash}: {e}")
        return {"hash": file_hash, "malicious_engines": 0, "is_malicious": False, "source": "VirusTotal(error)"}

    # ── IOC extraction ────────────────────────────────────
    def extract_iocs(self, alert: dict) -> dict:
        """Pull IPs and hashes from a raw Wazuh alert document."""
        iocs = {"ips": [], "hashes": []}

        ip_fields = [
            "data.srcip", "data.src_ip", "data.attack.srcip",
            "data.win.eventdata.destinationIp",
            "data.win.eventdata.sourceIp",
        ]
        for field in ip_fields:
            ip = _get_nested(alert, field)
            if ip and _is_public_ip(str(ip)) and ip not in iocs["ips"]:
                iocs["ips"].append(ip)

        hash_fields = [
            "data.win.eventdata.hashes",
            "syscheck.sha256_after",
            "syscheck.md5_after",
        ]
        for field in hash_fields:
            h = _get_nested(alert, field)
            if h:
                # Sysmon hashes: "MD5=abc,SHA256=xyz" — extract SHA256
                if "SHA256=" in str(h):
                    h = h.split("SHA256=")[-1].split(",")[0]
                if h not in iocs["hashes"]:
                    iocs["hashes"].append(h)

        return iocs


# ──────────────────────────────────────────────────────────
# TheHive case management
# ──────────────────────────────────────────────────────────
class TheHiveClient:
    """Create and update TheHive 5 cases via its REST API."""

    def __init__(self):
        self.base    = CONFIG["thehive"]["host"]
        self.headers = {
            "Authorization": f"Bearer {CONFIG['thehive']['api_key']}",
            "Content-Type":  "application/json",
        }

    def _post(self, endpoint: str, payload: dict, timeout: int = 15) -> Optional[dict]:
        try:
            r = requests.post(
                f"{self.base}{endpoint}",
                json=payload,
                headers=self.headers,
                timeout=timeout,
            )
            r.raise_for_status()
            return r.json()
        except requests.exceptions.ConnectionError:
            log.error(f"Cannot reach TheHive at {self.base}")
        except Exception as e:
            log.error(f"TheHive POST {endpoint} failed: {e}")
        return None

    def create_case(self, alert: dict, enrichment: dict, iocs: dict) -> Optional[str]:
        """
        Build and submit a TheHive case from a Wazuh alert.
        Returns the new case _id, or None on failure.
        """
        rule      = alert.get("rule", {})
        level     = rule.get("level", 0)
        mitre_ids = rule.get("mitre", {}).get("id", [])
        severity  = _level_to_severity(level)

        # Build IP enrichment block for description
        ip_block = ""
        for ip_data in enrichment.get("ips", []):
            score = ip_data.get("abuse_score", 0)
            flag  = "🔴" if ip_data.get("is_malicious") else "🟡"
            ip_block += (
                f"\n- {flag} `{ip_data['ip']}` — AbuseIPDB: **{score}%** "
                f"({ip_data.get('country','?')} / {ip_data.get('isp','?')})"
            )

        hash_block = ""
        for h_data in enrichment.get("hashes", []):
            mal = h_data.get("malicious_engines", 0)
            tot = h_data.get("total_engines", 0)
            hash_block += f"\n- `{h_data['hash']}` — VirusTotal: **{mal}/{tot}** engines"

        description = f"""\
## Wazuh Alert — Auto-Generated Case

| Field | Value |
|---|---|
| **Rule ID** | {rule.get('id', '?')} |
| **Rule Level** | {level}/15 |
| **Description** | {rule.get('description', 'N/A')} |
| **Agent** | {_get_nested(alert, 'agent.name')} ({_get_nested(alert, 'agent.ip')}) |
| **Timestamp** | {alert.get('timestamp', 'N/A')} |
| **MITRE ATT&CK** | {', '.join(mitre_ids) or 'N/A'} |
| **Groups** | {', '.join(rule.get('groups', []))} |

## IP Reputation{ip_block or chr(10) + '_None extracted_'}

## File Hash Intel{hash_block or chr(10) + '_None extracted_'}

## Raw Alert (truncated)
```json
{json.dumps(alert.get('data', {}), indent=2)[:1500]}
```

---
*Auto-created by `auto_investigate.py` — Advanced SOC Lab*
"""

        tags = ["wazuh-auto", f"level-{level}"] + mitre_ids
        if level >= 15:
            tags.append("P1-CRITICAL")

        payload = {
            "title":       f"[SOC-AUTO] {rule.get('description', 'Unknown Alert')[:120]}",
            "description": description,
            "severity":    severity,
            "startDate":   int(datetime.now().timestamp() * 1000),
            "tags":        tags,
            "flag":        level >= 14,
            "tlp":         2,
            "pap":         2,
            "tasks":       self._build_tasks(rule, iocs),
        }

        result = self._post("/api/v1/case", payload)
        if result:
            case_id = result.get("_id", "")
            log.info(f"TheHive case created: {case_id} (severity {severity})")
            self._add_observables(case_id, iocs, enrichment)
            return case_id
        return None

    def _build_tasks(self, rule: dict, iocs: dict) -> list:
        """Generate response tasks appropriate to the alert type."""
        mitre_ids = rule.get("mitre", {}).get("id", [])
        tasks = [
            {"title": "1. Triage — confirm true positive vs false positive", "group": "Triage"},
            {"title": "2. Identify all affected assets and users",           "group": "Investigation"},
            {"title": "3. Review endpoint logs, Sysmon timeline",            "group": "Investigation"},
            {"title": "4. Check for lateral movement indicators",            "group": "Investigation"},
        ]
        if iocs.get("ips"):
            tasks.append({
                "title": "5. Block confirmed malicious IPs — run block_ip.py",
                "group": "Containment",
            })
        if any(t in mitre_ids for t in ["T1003", "T1003.001"]):
            tasks.append({
                "title": "URGENT: Credential dumping detected — reset all passwords for affected accounts",
                "group": "Remediation",
            })
        if "T1486" in mitre_ids or "T1490" in mitre_ids:
            tasks.append({
                "title": "CRITICAL: Ransomware indicator — isolate host immediately, notify IR team",
                "group": "Containment",
            })
        if "T1190" in mitre_ids:
            tasks.append({
                "title": "Patch exploited service and review for successful exploitation",
                "group": "Remediation",
            })
        tasks.append({"title": "Document findings, close case, update runbook", "group": "Closure"})
        return tasks

    def _add_observables(self, case_id: str, iocs: dict, enrichment: dict):
        """Attach IP and hash observables to the case."""
        for ip_data in enrichment.get("ips", []):
            ip  = ip_data.get("ip", "")
            ioc = ip_data.get("is_malicious", False)
            tags = [
                f"abuseipdb-{ip_data.get('abuse_score',0)}pct",
                ip_data.get("country", ""),
            ]
            self._post_observable(case_id, "ip", ip, ioc=ioc, tags=tags)

        for h in iocs.get("hashes", []):
            self._post_observable(case_id, "hash", h, ioc=True, tags=["sysmon"])

    def _post_observable(self, case_id: str, data_type: str, value: str,
                         ioc: bool = True, tags: list = None):
        if not value:
            return
        payload = {
            "dataType": data_type,
            "data":     value,
            "ioc":      ioc,
            "tlp":      2,
            "tags":     [t for t in (tags or []) if t],
        }
        try:
            requests.post(
                f"{self.base}/api/v1/case/{case_id}/observable",
                json=payload, headers=self.headers, timeout=10,
            )
        except Exception as e:
            log.warning(f"Observable add failed ({data_type}={value}): {e}")


# ──────────────────────────────────────────────────────────
# Mock data for --test mode
# ──────────────────────────────────────────────────────────
MOCK_ALERTS = [
    {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "rule": {
            "id": "100001", "level": 12,
            "description": "SSH brute force attack — 10+ failed attempts in 60s",
            "groups": ["authentication_failed", "soc_lab"],
            "mitre": {"id": ["T1110.001"], "tactic": ["Credential Access"]},
        },
        "agent": {"name": "ubuntu-webserver", "ip": "192.168.56.40"},
        "data": {"srcip": "203.0.113.45", "dstport": "22"},
    },
    {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "rule": {
            "id": "100013", "level": 15,
            "description": "LSASS memory access — Mimikatz credential dumping pattern",
            "groups": ["windows", "credential_access", "soc_lab"],
            "mitre": {"id": ["T1003.001"], "tactic": ["Credential Access"]},
        },
        "agent": {"name": "win10-victim", "ip": "192.168.56.30"},
        "data": {"win": {"eventdata": {
            "targetImage": "lsass.exe",
            "grantedAccess": "0x1FFFFF",
            "hashes": "MD5=d41d8cd,SHA256=5f1d8aa80a4463a86e0c2df4e3fd9d15",
        }}},
    },
    {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "rule": {
            "id": "100012", "level": 15,
            "description": "Shadow copy deletion — ransomware pre-attack stage",
            "groups": ["windows", "ransomware", "critical"],
            "mitre": {"id": ["T1490"], "tactic": ["Impact"]},
        },
        "agent": {"name": "win10-victim", "ip": "192.168.56.30"},
        "data": {"win": {"eventdata": {
            "commandLine": "vssadmin.exe delete shadows /all /quiet",
        }}},
    },
]


# ──────────────────────────────────────────────────────────
# Core pipeline
# ──────────────────────────────────────────────────────────
def process_alert(alert: dict, enricher: ThreatEnricher,
                  thehive: TheHiveClient, dry_run: bool = False):
    """
    Full triage pipeline for one alert:
      extract IOCs → AbuseIPDB/VT enrichment → TheHive case creation.
    """
    rule_id = alert.get("rule", {}).get("id", "?")
    level   = alert.get("rule", {}).get("level", 0)
    desc    = alert.get("rule", {}).get("description", "")
    log.info(f"Processing rule {rule_id} level={level}: {desc[:80]}")

    iocs = enricher.extract_iocs(alert)
    enrichment: dict = {"ips": [], "hashes": []}

    for ip in iocs["ips"]:
        data = enricher.enrich_ip(ip)
        enrichment["ips"].append(data)
        if data.get("is_malicious"):
            log.warning(f"  ⚠ MALICIOUS IP {ip} — score {data['abuse_score']}%")

    for h in iocs["hashes"]:
        data = enricher.enrich_hash(h)
        enrichment["hashes"].append(data)
        if data.get("is_malicious"):
            log.warning(f"  ⚠ MALICIOUS HASH {h[:16]}… — "
                        f"{data['malicious_engines']}/{data['total_engines']} engines")

    if dry_run:
        log.info(f"  DRY RUN — IOCs: {iocs} | Enrichment: {enrichment}")
        return

    case_id = thehive.create_case(alert, enrichment, iocs)
    if case_id:
        log.info(f"  ✓ TheHive case: {case_id}")
    else:
        log.error(f"  ✗ Case creation failed for rule {rule_id}")


def main():
    parser = argparse.ArgumentParser(
        description="SOC Auto-Investigation Engine — Wazuh → AbuseIPDB → TheHive",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument("--run-once", action="store_true",
                        help="Fetch alerts once and exit")
    parser.add_argument("--daemon",   action="store_true",
                        help=f"Poll every {CONFIG['check_interval']}s continuously")
    parser.add_argument("--test",     action="store_true",
                        help="Dry run with built-in mock alerts (no API calls)")
    args = parser.parse_args()

    enricher = ThreatEnricher()
    thehive  = TheHiveClient()

    # ── Test / dry-run mode ───────────────────────────────
    if args.test:
        log.info("=== TEST MODE — mock alerts, no external API calls ===")
        for alert in MOCK_ALERTS:
            process_alert(alert, enricher, thehive, dry_run=True)
        return

    # ── Connect to Wazuh ──────────────────────────────────
    wazuh = WazuhClient()
    if not wazuh.authenticate():
        log.error("Wazuh authentication failed — check WAZUH_HOST/USER/PASS in .env")
        sys.exit(1)

    def run_cycle():
        alerts = wazuh.get_recent_alerts(
            min_level=CONFIG["alert_min_level"],
            lookback_minutes=CONFIG["lookback_minutes"],
        )
        for alert in alerts:
            try:
                process_alert(alert, enricher, thehive)
            except Exception as e:
                log.error(f"Unhandled error processing alert: {e}", exc_info=True)
        log.info(f"Cycle complete — {len(alerts)} alerts processed")

    # ── Execute ───────────────────────────────────────────
    if args.daemon:
        log.info(f"Daemon started — polling every {CONFIG['check_interval']}s "
                 f"for level >= {CONFIG['alert_min_level']} alerts")
        while True:
            try:
                run_cycle()
            except Exception as e:
                log.error(f"Daemon cycle error: {e}", exc_info=True)
            time.sleep(CONFIG["check_interval"])
    else:
        run_cycle()


if __name__ == "__main__":
    main()