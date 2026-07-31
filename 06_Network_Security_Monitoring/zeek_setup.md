# Zeek Network Security Monitor — Setup Guide

Zeek (formerly Bro) complements Suricata by providing rich, structured
**protocol-level metadata** (connection logs, DNS, HTTP, SSL, files) rather
than signature-based alerts. In this lab, Zeek's structured logs feed
behavioral detection and threat hunting, while Suricata handles real-time
signature matching/blocking.

| | Suricata | Zeek |
|---|---|---|
| **Purpose** | Signature-based IDS/IPS, real-time alerting | Protocol parsing, behavioral logging, threat hunting |
| **Output** | `eve.json` (alerts + flow) | `conn.log`, `dns.log`, `http.log`, `ssl.log`, `files.log`, etc. |
| **Best for** | Known-bad pattern matching, active blocking | Anomaly detection, retrospective investigation |

---

## 1. Installation (Ubuntu 22.04)

```bash
# Add Zeek's official repo
echo 'deb http://download.opensuse.org/repositories/security:/zeek/xUbuntu_22.04/ /' | \
  sudo tee /etc/apt/sources.list.d/security:zeek.list
curl -fsSL https://download.opensuse.org/repositories/security:zeek/xUbuntu_22.04/Release.key | \
  gpg --dearmor | sudo tee /etc/apt/trusted.gpg.d/security_zeek.gpg > /dev/null

sudo apt-get update -y
sudo apt-get install -y zeek

# Add Zeek binaries to PATH
echo 'export PATH=/opt/zeek/bin:$PATH' | sudo tee -a /etc/profile.d/zeek.sh
source /etc/profile.d/zeek.sh
zeek --version
```

---

## 2. Configure the Monitoring Interface

Edit `/opt/zeek/etc/node.cfg`:

```ini
[zeek]
type=standalone
host=localhost
interface=eth1   # Replace with your monitoring NIC (the host-only adapter)
```

Edit `/opt/zeek/etc/networks.cfg` to define your home network for correct
internal/external traffic classification:

```
192.168.56.0/24    SOC Lab Network
```

---

## 3. Enable Useful Scripts

Edit `/opt/zeek/share/zeek/site/local.zeek` and add:

```zeek
# Core protocol logging (enabled by default, listed for clarity)
@load base/protocols/conn
@load base/protocols/dns
@load base/protocols/http
@load base/protocols/ssl
@load base/protocols/ssh
@load base/protocols/smtp
@load base/protocols/ftp
@load base/files/extract

# Detect long-lived / beaconing connections (C2 indicator)
@load policy/protocols/conn/known-hosts
@load policy/protocols/conn/known-services

# Detect SSL/TLS certificate anomalies (self-signed C2 certs)
@load policy/protocols/ssl/validate-certs
@load policy/protocols/ssl/notary

# Software/version fingerprinting (vulnerable client/server detection)
@load policy/frameworks/software/vulnerable

# File extraction — pull binaries seen over HTTP/SMTP/FTP for analysis
redef FileExtract::prefix = "/opt/zeek/extracted_files/";

# JSON logging — required for Wazuh/Filebeat ingestion
@load policy/tuning/json-logs
```

---

## 4. Deploy & Verify

```bash
sudo zeekctl deploy
sudo zeekctl status
```

**Expected:**
```
Name      Type       Host   Status   Pid    Started
zeek      standalone localhost running  1234   ...
```

Tail logs to confirm traffic is being parsed:
```bash
tail -f /opt/zeek/logs/current/conn.log
```

---

## 5. Wazuh Integration — Forward Zeek JSON Logs

Add to `/var/ossec/etc/ossec.conf` on the manager:

```xml
<localfile>
  <log_format>json</log_format>
  <location>/opt/zeek/logs/current/conn.log</location>
  <label key="@source">zeek-conn</label>
</localfile>
<localfile>
  <log_format>json</log_format>
  <location>/opt/zeek/logs/current/dns.log</location>
  <label key="@source">zeek-dns</label>
</localfile>
<localfile>
  <log_format>json</log_format>
  <location>/opt/zeek/logs/current/http.log</location>
  <label key="@source">zeek-http</label>
</localfile>
<localfile>
  <log_format>json</log_format>
  <location>/opt/zeek/logs/current/ssl.log</location>
  <label key="@source">zeek-ssl</label>
</localfile>
<localfile>
  <log_format>json</log_format>
  <location>/opt/zeek/logs/current/notice.log</location>
  <label key="@source">zeek-notice</label>
</localfile>
```

```bash
sudo systemctl restart wazuh-manager
```

> **Note:** Zeek's default ASCII TSV logs must use `JSON::default_compress=F`
> and `@load policy/tuning/json-logs` (already added in step 3) to emit
> proper JSON that Wazuh's `json` decoder can parse.

---

## 6. Log Rotation (avoid filling disk)

Zeek auto-rotates logs hourly into `/opt/zeek/logs/<date>/`. Add cleanup
to your crontab:

```bash
# /etc/cron.d/zeek-cleanup
0 3 * * * root find /opt/zeek/logs -type f -mtime +14 -name "*.log.gz" -delete
```

---

## 7. Useful Hunting Queries (once ingested into Wazuh/Kibana)

| Hunt | Zeek log | Query example |
|---|---|---|
| Long-duration connections (possible C2 beaconing) | `conn.log` | `duration:>3600 AND orig_bytes:<1000` |
| DNS to newly-seen domains | `dns.log` | `query:*.xyz OR query:*.top` |
| Self-signed TLS certificates | `ssl.log` | `validation_status:"self signed certificate"` |
| Unusual user agents | `http.log` | `NOT user_agent:Mozilla*` |

---

## Verification Checklist

- [ ] `zeekctl status` shows `running`
- [ ] `conn.log`, `dns.log`, `http.log`, `ssl.log` are populating
- [ ] Logs are valid JSON (`jq . conn.log | head`)
- [ ] Wazuh manager config includes all 5 Zeek `<localfile>` blocks
- [ ] Test query against Elasticsearch returns Zeek-sourced documents:
  ```bash
  curl -sk -u admin:pass "https://localhost:9200/wazuh-alerts-*/_search?q=data.@source:zeek-conn&size=1&pretty"
  ```

Continue to [`custom_nsm_rules.md`](./custom_nsm_rules.md) to layer custom
Suricata signatures on top of this Zeek baseline.