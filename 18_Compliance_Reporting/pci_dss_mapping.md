# PCI-DSS v4.0 & HIPAA Compliance Mapping

Maps the SOC Lab's Wazuh detection rules, log sources, and controls to
**PCI-DSS v4.0** and **HIPAA Security Rule** requirements. Use this as
evidence when preparing for an audit or self-assessment.

---

## PCI-DSS v4.0 Requirement Mapping

### Requirement 1 — Install and Maintain Network Security Controls

| Sub-requirement | Control in this lab | Evidence source |
|---|---|---|
| 1.2.1 — Defined inbound/outbound traffic rules | pfSense firewall with explicit deny-all default | `docker-compose.yml` network config; `16_AI_Automation/block_ip.py` |
| 1.3.2 — Restrict inbound from untrusted networks | Host-only network isolation (`192.168.56.0/24`) | `03_Environment_Setup/vm_config.md` |
| 1.4.1 — NSC between trusted and untrusted networks | Suricata IDS/IPS on perimeter interface | `06_Network_Security_Monitoring/suricata_install.sh` |
| 1.4.2 — No direct routes from untrusted → CDE | Kali attacker VM has no direct path to SIEM internals | `02_Architecture_Design/network_topology.drawio` |

---

### Requirement 2 — Apply Secure Configurations to All System Components

| Sub-requirement | Control | Evidence source |
|---|---|---|
| 2.2.1 — Configuration standards documented | VM provisioning docs with hardening steps | `03_Environment_Setup/vm_config.md`, `vagrantfile` |
| 2.2.7 — All non-console admin access encrypted | Wazuh API on HTTPS (:55000), TheHive on HTTP inside lab only | `04_SIEM_Deployment/wazuh_cluster_config.yml` |
| 2.3.1 — Wireless environments use strong encryption | Lab uses wired host-only adapters only | `03_Environment_Setup/hardware_specs.md` |

---

### Requirement 3 — Protect Stored Account Data

| Sub-requirement | Control | Evidence source |
|---|---|---|
| 3.4.1 — PAN rendered unreadable in storage | No PAN data in lab; controls documented for reference | `18_Compliance_Reporting/` |
| 3.5.1 — Disk-level encryption on data storage | Vagrant VMs use encrypted disk images | `03_Environment_Setup/vagrantfile` |

---

### Requirement 6 — Develop and Maintain Secure Systems and Software

| Sub-requirement | Control | Wazuh Rule | Evidence |
|---|---|---|---|
| 6.3.3 — All software protected from known vulns | OpenVAS weekly vulnerability scanning | — | `08_Vulnerability_Management/openvas_scan_schedule.sh` |
| 6.4.1 — WAF deployed for web-facing apps | Suricata acting as inline IPS for web apps | SID 9000007 | `06_Network_Security_Monitoring/custom_nsm_rules.md` |
| 6.4.2 — WAF operating in blocking mode | Suricata in IPS mode with `drop` rules | — | `06_Network_Security_Monitoring/suricata_install.sh` |

---

### Requirement 7 — Restrict Access to System Components and Cardholder Data

| Sub-requirement | Control | Evidence source |
|---|---|---|
| 7.2.1 — Access control system in place | Wazuh agent authentication; TheHive role-based access | `04_SIEM_Deployment/wazuh_install.sh` |
| 7.2.4 — Review user accounts and permissions | Wazuh FIM monitors `/etc/passwd` and user account changes | Wazuh rule 100009, 100010 |
| 7.3.1 — Access control system enforces least privilege | SOC analyst accounts scoped to read-only in Wazuh Dashboard | `04_SIEM_Deployment/verification_checks.md` |

---

### Requirement 8 — Identify Users and Authenticate Access

| Sub-requirement | Control | Wazuh Rule | Evidence |
|---|---|---|---|
| 8.2.4 — Invalid auth attempts locked after ≤10 | Windows lockout policy enforced; lockout detected | 100004 (EventID 4740) | `09_Detection_Rules/local_rules.xml` |
| 8.3.6 — Passwords meet complexity requirements | Wazuh SCA (Security Configuration Assessment) checks | — | Wazuh SCA policy |
| 8.3.9 — Passwords changed every 90 days | SCA check + compliance report | — | `13_SOC_Performance_Metrics/mttr_calculator.py` |
| 8.4.2 — MFA for all non-console CDE access | Documented requirement; MISP and TheHive MFA config | — | `10_SOAR_Case_Management/docker-compose-thehive.yml` |

---

### Requirement 10 — Log and Monitor All Access to System Components *(Core SOC requirement)*

