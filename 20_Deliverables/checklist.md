# SOC Lab Project Deliverables Checklist

Complete this checklist to confirm the lab is fully operational and all
deliverables are production-ready. Each item links to the relevant file.

---

## Phase 1 — Environment Setup

- [ ] **Hardware / VM resources confirmed** — host has 16 GB RAM, 200 GB disk, VT-x enabled
  → [`03_Environment_Setup/hardware_specs.md`](../03_Environment_Setup/hardware_specs.md)

- [ ] **VM network topology configured** — all VMs on `192.168.56.0/24`, static IPs assigned
  → [`03_Environment_Setup/vm_config.md`](../03_Environment_Setup/vm_config.md)

- [ ] **Vagrant provisioning successful** — `vagrant up` completes without errors
  → [`03_Environment_Setup/vagrantfile`](../03_Environment_Setup/vagrantfile)

- [ ] **System limit set** — `vm.max_map_count = 262144` confirmed on host
```bash
  sysctl vm.max_map_count
  # Expected: vm.max_map_count = 262144
```

---

## Phase 2 — SIEM Deployment

- [ ] **Wazuh Manager running** — `systemctl status wazuh-manager` shows `active (running)`
  → [`04_SIEM_Deployment/wazuh_install.sh`](../04_SIEM_Deployment/wazuh_install.sh)

- [ ] **Wazuh Indexer healthy** — cluster health `green` or `yellow`, port 9200 responding
  → [`04_SIEM_Deployment/verification_checks.md`](../04_SIEM_Deployment/verification_checks.md)

- [ ] **Wazuh Dashboard accessible** — login succeeds at `https://<siem-ip>:443`

- [ ] **Wazuh API authenticated** — JWT Bearer token returned from `/security/user/authenticate`
```bash
  curl -sk -u wazuh-wui:MyS3cr37P450r.*- \
    -X POST "https://localhost:55000/security/user/authenticate" | jq .data.token
```

- [ ] **`vm.max_map_count` confirmed** — `sysctl vm.max_map_count` returns `262144`

- [ ] **All 9 verification checks pass** — document results in the table below
  → [`04_SIEM_Deployment/verification_checks.md`](../04_SIEM_Deployment/verification_checks.md)

  | Check | Result |
  |---|---|
  | wazuh-manager service | [ ] PASS / [ ] FAIL |
  | wazuh-indexer health | [ ] PASS / [ ] FAIL |
  | wazuh-dashboard HTTP 200 | [ ] PASS / [ ] FAIL |
  | Wazuh API JWT auth | [ ] PASS / [ ] FAIL |
  | Agent connectivity | [ ] PASS / [ ] FAIL |
  | Custom rules loaded | [ ] PASS / [ ] FAIL |
  | Test alert in Elasticsearch | [ ] PASS / [ ] FAIL |
  | Suricata EVE ingestion | [ ] PASS / [ ] FAIL |
  | vm.max_map_count = 262144 | [ ] PASS / [ ] FAIL |

---

## Phase 3 — Log Collection & Agents

- [ ] **Wazuh agent enrolled on Ubuntu web server** — status shows `active` in manager
  → [`05_Log_Collection/filebeat_setup.md`](../05_Log_Collection/filebeat_setup.md)
```bash
  curl -sk "https://localhost:55000/agents?name=ubuntu-webserver" \
    -H "Authorization: Bearer $TOKEN" | jq '.data.affected_items[0].status'
  # Expected: "active"
```

- [ ] **Wazuh agent enrolled on Windows 10 victim** — status shows `active`
```bash
  curl -sk "https://localhost:55000/agents?name=win10-victim" \
    -H "Authorization: Bearer $TOKEN" | jq '.data.affected_items[0].status'
```

- [ ] **Sysmon installed on Windows victim** — config applied from `sysmon_config.xml`
  → [`05_Log_Collection/sysmon_config.xml`](../05_Log_Collection/sysmon_config.xml)
```powershell
  # On Windows victim — confirm Sysmon is running
  Get-Service Sysmon64
  Get-WinEvent -LogName "Microsoft-Windows-Sysmon/Operational" -MaxEvents 1
```

