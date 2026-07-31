#!/usr/bin/env python3
"""
Advanced SOC Lab — mitre_heatmap.py
=====================================
Queries Elasticsearch/Wazuh for alert counts per MITRE ATT&CK technique,
then generates a JSON file compatible with MITRE ATT&CK Navigator.

Output:
  - mitre_coverage.json (Navigator layer format)
  - mitre_coverage_report.txt (readable summary)

Usage:
    python3 mitre_heatmap.py
    python3 mitre_heatmap.py --days 7
    python3 mitre_heatmap.py --test
    python3 mitre_heatmap.py --output /var/www/html/mitre_layer.json
"""

import os
import sys
import json
import logging
import argparse
from datetime import datetime, timedelta, timezone
import requests
import urllib3

urllib3.disable_warnings()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s"
)
log = logging.getLogger("mitre_heatmap")

# ── Config ────────────────────────────────────────────────
ES_HOST   = os.getenv("ES_HOST",   "https://192.168.56.10:9200")
ES_USER   = os.getenv("ES_USER",   "admin")
ES_PASS   = os.getenv("ES_PASS",   "admin")
ES_INDEX  = "wazuh-alerts-*"

# ── Mock MITRE data for testing ───────────────────────────
MOCK_TECHNIQUES = {
    "T1110.001": 59,   # Brute Force: Password Guessing
    "T1059.001": 3,    # Command and Scripting: PowerShell
    "T1003.001": 1,    # OS Credential Dumping: LSASS Memory
    "T1190":     16,   # Exploit Public-Facing Application
    "T1486":     0,    # Data Encrypted for Impact
    "T1490":     1,    # Inhibit System Recovery
    "T1046":     1243, # Network Service Scanning
    "T1547.001": 1,    # Registry Run Keys / Startup Folder
    "T1136.001": 1,    # Create Account: Local Account
    "T1027":     3,    # Obfuscated Files or Information
    "T1218.005": 1,    # Signed Binary Proxy Execution: Mshta
    "T1105":     2,    # Ingress Tool Transfer
    "T1047":     1,    # Windows Management Instrumentation
    "T1133":     7,    # External Remote Services
    "T1048.001": 0,    # Exfiltration Over Alternative Protocol: DNS
}

# ATT&CK tactic → technique mapping (for Navigator layer)
TACTIC_MAP = {
    "T1595":     "reconnaissance",
    "T1190":     "initial-access",
    "T1133":     "initial-access",
    "T1566":     "initial-access",
    "T1059.001": "execution",
    "T1047":     "execution",
    "T1547.001": "persistence",
    "T1136.001": "persistence",
    "T1548.003": "privilege-escalation",
    "T1027":     "defense-evasion",
    "T1218.005": "defense-evasion",
    "T1140":     "defense-evasion",
    "T1110.001": "credential-access",
    "T1003.001": "credential-access",
    "T1046":     "discovery",
    "T1021":     "lateral-movement",
    "T1560":     "collection",
    "T1105":     "command-and-control",
    "T1071.001": "command-and-control",
    "T1048.001": "exfiltration",
    "T1486":     "impact",
    "T1490":     "impact",
}


def query_elasticsearch(days: int = 30) -> dict:
    """
    Query Elasticsearch for MITRE technique counts.
    Returns dict of {technique_id: alert_count}.
    """
    since = (datetime.now(timezone.utc) - timedelta(days=days)).isoformat()

    query = {
        "query": {
            "bool": {
                "must": [
                    {"range": {"timestamp": {"gte": since}}},
                    {"exists": {"field": "rule.mitre.id"}},
                ]
            }
        },
        "aggs": {
            "mitre_techniques": {
                "terms": {
                    "field": "rule.mitre.id",
                    "size": 500
                }
            }
        },
        "size": 0
    }

    try:
        response = requests.post(
            f"{ES_HOST}/{ES_INDEX}/_search",
            json=query,
            auth=(ES_USER, ES_PASS),
            verify=False,
            timeout=30,
            headers={"Content-Type": "application/json"}
        )
        response.raise_for_status()
        buckets = response.json().get("aggregations", {}) \
                                 .get("mitre_techniques", {}) \
                                 .get("buckets", [])
        result = {b["key"]: b["doc_count"] for b in buckets}
        log.info(f"Found {len(result)} MITRE techniques in last {days} days")
        return result
    except Exception as e:
        log.error(f"Elasticsearch query failed: {e}")
        return {}


def score_to_color(count: int) -> str:
    """
    Map alert count to ATT&CK Navigator color.
    Returns hex color string.
    """
    if count == 0:
        return "#4fc3f7"   # Light blue — covered but no alerts
    elif count < 10:
        return "#ffd54f"   # Yellow — low activity
    elif count < 100:
        return "#ff8a65"   # Orange — moderate
    elif count < 500:
        return "#ef5350"   # Red — high
    else:
        return "#b71c1c"   # Dark red — critical


