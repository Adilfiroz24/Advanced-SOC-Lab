# 🛡️ Advanced SOC Lab — Project Overview

## Objective

Build a **production-grade Security Operations Center (SOC) lab** that mirrors the architecture used by Fortune 500 companies to achieve continuous security monitoring, threat detection, incident response, and compliance reporting. This lab fulfills the educational requirements of the Mini SOC Lab curriculum while extending every component to enterprise-grade standards.

---

## Scope

| Layer | Tools | Purpose |
|-------|-------|---------|
| **SIEM** | Wazuh + Elasticsearch + Kibana | Log aggregation, correlation, alerting |
| **Log Collection** | Filebeat, Winlogbeat, Sysmon, Wazuh Agents | Endpoint & network telemetry |
| **Network Monitoring** | Suricata IDS/IPS, Zeek | Signature + behavioral detection |
| **SOAR** | TheHive + Cortex | Case management, automated response |
| **Threat Intelligence** | MISP + AbuseIPDB + VirusTotal | IOC enrichment and threat hunting |
| **Purple Team** | Caldera + Atomic Red Team | Continuous detection validation |
| **Vulnerability Mgmt** | OpenVAS | Weekly asset scanning |
| **Deception** | Cowrie Honeypot | Attacker intelligence gathering |
| **Compliance** | PCI-DSS / HIPAA mappings | Regulatory reporting |

---

## Learning Outcomes

Upon completing this lab, you will be able to:

1. **Deploy and configure** a multi-node Wazuh SIEM cluster with custom detection rules
2. **Ingest logs** from Windows, Linux, and network devices using Filebeat, Winlogbeat, and Sysmon
3. **Detect attacks** using MITRE ATT&CK-mapped Wazuh rules (brute force, lateral movement, privilege escalation)
4. **Respond to incidents** using TheHive + Cortex playbooks and automated IP blocking
5. **Enrich alerts** with real-time threat intelligence from MISP, AbuseIPDB, and VirusTotal
6. **Simulate attacks** with Metasploit, Atomic Red Team, and MITRE Caldera
7. **Measure SOC performance** using MTTD and MTTR KPIs
8. **Generate compliance reports** mapped to PCI-DSS and HIPAA controls
9. **Build custom dashboards** in Kibana and a React-based SOC UI

---

## Network Architecture Summary

```
[Kali Linux Attacker]
         │
         ▼
[pfSense Firewall / OPNsense]
         │
    ┌────┴─────────────────────┐
    │                          │
[Ubuntu SIEM Server]    [Windows 10 Endpoint]
[Wazuh + ELK]           [Sysmon + Winlogbeat]
[TheHive + Cortex]
[MISP + Suricata]
[Cowrie Honeypot]
```

---

## Prerequisites

- **Hardware**: 16 GB RAM minimum (32 GB recommended), 200 GB SSD, 4 CPU cores
- **Software**: VirtualBox or VMware Workstation, Vagrant
- **OS**: Ubuntu 22.04 LTS (SIEM), Kali Linux (Attacker), Windows 10 (Victim)
- **Network**: Host-only or NAT network (192.168.56.0/24)

---

## Quick Start

```bash
# 1. Clone this repo
git clone https://github.com/yourorg/Advanced-SOC-Lab.git
cd Advanced-SOC-Lab

# 2. Provision VMs
vagrant up

# 3. Deploy the full stack
cd 04_SIEM_Deployment && bash wazuh_install.sh

# 4. Launch UI
npm install && npm start
```

---

## Project Timeline

| Week | Milestone |
|------|-----------|
| 1 | Environment setup, VM provisioning, Wazuh deployment |
| 2 | Log collection, Sysmon config, Suricata IDS |
| 3 | TheHive + Cortex + MISP integration |
| 4 | Custom detection rules, Purple Team testing |
| 5 | Dashboards, MTTD/MTTR metrics, compliance mapping |
| 6 | Final report, documentation, UI polish |

---
Screenshots
Dashboard Overview
https://screenshots/Dashboard.png

Figure 1: Main SOC dashboard showing 33 alerts today, critical incidents, open cases, and average MTTR. The chart shows alert volume by severity over the last 24 hours.

MITRE ATT&CK Heatmap
https://screenshots/MITRE-Heatmap.png

Figure 2: MITRE ATT&CK coverage map demonstrating 81% coverage (17/21 techniques). Techniques with a cyan border have been actively tested. Hover for detailed counts.

Purple Team Results
https://screenshots/Purple-Team-Results.png

Figure 3: Purple Team validation table showing 14 Atomic Red Team tests executed, 12 alerts fired, achieving an 86% detection rate with an average MTTD of 15.8 seconds. Two gaps were identified and are under investigation.
## References

- [Wazuh Documentation](https://documentation.wazuh.com)
- [MITRE ATT&CK Framework](https://attack.mitre.org)
- [TheHive Project](https://thehive-project.org)
- [Atomic Red Team](https://github.com/redcanaryco/atomic-red-team)
- [MISP Threat Intelligence Platform](https://www.misp-project.org)
