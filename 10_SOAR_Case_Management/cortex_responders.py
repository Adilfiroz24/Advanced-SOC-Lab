#!/usr/bin/env python3
"""
Advanced SOC Lab — cortex_responders.py
=========================================
Triggers Cortex responders for automated containment actions:
  - Block malicious IPs via pfSense API
  - Isolate endpoints via Wazuh active response
  - Send Slack/Teams notifications
  - Create TheHive tasks automatically

Usage:
    python3 cortex_responders.py --case-id <id> --action block-ip --value 203.0.113.45
    python3 cortex_responders.py --case-id <id> --action isolate --agent win10-victim
    python3 cortex_responders.py --list-responders
    python3 cortex_responders.py --test
"""

import os
import sys
import json
import logging
import argparse
from datetime import datetime, timezone
import requests
import urllib3

urllib3.disable_warnings()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s"
)
log = logging.getLogger("cortex_responders")

# ── Config from environment ───────────────────────────────
CORTEX_HOST    = os.getenv("CORTEX_HOST",    "http://localhost:9001")
CORTEX_API_KEY = os.getenv("CORTEX_API_KEY", "your-cortex-api-key")
THEHIVE_HOST   = os.getenv("THEHIVE_HOST",   "http://localhost:9000")
THEHIVE_KEY    = os.getenv("THEHIVE_API_KEY","your-thehive-api-key")
WAZUH_HOST     = os.getenv("WAZUH_HOST",     "https://localhost:55000")
WAZUH_USER     = os.getenv("WAZUH_USER",     "wazuh")
WAZUH_PASS     = os.getenv("WAZUH_PASS",     "wazuh")
SLACK_WEBHOOK  = os.getenv("SLACK_WEBHOOK",  "")

CORTEX_HEADERS = {
    "Authorization": f"Bearer {CORTEX_API_KEY}",
    "Content-Type": "application/json",
}
THEHIVE_HEADERS = {
    "Authorization": f"Bearer {THEHIVE_KEY}",
    "Content-Type": "application/json",
}


class CortexClient:
    """Cortex API client for analyzer/responder management."""

    def list_responders(self, data_type: str = None) -> list:
        """List available Cortex responders."""
        try:
            url = f"{CORTEX_HOST}/api/responder"
            if data_type:
                url += f"?dataType={data_type}"
            r = requests.get(url, headers=CORTEX_HEADERS, timeout=15)
            r.raise_for_status()
            return r.json()
        except Exception as e:
            log.error(f"Cortex list responders error: {e}")
            return []

    def run_responder(self, responder_id: str, data_type: str, data: dict, case_id: str) -> dict:
        """Trigger a Cortex responder."""
        payload = {
            "responderId": responder_id,
            "data": data,
            "dataType": data_type,
            "caseId": case_id,
        }
        try:
            r = requests.post(
                f"{CORTEX_HOST}/api/responder/{responder_id}/run",
                json=payload,
                headers=CORTEX_HEADERS,
                timeout=30,
            )
            r.raise_for_status()
            job = r.json()
            log.info(f"Responder job started: {job.get('id')} (status: {job.get('status')})")
            return job
        except Exception as e:
            log.error(f"Cortex responder error: {e}")
            return {}

    def get_job_status(self, job_id: str) -> dict:
        """Poll Cortex job status."""
        try:
            r = requests.get(
                f"{CORTEX_HOST}/api/job/{job_id}",
                headers=CORTEX_HEADERS, timeout=10
            )
            r.raise_for_status()
            return r.json()
        except Exception as e:
            log.error(f"Cortex job status error: {e}")
            return {}


