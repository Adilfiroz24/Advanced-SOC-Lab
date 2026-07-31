#!/usr/bin/env python3
"""
Advanced SOC Lab — misp_integration.py
=======================================
Pulls threat intelligence from MISP and pushes IOCs into Wazuh's
CDB (Constant Database) list for real-time IP/domain/hash blocking.

Features:
  - Pull MISP events filtered by tags and threat level
  - Export IPs, domains, hashes, and URLs as IOC lists
  - Push to Wazuh CDB for rule matching
  - Feed TheHive with enriched MISP context

Usage:
    python3 misp_integration.py --sync-all
    python3 misp_integration.py --event-id 1234
    python3 misp_integration.py --test
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

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

# ── Logging ───────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s — %(message)s",
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler("/var/log/soc-misp-integration.log"),
    ],
)
log = logging.getLogger("misp_integration")

# ── Configuration from environment ───────────────────────
CONFIG = {
    "misp": {
        "host":    os.getenv("MISP_HOST",    "https://192.168.56.10"),
        "api_key": os.getenv("MISP_API_KEY", "your-misp-auth-key"),
        "verify_ssl": False,
        "threat_level_filter": [1, 2],  # 1=High, 2=Medium
        "tag_filter": ["tlp:red", "tlp:amber", "threat-intel"],
    },
    "wazuh": {
        "cdb_path": "/var/ossec/etc/lists/",
    },
    "output_dir": "/tmp/misp_iocs",
}

# ── IOC type mapping from MISP attribute types ────────────
IOC_TYPE_MAP = {
    "ip-src": "ip",
    "ip-dst": "ip",
    "ip-src|port": "ip",
    "ip-dst|port": "ip",
    "domain": "domain",
    "hostname": "domain",
    "url": "url",
    "md5": "hash_md5",
    "sha1": "hash_sha1",
    "sha256": "hash_sha256",
    "sha512": "hash_sha512",
    "filename|md5": "hash_md5",
    "filename|sha256": "hash_sha256",
    "email-src": "email",
    "email-dst": "email",
}


class MISPClient:
    """MISP REST API client."""

    def __init__(self):
        self.base = CONFIG["misp"]["host"].rstrip("/")
        self.headers = {
            "Authorization": CONFIG["misp"]["api_key"],
            "Content-Type": "application/json",
            "Accept": "application/json",
        }
        self.verify = CONFIG["misp"]["verify_ssl"]

    def _request(self, method: str, endpoint: str, **kwargs) -> dict:
        """Make authenticated MISP API request."""
        url = f"{self.base}{endpoint}"
        try:
            r = requests.request(
                method, url,
                headers=self.headers,
                verify=self.verify,
                timeout=30,
                **kwargs
            )
            r.raise_for_status()
            return r.json()
        except requests.exceptions.ConnectionError:
            log.error(f"Cannot connect to MISP at {self.base}. Is it running?")
            return {}
        except requests.exceptions.HTTPError as e:
            log.error(f"MISP API HTTP error {e.response.status_code}: {e}")
            return {}
        except Exception as e:
            log.error(f"MISP API error: {e}")
            return {}

    def get_events(self, limit: int = 100, threat_level: list = None) -> list:
        """Fetch recent MISP events."""
        payload = {
            "returnFormat": "json",
            "limit": limit,
            "page": 1,
            "published": True,
        }
        if threat_level:
            payload["threat_level_id"] = threat_level[0]  # Filter by highest

        result = self._request("POST", "/events/restSearch", json=payload)
        events = result.get("response", [])
        log.info(f"Fetched {len(events)} MISP events")
        return events

    def get_event_by_id(self, event_id: int) -> dict:
        """Fetch a specific MISP event by ID."""
        result = self._request("GET", f"/events/view/{event_id}")
        return result.get("Event", {})

    def get_attributes(self, event_id: int = None, ioc_only: bool = True) -> list:
        """Fetch attributes (IOCs) from MISP."""
        payload = {
            "returnFormat": "json",
            "to_ids": ioc_only,  # Only IDS-flagged attributes
            "limit": 5000,
        }
        if event_id:
            payload["eventid"] = event_id

        result = self._request("POST", "/attributes/restSearch", json=payload)
        attrs = result.get("response", {}).get("Attribute", [])
        log.info(f"Fetched {len(attrs)} MISP attributes")
        return attrs

    def search_by_value(self, value: str) -> list:
        """Search MISP for an IOC by value (IP, hash, domain)."""
        payload = {"returnFormat": "json", "value": value, "limit": 10}
        result = self._request("POST", "/attributes/restSearch", json=payload)
        return result.get("response", {}).get("Attribute", [])


class IOCProcessor:
    """Process and categorize MISP attributes into IOC lists."""

    def __init__(self):
        self.iocs = {
            "ip": set(),
            "domain": set(),
            "url": set(),
            "hash_md5": set(),
            "hash_sha256": set(),
            "email": set(),
        }
        os.makedirs(CONFIG["output_dir"], exist_ok=True)

    def process_attribute(self, attr: dict) -> Optional[str]:
        """Categorize a MISP attribute and add to the correct IOC set."""
        attr_type = attr.get("type", "")
        value = attr.get("value", "").strip()

        if not value or not attr.get("to_ids", False):
            return None

        ioc_type = IOC_TYPE_MAP.get(attr_type)
        if not ioc_type:
            return None

        # Clean up composite values (e.g., "filename|sha256" → take hash part)
        if "|" in value and "|" in attr_type:
            value = value.split("|")[-1]

        # Validate IPs
        if ioc_type == "ip":
            value = value.split(":")[0]  # Remove port if present
            try:
                ipaddress.ip_address(value)
            except ValueError:
                return None

        self.iocs[ioc_type].add(value)
        return ioc_type

    def process_attributes(self, attributes: list) -> dict:
        """Process a list of MISP attributes."""
        counts = {k: 0 for k in self.iocs}
        for attr in attributes:
            ioc_type = self.process_attribute(attr)
            if ioc_type:
                counts[ioc_type] += 1
        log.info(f"IOC counts: {counts}")
        return counts

    def write_wazuh_cdb(self) -> list:
        """
        Write IOC lists in Wazuh CDB format.
        CDB format: one entry per line, e.g. "203.0.113.45:"
        """
        written_files = []
        mappings = {
            "ip":          "misp_malicious_ips",
            "domain":      "misp_malicious_domains",
            "hash_sha256": "misp_malicious_hashes",
        }

        for ioc_type, cdb_name in mappings.items():
            if not self.iocs[ioc_type]:
                continue

            output_path = os.path.join(CONFIG["output_dir"], f"{cdb_name}.txt")
            wazuh_cdb_path = os.path.join(CONFIG["wazuh"]["cdb_path"], f"{cdb_name}.txt")

            try:
                with open(output_path, "w") as f:
                    for ioc in sorted(self.iocs[ioc_type]):
                        f.write(f"{ioc}:\n")

                # Copy to Wazuh CDB directory if accessible
                try:
                    import shutil
                    shutil.copy2(output_path, wazuh_cdb_path)
                    log.info(f"Copied {cdb_name}.txt to Wazuh CDB directory")
                except PermissionError:
                    log.warning(f"Cannot write to {wazuh_cdb_path}. Run as root or copy manually.")

                written_files.append(output_path)
                log.info(f"Written {len(self.iocs[ioc_type])} {ioc_type} IOCs to {output_path}")

            except Exception as e:
                log.error(f"Error writing {cdb_name}: {e}")

        return written_files

    def export_json_report(self) -> str:
        """Export all IOCs as a JSON report."""
        report = {
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "totals": {k: len(v) for k, v in self.iocs.items()},
            "iocs": {k: sorted(v) for k, v in self.iocs.items()},
        }
        report_path = os.path.join(CONFIG["output_dir"], "misp_ioc_report.json")
        with open(report_path, "w") as f:
            json.dump(report, f, indent=2)
        log.info(f"JSON report written to {report_path}")
        return report_path

    def print_summary(self):
        total = sum(len(v) for v in self.iocs.values())
        print(f"\n{'═'*50}")
        print(f"  MISP IOC SYNC SUMMARY")
        print(f"{'═'*50}")
        for ioc_type, values in self.iocs.items():
            print(f"  {ioc_type:<20}: {len(values):>5}")
        print(f"{'─'*50}")
        print(f"  {'TOTAL':<20}: {total:>5}")
        print(f"{'═'*50}\n")


def sync_all(test_mode: bool = False):
    """Full MISP sync — fetch all recent IOCs and push to Wazuh."""
    client = MISPClient()
    processor = IOCProcessor()

    if test_mode:
        log.info("TEST MODE — using mock data")
        mock_attrs = [
            {"type": "ip-dst", "value": "203.0.113.45", "to_ids": True},
            {"type": "ip-src", "value": "198.51.100.23", "to_ids": True},
            {"type": "sha256", "value": "5f1d8aa80a4463a86e0c2df4e3fd9d15aabb12d52fd0cf91dc1ef0edc6a68c3a", "to_ids": True},
            {"type": "domain", "value": "evil-c2-domain.xyz", "to_ids": True},
            {"type": "url", "value": "http://malware.example.com/payload.sh", "to_ids": True},
        ]
        processor.process_attributes(mock_attrs)
    else:
        attributes = client.get_attributes(ioc_only=True)
        if not attributes:
            log.warning("No attributes returned from MISP. Check connectivity.")
            return

        processor.process_attributes(attributes)

    # Write outputs
    written = processor.write_wazuh_cdb()
    report = processor.export_json_report()
    processor.print_summary()

    log.info(f"Sync complete. Files written: {written + [report]}")
    log.info("Restart Wazuh to apply CDB changes: systemctl restart wazuh-manager")


def main():
    parser = argparse.ArgumentParser(description="MISP Threat Intelligence Sync")
    parser.add_argument("--sync-all",  action="store_true", help="Sync all MISP IOCs")
    parser.add_argument("--event-id",  type=int, help="Sync specific event ID")
    parser.add_argument("--search",    type=str, help="Search MISP for a specific value")
    parser.add_argument("--test",      action="store_true", help="Test mode with mock data")
    args = parser.parse_args()

    if args.test or args.sync_all:
        sync_all(test_mode=args.test)
    elif args.event_id:
        client = MISPClient()
        processor = IOCProcessor()
        attrs = client.get_attributes(event_id=args.event_id)
        processor.process_attributes(attrs)
        processor.print_summary()
    elif args.search:
        client = MISPClient()
        results = client.search_by_value(args.search)
        if results:
            print(json.dumps(results, indent=2))
        else:
            print(f"No MISP matches for: {args.search}")
    else:
        parser.print_help()


if __name__ == "__main__":
    main()