def generate_navigator_layer(techniques: dict, period_days: int) -> dict:
    """
    Generate MITRE ATT&CK Navigator layer JSON.
    Compatible with https://mitre-attack.github.io/attack-navigator/
    """
    timestamp = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")

    technique_list = []
    for tech_id, count in techniques.items():
        # Extract base technique (T1110 from T1110.001)
        base_id = tech_id.split(".")[0]

        entry = {
            "techniqueID": tech_id,
            "tactic": TACTIC_MAP.get(tech_id, TACTIC_MAP.get(base_id, "")),
            "score": min(count, 100),       # Navigator uses 0-100
            "color": score_to_color(count),
            "comment": f"{count} alert{'s' if count != 1 else ''} in last {period_days}d",
            "enabled": True,
            "metadata": [
                {"name": "alert_count", "value": str(count)},
                {"name": "last_seen", "value": timestamp},
            ],
            "showSubtechniques": True,
        }
        technique_list.append(entry)

    # Add uncovered techniques with distinct color
    covered = set(techniques.keys())
    all_mapped = set(TACTIC_MAP.keys())
    for tech_id in all_mapped - covered:
        technique_list.append({
            "techniqueID": tech_id,
            "tactic": TACTIC_MAP.get(tech_id, ""),
            "score": 0,
            "color": "#37474f",   # Dark grey — not covered
            "comment": "No rule coverage",
            "enabled": True,
        })

    layer = {
        "name": f"Advanced SOC Lab — Detection Coverage ({timestamp})",
        "versions": {
            "attack": "14",
            "navigator": "4.9",
            "layer": "4.5"
        },
        "domain": "enterprise-attack",
        "description": f"Wazuh rule coverage mapped to MITRE ATT&CK. Period: {period_days} days.",
        "filters": {
            "platforms": ["Windows", "Linux", "macOS", "Network"]
        },
        "sorting": 3,   # Sort by score descending
        "layout": {
            "layout": "side",
            "aggregateFunction": "max",
            "showID": True,
            "showName": True,
            "showAggregateScores": False,
            "countUnscored": False,
        },
        "hideDisabled": False,
        "techniques": technique_list,
        "gradient": {
            "colors": ["#4fc3f7", "#ffd54f", "#ff8a65", "#ef5350", "#b71c1c"],
            "minValue": 0,
            "maxValue": 100,
        },
        "legendItems": [
            {"label": "No alerts (rule exists)",  "color": "#4fc3f7"},
            {"label": "Low (1–9 alerts)",          "color": "#ffd54f"},
            {"label": "Medium (10–99)",            "color": "#ff8a65"},
            {"label": "High (100–499)",            "color": "#ef5350"},
            {"label": "Critical (500+)",           "color": "#b71c1c"},
            {"label": "No coverage",              "color": "#37474f"},
        ],
        "metadata": [
            {"name": "soc_name",     "value": "Advanced SOC Lab"},
            {"name": "generated_at", "value": timestamp},
            {"name": "period_days",  "value": str(period_days)},
            {"name": "total_alerts", "value": str(sum(techniques.values()))},
        ],
        "showTacticRowBackground": True,
        "tacticRowBackground": "#0a0f1e",
    }

    return layer


def generate_text_report(techniques: dict, period_days: int) -> str:
    """Generate a readable text summary of MITRE coverage."""
    sorted_techs = sorted(techniques.items(), key=lambda x: x[1], reverse=True)
    total = sum(techniques.values())

    lines = [
        "=" * 60,
        "  MITRE ATT&CK COVERAGE REPORT — Advanced SOC Lab",
        f"  Period: Last {period_days} days",
        f"  Generated: {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')}",
        "=" * 60,
        f"\n  {'Technique':<15} {'Count':>8}  {'Bar'}",
        f"  {'─'*15} {'─'*8}  {'─'*20}",
    ]

    for tech_id, count in sorted_techs:
        bar_len = min(20, int(count / max(1, max(v for _, v in sorted_techs)) * 20))
        bar = "█" * bar_len
        lines.append(f"  {tech_id:<15} {count:>8}  {bar}")

    lines += [
        f"\n  {'─'*50}",
        f"  {'TOTAL ALERTS':<30}: {total}",
        f"  {'TECHNIQUES WITH ALERTS':<30}: {sum(1 for v in techniques.values() if v > 0)}",
        f"  {'TECHNIQUES WITH RULES':<30}: {len(techniques)}",
        "=" * 60,
    ]
    return "\n".join(lines)


def main():
    parser = argparse.ArgumentParser(description="MITRE ATT&CK Coverage Heatmap Generator")
    parser.add_argument("--days",   type=int, default=30, help="Days to look back (default: 30)")
    parser.add_argument("--output", type=str, default="mitre_coverage.json", help="Output JSON file")
    parser.add_argument("--test",   action="store_true", help="Use mock data")
    parser.add_argument("--print",  action="store_true", help="Also print text report")
    args = parser.parse_args()

    if args.test:
        log.info("TEST MODE — using mock technique data")
        techniques = MOCK_TECHNIQUES
    else:
        techniques = query_elasticsearch(days=args.days)
        if not techniques:
            log.warning("No data from Elasticsearch. Using mock data.")
            techniques = MOCK_TECHNIQUES

    # Generate Navigator layer
    layer = generate_navigator_layer(techniques, args.days)

    # Write JSON
    output_path = args.output
    with open(output_path, "w") as f:
        json.dump(layer, f, indent=2)
    log.info(f"Navigator layer written to: {output_path}")
    log.info(f"Import at: https://mitre-attack.github.io/attack-navigator/")

    # Text report
    report = generate_text_report(techniques, args.days)
    report_path = output_path.replace(".json", "_report.txt")
    with open(report_path, "w") as f:
        f.write(report)

    if args.print:
        print(report)
    else:
        log.info(f"Text report written to: {report_path}")

    print(f"\n✅ MITRE heatmap generated:")
    print(f"   Navigator JSON : {output_path}")
    print(f"   Text Report    : {report_path}")
    print(f"   Techniques     : {len(techniques)}")
    print(f"   Total Alerts   : {sum(techniques.values())}")


if __name__ == "__main__":
    main()