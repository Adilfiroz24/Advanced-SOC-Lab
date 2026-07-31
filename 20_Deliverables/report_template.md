# Advanced SOC Lab — Final Project Report

**Report Title:** Advanced Security Operations Center — Lab Implementation Report  
**Author:** [Your Name]  
**Date:** [DD-MM-YYYY]  
**Version:** 1.0  
**Classification:** CONFIDENTIAL — LAB USE ONLY  

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Project Scope and Objectives](#2-project-scope-and-objectives)
3. [Environment Architecture](#3-environment-architecture)
4. [SIEM Deployment — Wazuh](#4-siem-deployment--wazuh)
5. [Log Collection and Endpoint Coverage](#5-log-collection-and-endpoint-coverage)
6. [Network Security Monitoring](#6-network-security-monitoring)
7. [Honeypot Deployment](#7-honeypot-deployment)
8. [Vulnerability Management](#8-vulnerability-management)
9. [Detection Engineering](#9-detection-engineering)
10. [SOAR and Case Management](#10-soar-and-case-management)
11. [Threat Intelligence Integration](#11-threat-intelligence-integration)
12. [Purple Team Exercises](#12-purple-team-exercises)
13. [SOC Performance Metrics](#13-soc-performance-metrics)
14. [Dashboards and Visualizations](#14-dashboards-and-visualizations)
15. [AI and Automation](#15-ai-and-automation)
16. [Compliance Mapping](#16-compliance-mapping)
17. [Challenges and Lessons Learned](#17-challenges-and-lessons-learned)
18. [Recommendations](#18-recommendations)
19. [Conclusion](#19-conclusion)
20. [Appendices](#20-appendices)

---

## 1. Executive Summary

> **[Fill in after completing the lab]**
>
> Provide a 1-page summary covering:
> - What was built (SOC stack components deployed)
> - Detection coverage achieved (X of Y techniques covered)
> - Key metrics: MTTD, MTTR, false-positive rate
> - Notable findings from purple-team exercises
> - Top 3 recommendations for hardening

**Sample language:**

This report documents the design, deployment, and validation of an enterprise-grade
Security Operations Center (SOC) lab built on Wazuh 4.7, TheHive 5, Suricata 7,
MISP, and a custom React analyst dashboard. Over the course of [X weeks], the
following was achieved:

- **[X] endpoints** onboarded with full telemetry (Sysmon + Wazuh Agent + Winlogbeat)
- **20 custom detection rules** written and validated, covering [X] MITRE ATT&CK techniques
- **[X]% detection rate** across 10 structured purple-team test scenarios
- **Mean Time to Detect (MTTD):** [X] minutes (Critical), [X] minutes (High)
- **Mean Time to Respond (MTTR):** [X] minutes (Critical), [X] minutes (High)
- **[X] TheHive cases** auto-created and enriched via AbuseIPDB/VirusTotal
- Full PCI-DSS Requirement 10 compliance mapping documented

---

## 2. Project Scope and Objectives

### 2.1 Objectives

| # | Objective | Status |
|---|---|---|
| 1 | Deploy production-grade Wazuh SIEM | [ ] Complete |
| 2 | Onboard Windows and Linux endpoints | [ ] Complete |
| 3 | Write ≥ 10 custom MITRE-mapped detection rules | [ ] Complete |
| 4 | Integrate Suricata IDS/IPS for network monitoring | [ ] Complete |
| 5 | Deploy TheHive + Cortex for case management | [ ] Complete |
| 6 | Integrate MISP + AbuseIPDB threat intelligence | [ ] Complete |
| 7 | Validate detections with Atomic Red Team | [ ] Complete |
| 8 | Achieve MTTD < 5 min for Critical alerts | [ ] Complete |
| 9 | Achieve MTTR < 60 min for Critical cases | [ ] Complete |
| 10 | Document PCI-DSS and HIPAA compliance mapping | [ ] Complete |

### 2.2 Scope

**In scope:**
- Network: `192.168.56.0/24` host-only lab environment
- Hosts: Ubuntu 22.04 SIEM server, Windows 10 victim, Kali Linux attacker, Ubuntu web server
- Attack techniques: MITRE ATT&CK Enterprise v14 techniques as defined in `atomic_red_team_tests.yaml`

**Out of scope:**
- Production cardholder data environments
- Cloud infrastructure
- Physical security controls

---

## 3. Environment Architecture

### 3.1 Network Diagram

```
[Kali Attacker 192.168.56.20]
          │ attack traffic
          ▼
[Host-Only Switch 192.168.56.0/24]
    │              │              │
    ▼              ▼              ▼
[SIEM Server  [Win10 Victim  [Ubuntu Web
 .10]          .30]           Server .40]
 Wazuh         Sysmon         Apache
 TheHive        Winlogbeat     Filebeat
 MISP           Wazuh Agent    Wazuh Agent
 Suricata
 Cowrie
```

### 3.2 Component Inventory

| VM | OS | IP | vCPU | RAM | Key Services |
|---|---|---|---|---|---|
| siem-server | Ubuntu 22.04 LTS | 192.168.56.10 | 4 | 8 GB | Wazuh, TheHive, Cortex, MISP, Suricata, Cowrie |
| kali-attacker | Kali Rolling | 192.168.56.20 | 2 | 4 GB | Nmap, Hydra, Metasploit, Atomic Red Team |
| win10-victim | Windows 10 22H2 | 192.168.56.30 | 2 | 4 GB | Sysmon, Winlogbeat, Wazuh Agent |
| ubuntu-webserver | Ubuntu 22.04 LTS | 192.168.56.40 | 2 | 2 GB | Apache, Filebeat, Wazuh Agent |

### 3.3 Software Versions

| Tool | Version | Role |
|---|---|---|
| Wazuh Manager | 4.7.4 | SIEM / XDR / HIDS |
| Wazuh Indexer | 4.7.4 | OpenSearch-based storage |
| Wazuh Dashboard | 4.7.4 | Kibana-based UI |
| TheHive | 5.2 | Case management |
| Cortex | 3.1.7 | Automated response |
| MISP | 2.4.x | Threat intelligence |
| Suricata | 7.0 | Network IDS/IPS |
| Sysmon | 15.x | Windows endpoint telemetry |
| Cowrie | Latest | SSH/Telnet honeypot |

---

## 4. SIEM Deployment — Wazuh

### 4.1 Installation Method

- [ ] Automated install via `04_SIEM_Deployment/wazuh_install.sh`
- [ ] Docker Compose via `docker-compose.yml`
- [ ] Manual install

**Installation duration:** [X] minutes  
**Issues encountered:** [Describe any issues and how they were resolved]

### 4.2 Verification Results

```
# Paste output of verification checks here:
Wazuh Manager status: [running / stopped]
Wazuh Indexer health: [green / yellow / red]
Wazuh Dashboard HTTP: [200 OK / Error]
Wazuh API response:   [authenticated / failed]
Registered agents:    [X active]
```

### 4.3 Cluster Configuration

- Deployment mode: [ ] Single-node  [ ] Multi-node cluster
- Indexer heap size: [X] GB
- Alert retention: [X] days hot / [X] days warm / [X] days cold

### 4.4 Screenshots

> **[Insert screenshot: Wazuh Dashboard main page with agent list]**

> **[Insert screenshot: Wazuh Indexer health from `/api/_cluster/health`]**

---

## 5. Log Collection and Endpoint Coverage

### 5.1 Agent Enrollment Summary

| Host | Agent ID | Status | Log Sources | Events/Day (avg) |
|---|---|---|---|---|
| ubuntu-webserver | [ID] | Active | Syslog, Apache, auth.log | [X] |
| win10-victim | [ID] | Active | Sysmon, Windows Security, System | [X] |
| [Add rows] | | | | |

### 5.2 Sysmon Coverage

Sysmon configuration (`05_Log_Collection/sysmon_config.xml`) captures:

| Event ID | Description | Enabled |
|---|---|---|
| 1 | Process Create | ✅ |
| 3 | Network Connection | ✅ |
| 5 | Process Terminated | ✅ |
| 7 | Image Loaded | ✅ |
| 8 | CreateRemoteThread | ✅ |
| 10 | ProcessAccess (LSASS) | ✅ |
| 11 | FileCreate | ✅ |
| 12/13 | Registry Events | ✅ |
| 22 | DNS Query | ✅ |

### 5.3 Log Forwarding Test Results

| Test | Result | MTTD |
|---|---|---|
| Windows Sysmon → Elasticsearch | [ ] PASS / [ ] FAIL | [X]s |
| Linux syslog → Elasticsearch | [ ] PASS / [ ] FAIL | [X]s |
| Suricata EVE → Elasticsearch | [ ] PASS / [ ] FAIL | [X]s |
| Cowrie honeypot → Elasticsearch | [ ] PASS / [ ] FAIL | [X]s |
| End-to-end latency (avg) | | [X]s |

> **[Insert screenshot: Wazuh Dashboard showing events from all agents]**

---

## 6. Network Security Monitoring

### 6.1 Suricata Configuration

- Interface monitored: [eth0 / eth1]
- Mode: [ ] IDS (alert only)  [ ] IPS (inline drop)
- Rule sources enabled: Emerging Threats Open, custom SOC Lab rules
- Total rules loaded: [X]

### 6.2 Custom Rule Performance

| SID | Description | Alerts fired in testing |
|---|---|---|
| 9000001 | Nmap SYN Scan | [X] |
| 9000002 | SSH Brute Force | [X] |
| 9000003 | Meterpreter Port 4444 | [X] |
| 9000004 | RDP Brute Force | [X] |
| 9000005 | DNS Tunneling | [X] |
| 9000006 | EternalBlue Pattern | [X] |
| 9000007 | ICMP Flood | [X] |

> **[Insert screenshot: Suricata fast.log showing detected events]**

---

## 7. Honeypot Deployment

### 7.1 Cowrie Configuration

- Listening port: TCP/2222 (SSH), TCP/2323 (Telnet)
- Fake hostname presented: `server01`
- Deployment method: Docker container
- Log format: JSON → `/var/log/cowrie/cowrie.json`

### 7.2 Attacker Interaction Log (from purple-team exercise)

| Timestamp | Src IP | Username tried | Commands executed | Wazuh Rule Fired |
|---|---|---|---|---|
| [Time] | 192.168.56.20 | root | whoami, cat /etc/passwd | 100017 |
| [Add rows] | | | | |

> **[Insert screenshot: Cowrie session log showing attacker commands]**

---

## 8. Vulnerability Management

### 8.1 OpenVAS Scan Results Summary

**Scan date:** [Date]  
**Targets scanned:** `192.168.56.0/24`

| Severity | Count | Top Finding |
|---|---|---|
| Critical | [X] | [Description] |
| High | [X] | [Description] |
| Medium | [X] | [Description] |
| Low | [X] | [Description] |

### 8.2 Remediation Status

| CVE / Finding | Host | Severity | Status |
|---|---|---|---|
| [CVE-XXXX-XXXX] | [host] | High | [ ] Patched / [ ] Accepted risk |
| [Add rows] | | | |

---

## 9. Detection Engineering

### 9.1 Custom Rule Summary

All 20 rules are defined in `09_Detection_Rules/local_rules.xml`.

| Rule ID | Level | Description | MITRE Technique | Fired in Tests |
|---|---|---|---|---|
| 100001 | 10 | SSH brute force (10+ failures/60s) | T1110.001 | [ ] |
| 100002 | 10 | Windows auth brute force | T1110 | [ ] |
| 100003 | 10 | RDP brute force | T1110.001 | [ ] |
| 100004 | 12 | Account lockout (EventID 4740) | T1110 | [ ] |
| 100005 | 12 | PowerShell encoded command | T1059.001 | [ ] |
| 100006 | 13 | Certutil LOLBin abuse | T1105 | [ ] |
| 100007 | 12 | Mshta execution | T1218.005 | [ ] |
| 100008 | 12 | WMIC remote process | T1047 | [ ] |
| 100009 | 14 | New local user created (4720) | T1136.001 | [ ] |
| 100010 | 14 | User added to Administrators (4732) | T1098 | [ ] |
| 100011 | 15 | Mass file modification (ransomware) | T1486 | [ ] |
| 100012 | 15 | Shadow copy deletion | T1490 | [ ] |
| 100013 | 15 | LSASS memory access (Mimikatz) | T1003.001 | [ ] |
| 100014 | 8  | Network scan (Suricata) | T1046 | [ ] |
| 100015 | 11 | Registry Run key modified | T1547.001 | [ ] |
| 100016 | 11 | DNS tunneling (volume) | T1048.001 | [ ] |
| 100017 | 14 | Cowrie honeypot interaction | T1110 | [ ] |
| 100018 | 12 | Root shell via sudo | T1548.003 | [ ] |
| 100019 | 15 | Log4Shell JNDI payload | T1190 | [ ] |
| 100020 | 10 | SQL injection in web logs | T1190 | [ ] |

### 9.2 MITRE ATT&CK Coverage Heatmap

> **[Insert MITRE Navigator screenshot — generated by `16_AI_Automation/mitre_heatmap.py`]**
>
> Import `mitre_coverage.json` at https://mitre-attack.github.io/attack-navigator/

**Coverage summary:**

| Tactic | Techniques covered | Techniques total |
|---|---|---|
| Reconnaissance | [X] | [X] |
| Initial Access | [X] | [X] |
| Execution | [X] | [X] |
| Persistence | [X] | [X] |
| Privilege Escalation | [X] | [X] |
| Defense Evasion | [X] | [X] |
| Credential Access | [X] | [X] |
| Discovery | [X] | [X] |
| Lateral Movement | [X] | [X] |
| Impact | [X] | [X] |
| **TOTAL** | **[X]** | **[X]** |

---

## 10. SOAR and Case Management

### 10.1 TheHive Configuration

- URL: `http://192.168.56.10:9000`
- Cortex connected: [ ] Yes  [ ] No
- MISP connected: [ ] Yes  [ ] No
- Auto-case creation from Wazuh: [ ] Enabled via `auto_investigate.py`

### 10.2 Case Statistics (from purple-team exercises)

| Metric | Value |
|---|---|
| Total cases created | [X] |
| Auto-created by automation | [X] |
| Manually created | [X] |
| Cases resolved | [X] |
| False positives | [X] |
| Average tasks per case | [X] |

### 10.3 Sample Case — [Rule 100013 — LSASS Access]

> **[Insert screenshot: TheHive case detail showing title, severity, observables, tasks]**

**Case summary:**
- **Title:** [SOC-AUTO] LSASS memory access detected — MIMIKATZ or credential dumping tool
- **Severity:** Critical (P1)
- **Alert source:** Wazuh rule 100013, level 15
- **Observables:** Source IP, process hash
- **AbuseIPDB score:** [X]%
- **Tasks completed:** [X] / [X]
- **Time to resolve:** [X] minutes

---

## 11. Threat Intelligence Integration

### 11.1 MISP Configuration

- URL: `https://192.168.56.10:8443`
- IOC sync schedule: [Frequency]
- Active feeds: [List feeds enabled]

### 11.2 IOC Enrichment Results

| Source | IOCs ingested | Malicious IPs found | Domains blocked |
|---|---|---|---|
| MISP | [X] | [X] | [X] |
| AbuseIPDB | [X] | [X] | N/A |
| VirusTotal | [X] | [X] | N/A |

### 11.3 Blocked IOCs During Exercises

| IOC | Type | Source | Score | Action |
|---|---|---|---|---|
| 203.0.113.45 | IP | AbuseIPDB | 94% | Blocked via iptables |
| [Add rows] | | | | |

---

## 12. Purple Team Exercises

### 12.1 Atomic Red Team Results

Tests executed from `12_Purple_Team_Automation/atomic_red_team_tests.yaml`:

| Test | Technique | Wazuh Rule | Alert Fired | MTTD |
|---|---|---|---|---|
| SSH Brute Force | T1110.001 | 100001 | [ ] YES / [ ] NO | [X] min |
| RDP Brute Force | T1110.001 | 100003 | [ ] YES / [ ] NO | [X] min |
| Nmap SYN Scan | T1046 | 100014 | [ ] YES / [ ] NO | [X] min |
| PowerShell Encoded | T1059.001 | 100005 | [ ] YES / [ ] NO | [X] min |
| Account Creation | T1136.001 | 100009 | [ ] YES / [ ] NO | [X] min |
| Add to Admins | T1098 | 100010 | [ ] YES / [ ] NO | [X] min |
| Shadow Copy Delete | T1490 | 100012 | [ ] YES / [ ] NO | [X] min |
| LSASS Access | T1003.001 | 100013 | [ ] YES / [ ] NO | [X] min |
| Registry Persistence | T1547.001 | 100015 | [ ] YES / [ ] NO | [X] min |
| Certutil Download | T1105 | 100006 | [ ] YES / [ ] NO | [X] min |
| Log4Shell Payload | T1190 | 100019 | [ ] YES / [ ] NO | [X] min |
| Honeypot Interaction | T1110 | 100017 | [ ] YES / [ ] NO | [X] min |
| Network Scan | T1046 | 100014 | [ ] YES / [ ] NO | [X] min |
| Cowrie Brute Force | T1110 | 100017 | [ ] YES / [ ] NO | [X] min |

**Overall detection rate:** [X] / 14 = [X]%

### 12.2 Caldera Operation Results

> **[Insert screenshot: Caldera operation summary page]**

- Operation name: `SOC-Lab-Validation-Run`
- Adversary profile: [Name]
- Abilities executed: [X]
- Abilities detected by Wazuh: [X]
- Detection rate: [X]%

### 12.3 Detection Gaps Identified

| Technique | Gap description | Remediation |
|---|---|---|
| [T1XXX] | [Describe why detection missed] | [New rule or tuning action] |
| [Add rows] | | |

---

## 13. SOC Performance Metrics

> Generated by `13_SOC_Performance_Metrics/mttr_calculator.py --period 30d`

### 13.1 Mean Time to Detect (MTTD)

| Severity | Actual MTTD | Benchmark | Status |
|---|---|---|---|
| Critical | [X] min | ≤ 5 min | [ ] ✅ PASS / [ ] ❌ FAIL |
| High | [X] min | ≤ 15 min | [ ] ✅ PASS / [ ] ❌ FAIL |
| Medium | [X] min | ≤ 60 min | [ ] ✅ PASS / [ ] ❌ FAIL |
| Low | [X] min | ≤ 120 min | [ ] ✅ PASS / [ ] ❌ FAIL |

### 13.2 Mean Time to Respond (MTTR)

| Severity | Actual MTTR | Benchmark | Status |
|---|---|---|---|
| Critical | [X] min | ≤ 60 min | [ ] ✅ PASS / [ ] ❌ FAIL |
| High | [X] min | ≤ 240 min | [ ] ✅ PASS / [ ] ❌ FAIL |
| Medium | [X] min | ≤ 480 min | [ ] ✅ PASS / [ ] ❌ FAIL |
| Low | [X] min | ≤ 1440 min | [ ] ✅ PASS / [ ] ❌ FAIL |

### 13.3 Alert Volume

| Metric | Value |
|---|---|
| Total alerts (30-day period) | [X] |
| Critical (level 12–15) | [X] |
| High (level 8–11) | [X] |
| Medium (level 4–7) | [X] |
| False positive rate | [X]% |
| Alert-to-case conversion rate | [X]% |

> **[Insert screenshot: MTTD/MTTR bar charts from React SOC UI Performance page]**

---

## 14. Dashboards and Visualizations

### 14.1 Kibana Dashboards Deployed

| Dashboard | Objects | Status |
|---|---|---|
| [SOC Lab] Security Overview Dashboard | 9 visualizations + 1 saved search | [ ] Imported |
| [SOC Lab] MITRE ATT&CK Coverage Dashboard | 4 visualizations | [ ] Imported |

**Import command used:**
```bash
curl -X POST "http://localhost:5601/api/saved_objects/_import" \
  -H "kbn-xsrf: true" \
  --form file=@14_Dashboards/kibana_export.ndjson
```

> **[Insert screenshot: Security Overview Dashboard in Kibana]**

> **[Insert screenshot: MITRE ATT&CK Coverage Dashboard]**

### 14.2 React SOC UI

- URL: `http://localhost:3000`
- Pages deployed: Dashboard, Alerts, Cases, Threat Intel, Performance
- Mock data: Included (UI fully functional offline)

> **[Insert screenshot: React SOC Dashboard page]**

> **[Insert screenshot: React Alerts page with severity filter active]**

> **[Insert screenshot: React Performance page showing MTTD/MTTR charts]**

---

## 15. AI and Automation

### 15.1 auto_investigate.py Results

- Daemon mode tested: [ ] Yes  [ ] No
- Average cycle time: [X] seconds
- Alerts processed: [X]
- TheHive cases auto-created: [X]
- IPs enriched via AbuseIPDB: [X]
- Malicious IPs identified: [X]

### 15.2 block_ip.py Results

| IP Blocked | Reason | Method | Result |
|---|---|---|---|
| 203.0.113.45 | SSH brute force (score: 94%) | iptables | [ ] Blocked |
| [Add rows] | | | |

### 15.3 MITRE Heatmap Generation

- Navigator JSON exported: [ ] Yes — `mitre_coverage.json`
- Techniques with alerts: [X]
- Total alert count mapped: [X]

---

## 16. Compliance Mapping

### 16.1 PCI-DSS v4.0 Coverage

| Requirement | Controls implemented | Status |
|---|---|---|
| Req. 1 — Network security controls | pfSense firewall, host-only network isolation | [ ] Met |
| Req. 6 — Secure systems/software | OpenVAS weekly scanning | [ ] Met |
| Req. 8 — Auth and access | Brute-force detection, lockout detection (100004) | [ ] Met |
| Req. 10 — Log and monitor | Wazuh 24/7 logging, 12-month retention policy | [ ] Met |
| Req. 11 — Test security regularly | Purple-team exercises, Caldera, Atomic Red Team | [ ] Met |

Full mapping: [`18_Compliance_Reporting/pci_dss_mapping.md`](../18_Compliance_Reporting/pci_dss_mapping.md)

### 16.2 HIPAA Security Rule Coverage

| Safeguard | Control | Status |
|---|---|---|
| §164.308(a)(1) — Security management | Risk analysis via OpenVAS | [ ] Met |
| §164.308(a)(6) — Incident procedures | TheHive case management | [ ] Met |
| §164.312(b) — Audit controls | Wazuh + Sysmon full audit trail | [ ] Met |
| §164.312(d) — Authentication controls | Brute-force detection rules 100001–100004 | [ ] Met |

---

## 17. Challenges and Lessons Learned

### 17.1 Technical Challenges

| Challenge | Impact | Resolution |
|---|---|---|
| `vm.max_map_count` too low | Elasticsearch failed to start | `sysctl -w vm.max_map_count=262144` |
| Wazuh agent certificate mismatch | Agent showed "never_connected" | Re-enrolled with correct `WAZUH_MANAGER` env var |
| Suricata EVE JSON not ingested | No network alerts in Wazuh | Added `localfile` block to `ossec.conf` |
| [Add your own] | | |

### 17.2 Detection Engineering Lessons

| Lesson | Application |
|---|---|
| High false-positive rate on Nmap rule | Increased SID 9000001 threshold from 100 to 200 packets/10s |
| LSASS rule missing on first test | Added `GrantedAccess` filter to rule 100013 to reduce scope |
| [Add your own] | |

### 17.3 Operational Lessons

> [Describe what you would do differently if building this for a real enterprise environment]

---

## 18. Recommendations

Based on findings from this lab exercise, the following recommendations apply
to any production SOC deployment:

1. **Expand endpoint coverage** — onboard all servers, not just selected VMs.
   At [X]% endpoint coverage, detection gaps exist on unmonitored assets.

2. **Tune false-positive rate below 10%** — current rate of [X]% exceeds the
   industry benchmark of 20% (already passing) but should be reduced further
   by adding allowlist rules for known-good scanner IPs.

3. **Implement SOAR playbooks for all P1 rules** — rules 100012 and 100013
   (ransomware / LSASS) should trigger automatic host isolation, not just
   case creation.

4. **Enable Zeek for behavioral analytics** — Suricata covers signature
   detection; Zeek's connection logs provide the long-duration beacon
   detection Suricata cannot.

5. **Schedule weekly Caldera validation** — continuous automated testing
   ensures new software deployments don't break existing detection coverage.

6. **Increase log retention to 12 months** — current [X]-day retention does
   not meet PCI-DSS Requirement 10.5.1. Configure ILM cold tier.

7. **Enable MFA on all SOC platform UIs** — Wazuh Dashboard, TheHive, and
   MISP all support MFA; enable before any internet exposure.

---

## 19. Conclusion

This SOC lab demonstrates a complete, production-mirroring security operations
capability built on open-source tooling. The deployment achieved:

- **[X]% detection coverage** across MITRE ATT&CK Enterprise techniques relevant to the lab threat model
- **MTTD of [X] minutes** for Critical-severity events — [meeting / exceeding / below] the 5-minute industry benchmark
- **Fully automated alert triage** — from Wazuh alert to enriched TheHive case in under 90 seconds
- **Documented compliance mapping** for PCI-DSS v4.0 Requirement 10 and HIPAA §164.312

The primary gap identified is [describe top gap], which will be addressed by [describe remediation].

---

## 20. Appendices

### Appendix A — API Reference

See [`21_References_Appendices/api_reference.md`](../21_References_Appendices/api_reference.md)

### Appendix B — File Inventory

See [`20_Deliverables/checklist.md`](./checklist.md) for the complete project file listing.

### Appendix C — Raw MTTD/MTTR Data

```
# Paste output of:
# python3 13_SOC_Performance_Metrics/mttr_calculator.py --period 30d
```

### Appendix D — Kibana Export Import Confirmation

```
# Paste output of:
# curl -X POST "http://localhost:5601/api/saved_objects/_import" \
#   -H "kbn-xsrf: true" --form file=@14_Dashboards/kibana_export.ndjson
```

### Appendix E — Wazuh API Agent List

```bash
# Run on SIEM server and paste output:
TOKEN=$(curl -sk -u wazuh-wui:MyS3cr37P450r.*- \
  -X POST "https://localhost:55000/security/user/authenticate" | jq -r .data.token)
curl -sk -X GET "https://localhost:55000/agents" \
  -H "Authorization: Bearer $TOKEN" | jq '.data.affected_items[] | {id,name,ip,status,os_name}'
```