- [ ] **Winlogbeat forwarding Windows EventLogs** to Wazuh Manager port 5044

- [ ] **Filebeat shipping Wazuh alerts** — `sudo filebeat test output` returns OK

- [ ] **All 5 end-to-end log forwarding tests pass**
  → [`05_Log_Collection/log_forwarding_test.md`](../05_Log_Collection/log_forwarding_test.md)

  | Test | Result | Latency |
  |---|---|---|
  | Windows Sysmon → Elasticsearch | [ ] PASS / [ ] FAIL | ___s |
  | Linux syslog → Elasticsearch | [ ] PASS / [ ] FAIL | ___s |
  | Suricata EVE → Elasticsearch | [ ] PASS / [ ] FAIL | ___s |
  | Cowrie honeypot → Elasticsearch | [ ] PASS / [ ] FAIL | ___s |
  | End-to-end avg latency | | ___s |

---

## Phase 4 — Network Security Monitoring

- [ ] **Suricata installed and running** — `systemctl status suricata` shows `active`
  → [`06_Network_Security_Monitoring/suricata_install.sh`](../06_Network_Security_Monitoring/suricata_install.sh)

- [ ] **Suricata EVE JSON flowing** — events appearing in real time
```bash
  sudo tail -f /var/log/suricata/eve.json | jq '.event_type'
```

- [ ] **All 7 custom Suricata rules loaded** — SIDs `9000001`–`9000007` active
  → [`06_Network_Security_Monitoring/custom_nsm_rules.md`](../06_Network_Security_Monitoring/custom_nsm_rules.md)
```bash
  sudo suricatasc -c "ruleset-stats" /var/run/suricata/suricata-command.socket
```

- [ ] **Suricata EVE logs ingested by Wazuh** — `eve.json` in Wazuh `localfile` config block

- [ ] **Emerging Threats rules updated** — `sudo suricata-update` completed successfully

- [ ] **Zeek deployed** *(optional)* — `zeekctl status` shows `running`
  → [`06_Network_Security_Monitoring/zeek_setup.md`](../06_Network_Security_Monitoring/zeek_setup.md)

---

## Phase 5 — Detection Rules

- [ ] **All 20 custom Wazuh rules loaded** — rule IDs `100001`–`100020` visible in API
  → [`09_Detection_Rules/local_rules.xml`](../09_Detection_Rules/local_rules.xml)
```bash
  curl -sk "https://localhost:55000/rules?rule_ids=100001-100020&limit=25" \
    -H "Authorization: Bearer $TOKEN" | jq '.data.total_affected_items'
  # Expected: 20
```

- [ ] **MITRE ATT&CK tactic coverage confirmed across all key tactics:**

  | Tactic | Technique(s) | Rule ID(s) | Covered |
  |---|---|---|---|
  | Credential Access | T1110.001, T1003.001 | 100001–100004, 100013 | [ ] |
  | Execution | T1059.001, T1047 | 100005, 100008 | [ ] |
  | Persistence | T1547.001, T1136.001 | 100009, 100015 | [ ] |
  | Privilege Escalation | T1098, T1548.003 | 100010, 100018 | [ ] |
  | Defense Evasion | T1027, T1218.005, T1105, T1140 | 100006, 100007 | [ ] |
  | Impact | T1486, T1490 | 100011, 100012 | [ ] |
  | Initial Access | T1190 | 100019, 100020 | [ ] |
  | Discovery | T1046 | 100014 | [ ] |
  | Deception / Honeypot | T1110 | 100017 | [ ] |

- [ ] **Sigma converter functional** — `python3 sigma_conversion.py --test` prints converted XML
  → [`09_Detection_Rules/sigma_conversion.py`](../09_Detection_Rules/sigma_conversion.py)

---

## Phase 6 — SOAR & Case Management

- [ ] **TheHive 5 accessible** — `http://<siem-ip>:9000` loads and admin login works
  → [`10_SOAR_Case_Management/docker-compose-thehive.yml`](../10_SOAR_Case_Management/docker-compose-thehive.yml)
