# Log Forwarding End-to-End Test

This document walks through verifying that telemetry flows correctly from
each endpoint type all the way to the Wazuh Indexer, with copy-paste test
commands and expected results at every hop.

```
Endpoint → Wazuh Agent → Manager (1514/tcp) → analysisd → Filebeat → Indexer (9200) → Dashboard
```

---

## Test 1 — Windows Sysmon → Wazuh Agent → Manager

### Step 1: Generate a test Sysmon event (Windows victim, PowerShell as Admin)

```powershell
# Trigger Sysmon Event ID 1 (Process Create) with a LOLBin pattern
# matching rule 100006 (certutil abuse)
certutil.exe -urlcache -split -f "https://example.com/test.txt" C:\Windows\Temp\test.txt
```

### Step 2: Confirm Sysmon logged it locally

```powershell
Get-WinEvent -LogName "Microsoft-Windows-Sysmon/Operational" -MaxEvents 5 |
  Where-Object {$_.Id -eq 1} | Format-List
```

**Expected:** an event showing `Image: certutil.exe` and `CommandLine` containing `-urlcache`.

### Step 3: Confirm the Wazuh agent picked it up

```powershell
Get-Content "C:\Program Files (x86)\ossec-agent\active-response\active-responses.log" -Tail 20
# Or check agent connection status:
& "C:\Program Files (x86)\ossec-agent\agent-auth.exe" -h
```

### Step 4: Confirm the manager received and matched rule 100006

On the SIEM server:
```bash
sudo tail -f /var/ossec/logs/alerts/alerts.log | grep -A5 "100006"
```

**Expected output:**
```
Rule: 100006 (level 13) -> 'SOC-CRITICAL: Certutil LOLBin abuse...'
```

### Step 5: Confirm it reached the Indexer

```bash
curl -sk -u admin:SecretPassword1! \
  "https://localhost:9200/wazuh-alerts-*/_search?q=rule.id:100006&size=1&pretty"
```

**✅ Pass criteria:** matching document returned within ~10 seconds of Step 1.

---

## Test 2 — Linux Syslog → Wazuh Agent → Manager

### Step 1: Generate a test SSH brute-force pattern (on a monitored Ubuntu host)

```bash
for i in {1..12}; do
  logger -p authpriv.warning "sshd[$$]: Failed password for invalid user testuser$i from 203.0.113.45 port 5100$i ssh2"
  sleep 1
done
```

### Step 2: Confirm the manager matched rule `100001` (SSH brute force)

```bash
sudo tail -f /var/ossec/logs/alerts/alerts.log | grep -A5 "100001"
```

### Step 3: Confirm in Indexer

```bash
curl -sk -u admin:SecretPassword1! \
  "https://localhost:9200/wazuh-alerts-*/_search?q=rule.id:100001&size=1&pretty"
```

**✅ Pass criteria:** alert level 10 event for rule `100001` appears in Elasticsearch.

---

## Test 3 — Suricata EVE JSON → Wazuh → Indexer

### Step 1: Generate network scan traffic (from Kali attacker VM)

```bash
nmap -sS -T4 192.168.56.10
```

### Step 2: Confirm Suricata logged it

```bash
# On SIEM server
sudo tail -f /var/log/suricata/eve.json | jq 'select(.event_type=="alert")'
```

**Expected:** an `alert` event with `"signature": "SOC-LAB Nmap SYN Scan Detected"`.

### Step 3: Confirm Wazuh ingested the EVE log and matched rule `100014`

```bash
curl -sk -u admin:SecretPassword1! \
  "https://localhost:9200/wazuh-alerts-*/_search?q=rule.id:100014&size=1&pretty"
```

---

## Test 4 — Cowrie Honeypot → Wazuh → Indexer

### Step 1: Trigger honeypot interaction (from Kali attacker)

```bash
ssh -p 2222 root@192.168.56.10
# Try password: "password" or "123456" (in userdb.txt) — login will "succeed"
# Run a command inside the fake shell, e.g.: whoami
exit
```

### Step 2: Confirm Cowrie logged the session

```bash
sudo tail -f /var/log/cowrie/cowrie.json | jq '.eventid'
```

**Expected:** `cowrie.session.connect`, `cowrie.login.success`, `cowrie.command.input`, etc.

### Step 3: Confirm Wazuh matched rule `100017`

```bash
curl -sk -u admin:SecretPassword1! \
  "https://localhost:9200/wazuh-alerts-*/_search?q=rule.id:100017&size=1&pretty"
```

---

## Test 5 — Confirm Dashboard Visualization

1. Browse to `https://<siem-ip>:443`
2. Navigate to **Security Events** → set time range to "Last 15 minutes"
3. Confirm all four test alerts above appear in the table
4. Click any alert → confirm **MITRE ATT&CK** tab shows the mapped technique

---

## Latency Benchmark

Run all 4 tests above and record the time from event generation to
appearance in Elasticsearch. Healthy lab latency:

| Hop | Expected latency |
|---|---|
| Endpoint → Wazuh Manager | < 2 seconds |
| Manager → Filebeat → Indexer | < 5 seconds |
| **End-to-end (event → searchable)** | **< 10 seconds** |

If end-to-end latency consistently exceeds 30 seconds, check:
- `vm.max_map_count` (see [`04_SIEM_Deployment/verification_checks.md`](../04_SIEM_Deployment/verification_checks.md))
- Indexer JVM heap pressure: `curl -sk -u admin:pass https://localhost:9200/_nodes/stats/jvm | jq`
- Network latency between agent and manager: `ping 192.168.56.10`

---

## Full Pipeline Checklist

- [ ] Windows Sysmon event reaches Indexer (Test 1)
- [ ] Linux syslog event reaches Indexer (Test 2)
- [ ] Suricata network alert reaches Indexer (Test 3)
- [ ] Cowrie honeypot event reaches Indexer (Test 4)
- [ ] All 4 alert types visible in Wazuh Dashboard (Test 5)
- [ ] End-to-end latency under 10 seconds

Once all checks pass, proceed to
[`06_Network_Security_Monitoring/`](../06_Network_Security_Monitoring/) for
deeper Suricata/Zeek tuning, or jump to
[`09_Detection_Rules/`](../09_Detection_Rules/) to review/extend custom rules.