class WazuhActiveResponse:
    """Wazuh active response — remote command execution on agents."""

    def __init__(self):
        self.token = None

    def authenticate(self) -> bool:
        try:
            r = requests.post(
                f"{WAZUH_HOST}/security/user/authenticate",
                auth=(WAZUH_USER, WAZUH_PASS),
                verify=False, timeout=10
            )
            r.raise_for_status()
            self.token = r.json()["data"]["token"]
            return True
        except Exception as e:
            log.error(f"Wazuh auth failed: {e}")
            return False

    def get_agents(self, name: str = None) -> list:
        """Get list of registered Wazuh agents."""
        try:
            params = {}
            if name:
                params["name"] = name
            r = requests.get(
                f"{WAZUH_HOST}/agents",
                params=params,
                headers={"Authorization": f"Bearer {self.token}"},
                verify=False, timeout=10
            )
            r.raise_for_status()
            return r.json().get("data", {}).get("affected_items", [])
        except Exception as e:
            log.error(f"Wazuh get agents error: {e}")
            return []

    def run_active_response(self, agent_id: str, command: str, arguments: list = None) -> bool:
        """
        Run Wazuh active response command on a specific agent.
        Commands: firewall-drop, disable-account, host-deny
        """
        payload = {
            "command": command,
            "arguments": arguments or [],
            "alert": {"data": {"srcip": arguments[0] if arguments else ""}}
        }
        try:
            r = requests.put(
                f"{WAZUH_HOST}/active-response",
                json=payload,
                params={"agents_list": agent_id},
                headers={"Authorization": f"Bearer {self.token}"},
                verify=False, timeout=20
            )
            r.raise_for_status()
            log.info(f"Active response '{command}' executed on agent {agent_id}")
            return True
        except Exception as e:
            log.error(f"Wazuh active response error: {e}")
            return False


class TheHiveCase:
    """TheHive case update client."""

    def add_task_log(self, case_id: str, task_id: str, message: str) -> bool:
        try:
            r = requests.post(
                f"{THEHIVE_HOST}/api/v1/task/{task_id}/log",
                json={"message": message, "startDate": int(datetime.now().timestamp() * 1000)},
                headers=THEHIVE_HEADERS, timeout=10
            )
            return r.status_code in (200, 201)
        except Exception as e:
            log.error(f"TheHive task log error: {e}")
            return False

    def add_observable(self, case_id: str, data_type: str, value: str, ioc: bool = True) -> bool:
        try:
            r = requests.post(
                f"{THEHIVE_HOST}/api/v1/case/{case_id}/observable",
                json={"dataType": data_type, "data": value, "ioc": ioc, "tlp": 2},
                headers=THEHIVE_HEADERS, timeout=10
            )
            return r.status_code in (200, 201)
        except Exception as e:
            log.error(f"TheHive observable error: {e}")
            return False

    def close_case(self, case_id: str, resolution: str = "TruePositive") -> bool:
        try:
            r = requests.patch(
                f"{THEHIVE_HOST}/api/v1/case/{case_id}",
                json={"status": "Resolved", "resolution": resolution},
                headers=THEHIVE_HEADERS, timeout=10
            )
            return r.status_code in (200, 204)
        except Exception as e:
            log.error(f"TheHive close case error: {e}")
            return False


def send_slack_notification(message: str, severity: str = "high"):
    """Send alert notification to Slack webhook."""
    if not SLACK_WEBHOOK:
        log.debug("No Slack webhook configured.")
        return

    emoji = {"critical": "🔴", "high": "🟠", "medium": "🟡", "low": "🟢"}.get(severity, "⚪")
    payload = {
        "text": f"{emoji} SOC Alert",
        "attachments": [{
            "color": {"critical": "#ff2d6d", "high": "#ff8c00", "medium": "#ffd600"}.get(severity, "#6b7fa3"),
            "text": message,
            "footer": "Advanced SOC Lab",
            "ts": int(datetime.now().timestamp()),
        }]
    }
    try:
        r = requests.post(SLACK_WEBHOOK, json=payload, timeout=10)
        r.raise_for_status()
        log.info("Slack notification sent")
    except Exception as e:
        log.warning(f"Slack notification failed: {e}")


