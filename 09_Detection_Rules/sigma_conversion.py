#!/usr/bin/env python3
"""
Advanced SOC Lab — sigma_conversion.py
========================================
Converts Sigma YAML detection rules to Wazuh XML rule format.
Sigma is the universal SIEM rule language; this script bridges
Sigma community rules to Wazuh's local_rules.xml format.

Usage:
    python3 sigma_conversion.py --input sigma_rule.yml
    python3 sigma_conversion.py --dir ./sigma_rules/ --output local_rules.xml
    python3 sigma_conversion.py --test

Dependencies:
    pip install pyyaml
"""

import os
import sys
import json
import yaml
import logging
import argparse
from pathlib import Path
from typing import Optional
from datetime import datetime

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
log = logging.getLogger("sigma_conversion")

# ── Sigma to Wazuh field mapping ──────────────────────────
FIELD_MAP = {
    # Windows Event Log fields
    "EventID":           "win.system.eventID",
    "CommandLine":       "win.eventdata.commandLine",
    "Image":             "win.eventdata.image",
    "ParentImage":       "win.eventdata.parentImage",
    "TargetFilename":    "win.eventdata.targetFilename",
    "TargetObject":      "win.eventdata.targetObject",
    "GrantedAccess":     "win.eventdata.grantedAccess",
    "DestinationIp":     "win.eventdata.destinationIp",
    "DestinationPort":   "win.eventdata.destinationPort",
    "User":              "win.eventdata.subjectUserName",
    # Syslog
    "msg":               "message",
    "process":           "program_name",
    # Generic
    "hostname":          "agent.name",
    "ip":                "data.srcip",
}

# Sigma level → Wazuh rule level
LEVEL_MAP = {
    "informational": 3,
    "low":           6,
    "medium":        9,
    "high":          12,
    "critical":      15,
}

# Starting rule ID (must be > 100000 for custom rules)
BASE_RULE_ID = 200000


def parse_sigma_rule(rule_text: str) -> dict:
    """Parse a Sigma YAML rule into a Python dict."""
    try:
        return yaml.safe_load(rule_text)
    except yaml.YAMLError as e:
        log.error(f"YAML parse error: {e}")
        return {}


def sigma_condition_to_wazuh(detection: dict, rule_id: int) -> list:
    """
    Convert Sigma detection conditions to Wazuh XML field tags.
    Returns list of XML tag strings.
    """
    xml_conditions = []

    for key, value in detection.items():
        if key in ("condition", "timeframe"):
            continue

        if isinstance(value, dict):
            for field, pattern in value.items():
                wazuh_field = FIELD_MAP.get(field, field.lower().replace(".", "_"))
                if isinstance(pattern, list):
                    # Multiple values = OR condition
                    patterns = "|".join(str(p).replace("|", "\\|") for p in pattern)
                    xml_conditions.append(
                        f'    <field name="{wazuh_field}" type="pcre2">(?i)({patterns})</field>'
                    )
                elif isinstance(pattern, str):
                    # Check if it uses wildcards
                    if "*" in pattern:
                        regex = pattern.replace("*", ".*").replace("?", ".")
                        xml_conditions.append(
                            f'    <field name="{wazuh_field}" type="pcre2">(?i){regex}</field>'
                        )
                    else:
                        xml_conditions.append(
                            f'    <field name="{wazuh_field}" type="pcre2">(?i){pattern}</field>'
                        )
                elif isinstance(pattern, (int, bool)):
                    xml_conditions.append(
                        f'    <field name="{wazuh_field}" type="pcre2">^{pattern}$</field>'
                    )

    return xml_conditions


def sigma_to_wazuh_rule(sigma: dict, rule_id: int) -> str:
    """
    Convert a single Sigma rule dict to Wazuh XML rule string.
    """
    title       = sigma.get("title", "Converted Sigma Rule")
    description = sigma.get("description", title)
    level_str   = sigma.get("level", "medium")
    level       = LEVEL_MAP.get(level_str, 9)
    tags        = sigma.get("tags", [])
    status      = sigma.get("status", "experimental")
    detection   = sigma.get("detection", {})
    author      = sigma.get("author", "sigma")
    date        = sigma.get("date", "")

    # Extract MITRE ATT&CK technique IDs from tags
    mitre_ids = [t.replace("attack.", "").upper() for t in tags if t.startswith("attack.t")]

    # Build XML conditions
    conditions = sigma_condition_to_wazuh(detection, rule_id)

    # Determine base rule SID (Sysmon, Windows Security, etc.)
    logsource = sigma.get("logsource", {})
    category  = logsource.get("category", "")
    product   = logsource.get("product", "")
    service   = logsource.get("service", "")

    if_sid = ""
    if product == "windows" and category == "process_creation":
        if_sid = '<if_sid>61603</if_sid>  <!-- Sysmon EventID 1: Process Create -->'
    elif product == "windows" and service == "security":
        if_sid = '<if_sid>60111</if_sid>  <!-- Windows Security Log -->'
    elif category == "network_connection":
        if_sid = '<if_sid>61606</if_sid>  <!-- Sysmon EventID 3: Network -->'

    # Build rule XML
    lines = [
        f"  <!-- Converted from Sigma: {title} [{status}] — {author} {date} -->",
        f'  <rule id="{rule_id}" level="{level}">',
    ]

    if if_sid:
        lines.append(f"    {if_sid}")

    lines += conditions

    lines.append(f'    <description>SIGMA: {title}</description>')

    if mitre_ids:
        lines.append("    <mitre>")
        for mid in mitre_ids[:5]:   # Max 5 MITRE IDs per rule
            lines.append(f"      <id>{mid}</id>")
        lines.append("    </mitre>")

    groups = ["sigma_converted"]
    if product:
        groups.append(product)
    if category:
        groups.append(category.replace("_", "-"))
    lines.append(f'    <group>{",".join(groups)},</group>')
    lines.append("  </rule>")

    return "\n".join(lines)


