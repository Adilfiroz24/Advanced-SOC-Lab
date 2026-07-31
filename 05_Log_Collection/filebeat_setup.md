# Filebeat Setup — Log Forwarding to Wazuh Indexer

Filebeat ships Wazuh Manager's local alert log (`alerts.json`) to the Wazuh
Indexer (OpenSearch). It is bundled and pre-configured by `wazuh_install.sh`
on the manager itself — this guide covers verification and customization,
plus standalone Filebeat setup for non-Wazuh-agent hosts (e.g. forwarding
raw application logs).

---

## 1. Filebeat on the Wazuh Manager (pre-configured)

The install script in [`04_SIEM_Deployment/wazuh_install.sh`](../04_SIEM_Deployment/wazuh_install.sh)
already installs and configures Filebeat as part of the all-in-one Wazuh
deployment. Verify it's running:

```bash
sudo systemctl status filebeat
sudo filebeat test config -c /etc/filebeat/filebeat.yml
sudo filebeat test output
```

**Expected `test output` result:**
```
elasticsearch: https://192.168.56.10:9200...
  parse url... OK
  connection...
    parse host... OK
    dns lookup... OK
    addresses: 192.168.56.10
    dial up... OK
  TLS...
    security: server's certificate chain verification is enabled
    handshake... OK
  talk to server... OK
```

### Key config: `/etc/filebeat/filebeat.yml`

```yaml
filebeat.inputs:
  - type: log
    paths:
      - /var/ossec/logs/alerts/alerts.json
    json.keys_under_root: true
    json.overwrite_keys: true

output.elasticsearch:
  hosts: ["https://192.168.56.10:9200"]
  protocol: "https"
  username: "admin"
  password: "${INDEXER_PASSWORD}"   # set via env var, never hardcoded
  ssl.certificate_authorities:
    - /etc/filebeat/certs/root-ca.pem
  ssl.certificate: "/etc/filebeat/certs/filebeat.pem"
  ssl.key: "/etc/filebeat/certs/filebeat-key.pem"
  indices:
    - index: "wazuh-alerts-4.x-%{+yyyy.MM.dd}"

setup.template.json.enabled: true
setup.template.json.path: "/etc/filebeat/wazuh-template.json"
setup.template.json.name: "wazuh"
setup.ilm.overwrite: true
```

---

## 2. Standalone Filebeat (optional — for non-Wazuh-agent log sources)

Use this when forwarding raw logs (e.g. a custom application's log file)
that you want indexed alongside Wazuh alerts without going through a full
Wazuh agent install.

### Install

```bash
curl -L -O https://artifacts.elastic.co/downloads/beats/filebeat/filebeat-8.11.0-amd64.deb
sudo dpkg -i filebeat-8.11.0-amd64.deb
```

### Configure (`/etc/filebeat/filebeat.yml`)

```yaml
filebeat.inputs:
  - type: log
    enabled: true
    paths:
      - /var/log/myapp/*.log
    fields:
      log_source: "custom-app"
      environment: "soc-lab"
    fields_under_root: true

output.elasticsearch:
  hosts: ["https://192.168.56.10:9200"]
  username: "admin"
  password: "${INDEXER_PASSWORD}"
  ssl.verification_mode: "certificate"
  ssl.certificate_authorities: ["/etc/filebeat/certs/root-ca.pem"]
  index: "custom-logs-%{+yyyy.MM.dd}"

setup.template.name: "custom-logs"
setup.template.pattern: "custom-logs-*"
```

### Start

```bash
sudo systemctl enable filebeat
sudo systemctl start filebeat
sudo filebeat test output
```

---

## 3. Filebeat Module: System Logs (optional)

To ship raw `/var/log/syslog` and `/var/log/auth.log` independent of Wazuh's
own decoder pipeline (useful for raw forensic search in Kibana):

```bash
sudo filebeat modules enable system
sudo filebeat setup --pipelines --modules system
sudo systemctl restart filebeat
```

---

## 4. Common Issues

| Symptom | Cause | Fix |
|---|---|---|
| `dial up... ERROR connection refused` | Indexer not running or wrong port | `systemctl status wazuh-indexer`, confirm port 9200 |
| `x509: certificate signed by unknown authority` | CA cert path wrong/missing | Verify `ssl.certificate_authorities` path matches `04_SIEM_Deployment/` cert output |
| No new alerts in Kibana/Dashboard | `alerts.json` not being written | Check `logall_json: 'yes'` isn't required (Filebeat only needs the default alerts.json) — verify `/var/ossec/logs/alerts/alerts.json` is updating |
| High CPU on manager | Filebeat re-scanning huge log files | Confirm `ignore_older` and log rotation are configured (see `04_SIEM_Deployment/wazuh_cluster_config.yml` → `logging.rotation`) |

---

## Next Step

Once Filebeat is confirmed shipping alerts, proceed to install **Sysmon**
on Windows endpoints using
[`05_Log_Collection/sysmon_config.xml`](./sysmon_config.xml), then validate
end-to-end forwarding with
[`05_Log_Collection/log_forwarding_test.md`](./log_forwarding_test.md).