```bash
  curl -sf http://localhost:9000/api/status | jq .status
  # Expected: "Ok"
```

- [ ] **Cortex 3 accessible** — `http://<siem-ip>:9001` loads
```bash
  curl -sf http://localhost:9001/api/status | jq .status
```

- [ ] **TheHive API key generated** — stored in `.env` as `THEHIVE_API_KEY`
  *(Administration → Organisation → API Keys → Create)*

- [ ] **TheHive ↔ Cortex linked** — Cortex appears in TheHive Organisation settings

- [ ] **At least one Cortex responder enabled** — `firewall-drop` or Slack notifier configured
  → [`10_SOAR_Case_Management/cortex_responders.py`](../10_SOAR_Case_Management/cortex_responders.py)

- [ ] **Manual test case created in TheHive** — confirms UI and API are working

---

## Phase 7 — Threat Intelligence

- [ ] **MISP accessible** — `https://<siem-ip>:8443` loads, admin login works
  → [`11_Threat_Intelligence/misp_integration.py`](../11_Threat_Intelligence/misp_integration.py)

- [ ] **MISP API key saved** to `.env` as `MISP_API_KEY`

- [ ] **AbuseIPDB API key configured and tested**
  → [`11_Threat_Intelligence/abuseipdb_enrichment.py`](../11_Threat_Intelligence/abuseipdb_enrichment.py)
```bash
  python3 11_Threat_Intelligence/abuseipdb_enrichment.py --test
  # Expected: mock enrichment data printed for 2 IPs
```

- [ ] **VirusTotal API key configured** *(optional)* — saved to `.env` as `VIRUSTOTAL_API_KEY`

- [ ] **MISP IOC sync tested**
```bash
  python3 11_Threat_Intelligence/misp_integration.py --test
  # Expected: IOC files written to /tmp/misp_iocs/
```

- [ ] **Wazuh CDB lists populated** — `/var/ossec/etc/lists/misp_malicious_ips.txt` exists

---

## Phase 8 — Honeypot & Vulnerability Management

- [ ] **Cowrie SSH honeypot running** on port 2222
  → [`07_Honeypot_Deployment/cowrie_docker_run.sh`](../07_Honeypot_Deployment/cowrie_docker_run.sh)
```bash
  docker ps | grep cowrie
  # Confirm container is Up
```

- [ ] **Cowrie JSON logs flowing to Wazuh**
```bash
  sudo tail -3 /var/log/cowrie/cowrie.json | jq .eventid
```

- [ ] **Wazuh localfile config includes cowrie.json** — confirmed in `/var/ossec/etc/ossec.conf`

- [ ] **OpenVAS / Greenbone accessible** *(optional)* — UI reachable at port 9392
  → [`08_Vulnerability_Management/openvas_scan_schedule.sh`](../08_Vulnerability_Management/openvas_scan_schedule.sh)

- [ ] **At least one OpenVAS scan completed** — results saved to `$REPORT_DIR`

---

## Phase 9 — Purple Team Validation

- [ ] **MITRE Caldera server running** — UI accessible at `http://<siem-ip>:8888`
  → [`12_Purple_Team_Automation/caldera_agents.md`](../12_Purple_Team_Automation/caldera_agents.md)

- [ ] **Sandcat agent deployed on win10-victim** — shows `trusted` status in Caldera UI

- [ ] **Sandcat agent deployed on ubuntu-webserver** — shows `trusted` status

- [ ] **At least one Caldera operation completed** — abilities map to Wazuh rule IDs