| Sub-requirement | Control | Wazuh Rule(s) | Evidence |
|---|---|---|---|
| 10.2.1.1 — Log all individual user access to CDE | Wazuh agents on all endpoints; Winlogbeat + Sysmon | All rules | `05_Log_Collection/` |
| 10.2.1.2 — Log all root/admin actions | Sysmon EventIDs 4672, 4732; Wazuh privilege rules | 100009, 100010, 100018 | `05_Log_Collection/sysmon_config.xml` |
| 10.2.1.4 — Log invalid logical access attempts | Failed auth detection across SSH, RDP, Windows | 100001–100004 | `09_Detection_Rules/local_rules.xml` |
| 10.2.1.5 — Log use of and changes to ID mechanisms | Account creation/modification detection | 100009, 100010 | `09_Detection_Rules/local_rules.xml` |
| 10.2.1.6 — Log changes to audit logs | Wazuh FIM monitors `/var/ossec/logs/` | Wazuh built-in | Wazuh FIM config |
| 10.2.1.7 — Log creation/deletion of system objects | Sysmon EventID 11 (file create), 13 (registry) | 100011, 100015 | `05_Log_Collection/sysmon_config.xml` |
| 10.3.2 — Protect log files from destruction | Wazuh log forwarding to remote Indexer | — | `04_SIEM_Deployment/wazuh_cluster_config.yml` |
| 10.3.3 — Log files backed up promptly | Automated backup script with 30-day retention | — | `17_Backup_Disaster_Recovery/backup_script.sh` |
| 10.4.1 — Review security events daily | SOC dashboard + TheHive case auto-creation | — | `16_AI_Automation/auto_investigate.py` |
| 10.4.1.1 — Automated log review performed | `auto_investigate.py` daemon polling every 60s | — | `16_AI_Automation/auto_investigate.py` |
| 10.4.2 — Review other system component logs | Suricata EVE, Zeek, Cowrie all ingested by Wazuh | — | `06_Network_Security_Monitoring/` |
| 10.5.1 — Retain audit logs for 12 months | ILM policy: 30 days hot, 90 days warm, 365 days archive | — | `04_SIEM_Deployment/wazuh_cluster_config.yml` |
| 10.6.1 — Synchronize all system clocks via NTP | NTP configured on all VMs | — | `03_Environment_Setup/vm_config.md` |
| 10.7.2 — Detect failures of critical security controls | Wazuh monitors own service health + agent status | — | `04_SIEM_Deployment/verification_checks.md` |

---

### Requirement 11 — Test Security of Systems and Networks Regularly

| Sub-requirement | Control | Evidence source |
|---|---|---|
| 11.3.1 — External penetration testing at least annually | Documented in `15_Attack_Simulation/kali_attack_commands.md` | `15_Attack_Simulation/` |
| 11.3.2 — Internal penetration testing at least annually | Purple-team exercises via Caldera + Atomic Red Team | `12_Purple_Team_Automation/` |
| 11.4.1 — IDS/IPS in place to detect/prevent intrusions | Suricata IDS/IPS + Wazuh HIDS | `06_Network_Security_Monitoring/suricata_install.sh` |
| 11.4.4 — Address exploitable vulnerabilities found | OpenVAS scan → TheHive task creation workflow | `08_Vulnerability_Management/openvas_scan_schedule.sh` |
| 11.4.7 — Multi-tenant service providers support customers | Out of scope for lab | — |
| 11.5.1 — IDS/IPS detects and alerts on intrusions | Wazuh rule alerts with TheHive case auto-creation | `16_AI_Automation/auto_investigate.py` |
| 11.6.1 — Change and tamper detection for payment pages | Out of scope for lab | — |

---

## HIPAA Security Rule Mapping

### Administrative Safeguards (§164.308)

| HIPAA Control | Implementation | Evidence |
|---|---|---|
| §164.308(a)(1) — Security Management Process | Risk analysis via OpenVAS + Wazuh alerting | `08_Vulnerability_Management/` |
| §164.308(a)(1)(ii)(D) — Information System Activity Review | Daily alert review via auto_investigate.py + Dashboard | `16_AI_Automation/auto_investigate.py` |
| §164.308(a)(5) — Security Awareness and Training | Lab exercises with documented attack scenarios | `19_Testing_Validation/test_scenarios.md` |
| §164.308(a)(6) — Security Incident Procedures | TheHive case management with SOAR playbooks | `10_SOAR_Case_Management/` |
| §164.308(a)(7) — Contingency Plan | Backup/DR script with 30-day retention | `17_Backup_Disaster_Recovery/backup_script.sh` |

### Technical Safeguards (§164.312)

| HIPAA Control | Implementation | Wazuh Rule | Evidence |
|---|---|---|---|
| §164.312(a)(1) — Unique user identification | User account creation/deletion monitored | 100009 | `09_Detection_Rules/local_rules.xml` |
| §164.312(a)(2)(i) — Automatic logoff | Session timeout policies on all services | — | `03_Environment_Setup/vm_config.md` |
| §164.312(b) — Audit controls | Full audit logging via Wazuh + Sysmon | All rules | `05_Log_Collection/` |
| §164.312(c)(1) — Integrity controls | Wazuh FIM (File Integrity Monitoring) | 100011 | `09_Detection_Rules/local_rules.xml` |
| §164.312(d) — Authentication | Failed auth detection; brute-force alerting | 100001–100004 | `09_Detection_Rules/local_rules.xml` |
| §164.312(e)(1) — Transmission security | All API comms use TLS; Wazuh agent comms encrypted | — | `04_SIEM_Deployment/wazuh_cluster_config.yml` |
| §164.312(e)(2)(ii) — Encryption in transit | Wazuh agents use TLS 1.2/1.3 to manager | — | `04_SIEM_Deployment/wazuh_install.sh` |

---

## Generating a Compliance Report

```bash
# Export alert counts per PCI-DSS requirement for the last 30 days
python3 13_SOC_Performance_Metrics/mttr_calculator.py --period 30d --json > metrics.json

# Build a full compliance snapshot
python3 - << 'PYEOF'
import json, datetime

pci_rules = {
    "REQ-10.2.1.4": [100001, 100002, 100003, 100004],
    "REQ-10.2.1.2": [100009, 100010, 100018],
    "REQ-10.2.1.7": [100011, 100015],
    "REQ-11.4.1":   [100014, 100013],
    "REQ-11.5.1":   [100017],
}

print(f"PCI-DSS Compliance Evidence Report")
print(f"Generated: {datetime.datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')}")
print(f"{'='*60}")
for req, rule_ids in pci_rules.items():
    print(f"  {req}: Wazuh rules {rule_ids}")
PYEOF
```