def convert_directory(input_dir: str, output_file: str, start_id: int = BASE_RULE_ID):
    """Convert all Sigma YAML files in a directory to a Wazuh XML ruleset."""
    sigma_files = list(Path(input_dir).glob("**/*.yml")) + list(Path(input_dir).glob("**/*.yaml"))

    if not sigma_files:
        log.warning(f"No .yml/.yaml files found in {input_dir}")
        return 0

    log.info(f"Found {len(sigma_files)} Sigma rule files")
    rules_xml = []
    current_id = start_id
    converted = 0

    for sigma_file in sorted(sigma_files):
        try:
            text = sigma_file.read_text(encoding="utf-8")
            sigma = parse_sigma_rule(text)
            if not sigma:
                continue

            rule_xml = sigma_to_wazuh_rule(sigma, current_id)
            rules_xml.append(rule_xml)
            current_id += 1
            converted += 1
            log.info(f"  [ID:{current_id-1}] {sigma.get('title', sigma_file.name)}")
        except Exception as e:
            log.error(f"Error converting {sigma_file}: {e}")

    # Wrap in group
    output = f"""<?xml version="1.0" encoding="utf-8"?>
<!--
  Auto-converted Sigma rules for Wazuh
  Generated: {datetime.now().strftime("%Y-%m-%d %H:%M")}
  Source: {input_dir}
  Count: {converted} rules
  
  To apply: copy to /var/ossec/etc/rules/sigma_rules.xml
  Then: systemctl restart wazuh-manager
-->
<group name="sigma_converted,">

{"".join(chr(10) + r + chr(10) for r in rules_xml)}

</group>
"""

    Path(output_file).write_text(output, encoding="utf-8")
    log.info(f"Written {converted} rules to {output_file}")
    return converted


def demo_conversion():
    """Demonstrate conversion with a sample Sigma rule."""
    sample_sigma = """
title: Mimikatz Detection via LSASS Access
id: 61a98b9d-2f1a-4c98-b12a-7e3d5f9a4c01
status: stable
description: Detects Mimikatz or similar credential dumping tools accessing LSASS memory
author: SOC Lab / Florian Roth
date: 2024/01/15
logsource:
  category: process_access
  product: windows
detection:
  selection:
    TargetImage|endswith: 'lsass.exe'
    GrantedAccess|contains:
      - '0x1FFFFF'
      - '0x1010'
      - '0x143A'
  filter_antivirus:
    SourceImage|contains:
      - 'MsMpEng.exe'
      - 'SentinelAgent'
  condition: selection and not filter_antivirus
level: critical
tags:
  - attack.credential_access
  - attack.t1003.001
falsepositives:
  - Legitimate security products accessing LSASS
"""

    sigma = parse_sigma_rule(sample_sigma)
    xml = sigma_to_wazuh_rule(sigma, 200001)

    print("=" * 60)
    print("SIGMA RULE (input):")
    print("=" * 60)
    print(sample_sigma)
    print("\n" + "=" * 60)
    print("WAZUH XML (output):")
    print("=" * 60)
    print(xml)


def main():
    parser = argparse.ArgumentParser(description="Sigma to Wazuh Rule Converter")
    parser.add_argument("--input",  type=str, help="Single Sigma .yml file")
    parser.add_argument("--dir",    type=str, help="Directory of Sigma .yml files")
    parser.add_argument("--output", type=str, default="sigma_converted_rules.xml", help="Output XML file")
    parser.add_argument("--start-id", type=int, default=BASE_RULE_ID, help=f"Starting rule ID (default: {BASE_RULE_ID})")
    parser.add_argument("--test",   action="store_true", help="Demo conversion with sample rule")
    args = parser.parse_args()

    if args.test:
        demo_conversion()
        return

    if args.input:
        text = Path(args.input).read_text(encoding="utf-8")
        sigma = parse_sigma_rule(text)
        if sigma:
            xml = sigma_to_wazuh_rule(sigma, args.start_id)
            output = f'<group name="sigma_converted,">\n\n{xml}\n\n</group>'
            Path(args.output).write_text(output)
            log.info(f"Single rule written to {args.output}")
    elif args.dir:
        count = convert_directory(args.dir, args.output, args.start_id)
        print(f"\n✅ Converted {count} Sigma rules → {args.output}")
    else:
        parser.print_help()


if __name__ == "__main__":
    main()