- [ ] **All 14 Atomic Red Team tests executed**
  → [`12_Purple_Team_Automation/atomic_red_team_tests.yaml`](../12_Purple_Team_Automation/atomic_red_team_tests.yaml)

  | Test | Technique | Rule | Fired |
  |---|---|---|---|
  | SSH Brute Force | T1110.001 | 100001 | [ ] |
  | RDP Brute Force | T1110.001 | 100003 | [ ] |
  | Nmap Scan | T1046 | 100014 | [ ] |
  | PowerShell Encoded | T1059.001 | 100005 | [ ] |
  | Account Creation | T1136.001 | 100009 | [ ] |
  | Add to Admins | T1098 | 100010 | [ ] |
  | Shadow Copy Delete | T1490 | 100012 | [ ] |
  | LSASS Access | T1003.001 | 100013 | [ ] |
  | Registry Persistence | T1547.001 | 100015 | [ ] |
  | Certutil Download | T1105 | 100006 | [ ] |
  | Log4Shell | T1190 | 100019 | [ ] |
  | Honeypot Interaction | T1110 | 100017 | [ ] |
  | Network Scan | T1046 | 100014 | [ ] |
  | Cowrie Brute Force | T1110 | 100017 | [ ] |

- [ ] **All 10 test scenarios validated and results recorded**
  → [`19_Testing_Validation/test_scenarios.md`](../19_Testing_Validation/test_scenarios.md)

- [ ] **Detection rate ≥ 90%** — at least 9/10 scenarios produced Wazuh alerts

  **Actual detection rate: ___/10 = ___%**

---

## Phase 10 — Dashboards & Metrics

- [ ] **Kibana dashboards imported successfully** — both dashboards visible in Kibana
  → [`14_Dashboards/kibana_export.ndjson`](../14_Dashboards/kibana_export.ndjson)
```bash
  curl -X POST "http://localhost:5601/api/saved_objects/_import" \
    -H "kbn-xsrf: true" \
    --form file=@14_Dashboards/kibana_export.ndjson
  # Expected: {"successCount":14,"success":true}
```

- [ ] **[SOC Lab] Security Overview Dashboard** loads with data in Kibana

- [ ] **[SOC Lab] MITRE ATT&CK Coverage Dashboard** loads with technique counts

- [ ] **React SOC UI running** — `npm start` succeeds, all 5 pages load without errors
  → [`src/`](../src/)
```bash
  npm install && npm start
  # Visit http://localhost:3000
```

- [ ] **All 5 UI pages functional:**
  - [ ] Dashboard — stats cards, alert timeline, MITRE heatmap, live feed
  - [ ] Alerts — sortable table with severity/status filters
  - [ ] Cases — TheHive-style case list with task progress bars
  - [ ] Threat Intel — MISP IOC feed with confidence scoring
  - [ ] Performance — MTTD/MTTR charts vs. benchmarks

- [ ] **MTTD/MTTR report generated** — values recorded below
  → [`13_SOC_Performance_Metrics/mttr_calculator.py`](../13_SOC_Performance_Metrics/mttr_calculator.py)
```bash
  python3 13_SOC_Performance_Metrics/mttr_calculator.py --period 30d
```

  | Metric | Actual | Benchmark | Status |
  |---|---|---|---|
  | MTTD Critical | ___ min | ≤ 5 min | [ ] PASS / [ ] FAIL |
  | MTTD High | ___ min | ≤ 15 min | [ ] PASS / [ ] FAIL |
  | MTTR Critical | ___ min | ≤ 60 min | [ ] PASS / [ ] FAIL |
  | MTTR High | ___ min | ≤ 240 min | [ ] PASS / [ ] FAIL |
  | False Positive Rate | ___% | ≤ 20% | [ ] PASS / [ ] FAIL |

- [ ] **MITRE ATT&CK Navigator layer generated**
  → [`16_AI_Automation/mitre_heatmap.py`](../16_AI_Automation/mitre_heatmap.py)
```bash
  python3 16_AI_Automation/mitre_heatmap.py --test --print
  # Confirm mitre_coverage.json written
```

---

## Phase 11 — Automation

- [ ] **`auto_investigate.py` daemon functional** — processes alerts and creates TheHive cases
  → [`16_AI_Automation/auto_investigate.py`](../16_AI_Automation/auto_investigate.py)
```bash
  python3 16_AI_Automation/auto_investigate.py --test
  # Expected: 3 mock alerts processed, DRY RUN output with IOCs
```

