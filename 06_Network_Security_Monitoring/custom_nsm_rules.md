# Custom Network Security Monitoring Rules

This document catalogs the custom Suricata signatures deployed in this lab
(installed via [`suricata_install.sh`](./suricata_install.sh) into
`/etc/suricata/rules/local.rules`) and explains the detection logic, tuning
guidance, and how each maps to MITRE ATT&CK.

---

## Rule Catalog

### SID 9000001 — Nmap SYN Scan Detection

```
alert tcp any any -> $HOME_NET any (msg:"SOC-LAB Nmap SYN Scan Detected";
  flags:S; threshold:type threshold, track by_src, count 100, seconds 10;
  classtype:network-scan; sid:9000001; rev:1;)
```

| Field | Value |
|---|---|
| **Logic** | Flags 100+ SYN-only packets from a single source within 10 seconds |
| **MITRE** | T1046 — Network Service Scanning |
| **False positive risk** | Medium — legitimate scanners (Nessus, internal monitoring) will trip this |
| **Tuning** | Increase `count` if internal vulnerability scanners are expected; add `$HOME_NET` exclusions for known scanner IPs via a `pass` rule above this one |

### SID 9000002 — Hydra SSH Brute Force

```
alert tcp any any -> $HOME_NET 22 (msg:"SOC-LAB Hydra SSH Brute Force";
  threshold:type threshold, track by_src, count 10, seconds 5;
  classtype:attempted-admin; sid:9000002; rev:1;)
```

| Field | Value |
|---|---|
| **Logic** | 10+ TCP connections to port 22 from one source in 5 seconds |
| **MITRE** | T1110.001 — Brute Force: Password Guessing |
| **Pairs with** | Wazuh rule `100001` for cross-validation (network + auth-log evidence) |
| **Tuning** | Lower threshold for stricter detection; whitelist known jump-box IPs |

### SID 9000003 — Meterpreter Reverse Shell (Port 4444)

```
alert tcp $HOME_NET any -> any 4444 (msg:"SOC-LAB Meterpreter Reverse Shell Port 4444";
  classtype:trojan-activity; sid:9000003; rev:1;)
```

| Field | Value |
|---|---|
| **Logic** | Any outbound connection to TCP/4444 (Metasploit's classic default) |
| **MITRE** | T1071.001 — Application Layer Protocol: Web Protocols (C2) |
| **False positive risk** | Low — port 4444 is rarely used legitimately |
| **Limitation** | Trivially evaded by changing `LPORT` in Metasploit — pair with behavioral detection (Zeek long-connection hunting) |

### SID 9000004 — RDP Brute Force

```
alert tcp any any -> $HOME_NET 3389 (msg:"SOC-LAB RDP Brute Force Attempt";
  threshold:type threshold, track by_src, count 5, seconds 10;
  classtype:attempted-admin; sid:9000004; rev:1;)
```

| Field | Value |
|---|---|
| **Logic** | 5+ connections to RDP port within 10 seconds |
| **MITRE** | T1110.001 — Brute Force |
| **Tuning** | RDP gateways/jump-hosts will need a `pass` exception |

### SID 9000005 — DNS Tunneling (Volume-Based Heuristic)

```
alert dns any any -> any any (msg:"SOC-LAB Potential DNS Tunneling";
  threshold:type threshold, track by_src, count 50, seconds 5;
  classtype:policy-violation; sid:9000005; rev:1;)
```

| Field | Value |
|---|---|
| **Logic** | 50+ DNS queries from one source in 5 seconds |
| **MITRE** | T1048.001 / T1071.004 — Exfiltration / C2 over DNS |
| **False positive risk** | High on hosts running DNS-heavy software (ad blockers, CDNs) |
| **Improvement** | Combine with Zeek `dns.log` entropy analysis on query names for higher fidelity (see `zeek_setup.md` hunting queries) |

### SID 9000006 — EternalBlue / SMB Exploit Pattern

```
alert tcp any any -> $HOME_NET 445 (msg:"SOC-LAB EternalBlue SMB Exploit Attempt";
  content:"|00 00 00 00 00 01 00 00 00 00|"; classtype:attempted-admin; sid:9000006; rev:1;)
```

| Field | Value |
|---|---|
| **Logic** | Matches a byte pattern characteristic of EternalBlue (MS17-010) exploitation packets |
| **MITRE** | T1210 — Exploitation of Remote Services |
| **Note** | This is a simplified signature for lab demonstration; production deployments should use the full Emerging Threats / ET-Open EternalBlue ruleset (enabled via `suricata-update enable-source et/open`) |

### SID 9000007 — ICMP Flood

```
alert icmp any any -> $HOME_NET any (msg:"SOC-LAB ICMP Flood";
  threshold:type threshold, track by_src, count 100, seconds 10;
  classtype:bad-unknown; sid:9000007; rev:1;)
```

| Field | Value |
|---|---|
| **Logic** | 100+ ICMP packets from one source in 10 seconds |
| **MITRE** | T1498 — Network Denial of Service |
| **Tuning** | Adjust threshold for environments with legitimate high-frequency health checks |

---

## Adding a New Custom Rule

1. Edit `/etc/suricata/rules/local.rules` directly on the SIEM server
2. Pick an unused SID in the `9000xxx` range (reserved for this lab's custom rules)
3. Test syntax before reloading:
   ```bash
   sudo suricata -T -c /etc/suricata/suricata.yaml -v
   ```
4. Reload without dropping the running capture:
   ```bash
   sudo kill -USR2 $(pidof suricata)
   ```
5. Verify the rule loaded:
   ```bash
   sudo suricatasc -c "ruleset-stats" /var/run/suricata/suricata-command.socket
   ```

---

## Rule Tuning Workflow

```
1. Deploy rule  →  2. Generate matching traffic (15_Attack_Simulation/)
       ↓                                                    ↓
4. Adjust threshold/content  ←  3. Review alert in eve.json / Wazuh Dashboard
       ↓
5. Re-test  →  6. Confirm via 19_Testing_Validation/test_scenarios.md
```

---

## Coverage vs. MITRE ATT&CK

| Tactic | Technique | Rule SID |
|---|---|---|
| Discovery | T1046 | 9000001 |
| Credential Access | T1110.001 | 9000002, 9000004 |
| Command and Control | T1071.001 | 9000003 |
| Exfiltration | T1048.001 | 9000005 |
| Initial Access / Lateral Movement | T1210 | 9000006 |
| Impact | T1498 | 9000007 |

For the full enterprise rule set (Wazuh host-based + Suricata network-based
combined), see [`09_Detection_Rules/local_rules.xml`](../09_Detection_Rules/local_rules.xml)
and the MITRE heatmap generator at
[`16_AI_Automation/mitre_heatmap.py`](../16_AI_Automation/mitre_heatmap.py).