def action_block_ip(ip: str, case_id: str, reason: str = "Malicious IP"):
    """Block an IP via Wazuh active response on all Linux agents."""
    log.info(f"ACTION: Block IP {ip}")
    wazuh = WazuhActiveResponse()
    if not wazuh.authenticate():
        log.error("Cannot authenticate to Wazuh")
        return False

    agents = wazuh.get_agents()
    blocked = 0
    for agent in agents:
        agent_id = agent.get("id")
        os_type = agent.get("os", {}).get("platform", "")
        if os_type in ("ubuntu", "debian", "rhel", "linux"):
            if wazuh.run_active_response(agent_id, "firewall-drop", [ip]):
                blocked += 1

    if blocked > 0:
        log.info(f"IP {ip} blocked on {blocked} agent(s)")
        thehive = TheHiveCase()
        thehive.add_observable(case_id, "ip", ip, ioc=True)
        send_slack_notification(f"IP Blocked: {ip}\nReason: {reason}\nCase: {case_id}", "high")
    return blocked > 0


def action_isolate_agent(agent_name: str, case_id: str):
    """Isolate an agent by running a firewall block-all rule."""
    log.info(f"ACTION: Isolate agent {agent_name}")
    wazuh = WazuhActiveResponse()
    if not wazuh.authenticate():
        return False

    agents = wazuh.get_agents(name=agent_name)
    if not agents:
        log.error(f"Agent not found: {agent_name}")
        return False

    agent_id = agents[0]["id"]
    # Run host-deny to block all inbound/outbound except SOC management
    result = wazuh.run_active_response(agent_id, "host-deny", ["0.0.0.0/0"])
    if result:
        log.info(f"Agent {agent_name} isolated successfully")
        send_slack_notification(
            f"🛑 HOST ISOLATED: {agent_name}\nCase: {case_id}\nReason: Active threat — awaiting investigation",
            "critical"
        )
    return result


def run_test():
    """Run test actions with mock data."""
    log.info("=== TEST MODE ===")

    # Test Cortex
    cortex = CortexClient()
    responders = cortex.list_responders()
    log.info(f"Cortex responders available: {len(responders)}")

    # Test Wazuh
    wazuh = WazuhActiveResponse()
    if wazuh.authenticate():
        agents = wazuh.get_agents()
        log.info(f"Wazuh agents: {len(agents)}")
    else:
        log.warning("Wazuh not reachable (expected in lab without agent)")

    # Test notifications
    send_slack_notification("SOC Lab test notification — cortex_responders.py", "low")

    log.info("Test complete")


def main():
    parser = argparse.ArgumentParser(description="Cortex Automated Responder")
    parser.add_argument("--case-id",   type=str, help="TheHive case ID")
    parser.add_argument("--action",    choices=["block-ip", "isolate", "list"], help="Action to perform")
    parser.add_argument("--value",     type=str, help="IP address or agent name")
    parser.add_argument("--reason",    type=str, default="SOC Auto-Response", help="Action reason")
    parser.add_argument("--list-responders", action="store_true", help="List Cortex responders")
    parser.add_argument("--test",      action="store_true", help="Test mode")
    args = parser.parse_args()

    if args.test:
        run_test()
        return

    if args.list_responders:
        cortex = CortexClient()
        responders = cortex.list_responders()
        for r in responders:
            print(f"  [{r.get('id','?')}] {r.get('name','Unknown')} — {r.get('description','')[:60]}")
        return

    if not args.case_id:
        parser.error("--case-id is required")

    if args.action == "block-ip":
        if not args.value:
            parser.error("--value (IP) required for block-ip")
        action_block_ip(args.value, args.case_id, args.reason)

    elif args.action == "isolate":
        if not args.value:
            parser.error("--value (agent name) required for isolate")
        action_isolate_agent(args.value, args.case_id)

    else:
        parser.print_help()


if __name__ == "__main__":
    main()