- [ ] **`block_ip.py` dry-run tested** — prints iptables commands without executing
  → [`16_AI_Automation/block_ip.py`](../16_AI_Automation/block_ip.py)
```bash
  python3 16_AI_Automation/block_ip.py --ip 198.51.100.1 \
    --reason "Checklist test" --test
  # Expected: DRY RUN lines printed, no actual block
```

- [ ] **`backup_script.sh` tested** — archive created in `$BACKUP_ROOT`
  → [`17_Backup_Disaster_Recovery/backup_script.sh`](../17_Backup_Disaster_Recovery/backup_script.sh)
```bash
  sudo bash 17_Backup_Disaster_Recovery/backup_script.sh
  # Expected: soc_backup_YYYYMMDD_HHMMSS.tar.gz in /opt/soc-backups/
```

- [ ] **`mitre_heatmap.py` functional** — Navigator JSON exported
  → [`16_AI_Automation/mitre_heatmap.py`](../16_AI_Automation/mitre_heatmap.py)

- [ ] **`misp_integration.py` functional** — CDB files written
  → [`11_Threat_Intelligence/misp_integration.py`](../11_Threat_Intelligence/misp_integration.py)

---

## Phase 12 — Documentation & Compliance

- [ ] **PCI-DSS v4.0 Requirement 10 fully mapped** — all 13 sub-requirements have lab controls
  → [`18_Compliance_Reporting/pci_dss_mapping.md`](../18_Compliance_Reporting/pci_dss_mapping.md)

- [ ] **HIPAA Technical Safeguards mapped** — §164.308 and §164.312 controls documented

- [ ] **Final report completed** — all 20 sections filled in with real data and screenshots
  → [`20_Deliverables/report_template.md`](./report_template.md)

- [ ] **API reference reviewed by team** — analysts know Wazuh, TheHive, MISP, AbuseIPDB endpoints
  → [`21_References_Appendices/api_reference.md`](../21_References_Appendices/api_reference.md)

- [ ] **All `.env` default credentials rotated** — no placeholder values remain in production
```bash
  grep -r "SecretPassword1!\|MyS3cr37P450r\|Admin1234\|minioadmin" .env
  # Expected: no matches — all changed to unique passwords
```

- [ ] **`.gitignore` confirmed** — `.env` and cert files are excluded
```bash
  git status --short | grep "\.env"
  # Expected: no .env listed (it is properly ignored)
```

- [ ] **README.md accurate** — service URLs, ports, and credentials table matches deployment
  → [`README.md`](../README.md)

---

## Final Sign-Off

| Milestone | Owner | Completed Date | Notes |
|---|---|---|---|
| Phase 1 — Environment provisioned | | | |
| Phase 2 — SIEM fully operational | | | |
| Phase 3 — All agents active + logs flowing | | | |
| Phase 4 — Suricata IDS/IPS active | | | |
| Phase 5 — All 20 custom rules loaded | | | |
| Phase 6 — TheHive + Cortex operational | | | |
| Phase 7 — Threat intel feeds connected | | | |
| Phase 8 — Honeypot + vuln scanning active | | | |
| Phase 9 — Purple team exercises complete | | | |
| Phase 10 — Dashboards deployed + metrics captured | | | |
| Phase 11 — All automation scripts tested | | | |
| Phase 12 — Documentation + compliance complete | | | |
| **Detection rate ≥ 90%** | | | ___/10 scenarios |
| **MTTD Critical ≤ 5 min** | | | ___ min actual |
| **MTTR Critical ≤ 60 min** | | | ___ min actual |
| **False positive rate ≤ 20%** | | | ___% actual |
| **Final report submitted** | | | |

---

## Project File Inventory

Confirm every file in the project tree is present:

```bash
# Run from project root to check for missing files
find . -name "*.md" -o -name "*.py" -o -name "*.sh" -o \
       -name "*.xml" -o -name "*.yml" -o -name "*.yaml" -o \
       -name "*.json" -o -name "*.ndjson" -o -name "*.jsx" \
  | grep -v node_modules | grep -v ".git" | sort
```

**Expected total files: 65+ across 21 sections + src/ + root config files**