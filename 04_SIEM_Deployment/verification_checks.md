# Wazuh Deployment Verification Checks

Run these checks after `wazuh_install.sh` completes (or after `docker-compose up -d`)
to confirm every SIEM component is healthy before moving on to log collection.

---

## 1. Service Status

```bash
# Bare-metal / VM install
sudo systemctl status wazuh-manager
sudo systemctl status wazuh-indexer
sudo systemctl status wazuh-dashboard

# Docker Compose install
docker-compose ps
```

**Expected:** all services show `active (running)` or `healthy`.

---

## 2. Wazuh Indexer (Elasticsearch-compatible) Health

```bash
curl -sk -u admin:SecretPassword1! https://localhost:9200 | jq
```

**Expected output includes:**
```json
{
  "cluster_name": "wazuh-cluster",
  "version": { "number": "..." }
}
```

Check cluster health status (should be `green` or `yellow`, never `red`):
```bash
curl -sk -u admin:SecretPassword1! https://localhost:9200/_cluster/health?pretty
```

---

## 3. Wazuh Manager API

```bash
TOKEN=$(curl -sk -u wazuh-wui:MyS3cr37P450r.*- \
  -X POST "https://localhost:55000/security/user/authenticate" | jq -r .data.token)

curl -sk -X GET "https://localhost:55000/" \
  -H "Authorization: Bearer $TOKEN" | jq
```

**Expected:** JSON response with `"title": "Wazuh API REST"` and version info.

Check manager status specifically:
```bash
curl -sk -X GET "https://localhost:55000/manager/status" \
  -H "Authorization: Bearer $TOKEN" | jq
```

All processes (`wazuh-analysisd`, `wazuh-remoted`, `wazuh-db`, etc.) should show `"running"`.

---

## 4. Wazuh Dashboard (Web UI)

```bash
curl -sk -o /dev/null -w "%{http_code}\n" https://localhost:443
```

**Expected:** `200`

Then browse to `https://<siem-ip>:443` and confirm login succeeds with the
`admin` / indexer password from `.env`.

---

## 5. Agent Connectivity

Once an agent (Windows victim, Ubuntu web server) is enrolled:

```bash
curl -sk -X GET "https://localhost:55000/agents" \
  -H "Authorization: Bearer $TOKEN" | jq '.data.affected_items[] | {id, name, ip, status}'
```

**Expected:** each registered agent shows `"status": "active"`. A status of
`"never_connected"` or `"disconnected"` indicates a firewall, port (1514/1515),
or enrollment key problem — see
[`05_Log_Collection/log_forwarding_test.md`](../05_Log_Collection/log_forwarding_test.md).

---

## 6. Custom Detection Rules Loaded

```bash
curl -sk -X GET "https://localhost:55000/rules?search=SOC-ALERT" \
  -H "Authorization: Bearer $TOKEN" | jq '.data.affected_items[] | {id, description}'
```

**Expected:** the 20 custom rules from
[`09_Detection_Rules/local_rules.xml`](../09_Detection_Rules/local_rules.xml)
(IDs `100001`-`100020`) appear in the results.

---

## 7. Generate a Test Alert

Trigger a benign test event and confirm it reaches the Indexer:

```bash
# From the manager itself — simulate a failed SSH login pattern
logger -p authpriv.warning "sshd[12345]: Failed password for invalid user test from 203.0.113.99 port 51234 ssh2"

# Wait 5-10s, then query Elasticsearch
curl -sk -u admin:SecretPassword1! \
  "https://localhost:9200/wazuh-alerts-*/_search?q=rule.id:5716&size=1&pretty"
```

**Expected:** at least one matching document is returned within ~10 seconds.

---

## 8. Suricata EVE Log Ingestion

```bash
sudo tail -5 /var/log/suricata/eve.json | jq '.event_type'
```

**Expected:** a mix of `flow`, `dns`, `http`, `alert` event types streaming
in real time. Confirm Wazuh is reading the file:

```bash
curl -sk -u admin:SecretPassword1! \
  "https://localhost:9200/wazuh-alerts-*/_search?q=decoder.name:json&size=1&pretty"
```

---

## 9. Performance Tuning Sanity Check

```bash
sysctl vm.max_map_count
# Expected: vm.max_map_count = 262144
```

If this returns a lower value, Elasticsearch/OpenSearch will fail to start
or silently degrade:
```bash
sudo sysctl -w vm.max_map_count=262144
echo "vm.max_map_count=262144" | sudo tee -a /etc/sysctl.conf
```

---

## Verification Summary Checklist

- [ ] `wazuh-manager`, `wazuh-indexer`, `wazuh-dashboard` all running/healthy
- [ ] Indexer cluster health is `green` or `yellow`
- [ ] Manager API authenticates and returns `200`
- [ ] Dashboard reachable at `https://<ip>:443` and login succeeds
- [ ] At least one agent shows `status: active`
- [ ] Custom rules `100001`–`100020` are loaded
- [ ] Test syslog event produces a matching alert in Elasticsearch
- [ ] Suricata EVE JSON is being ingested by Wazuh
- [ ] `vm.max_map_count` is set to `262144`

Once every box above is checked, proceed to
[`05_Log_Collection/`](../05_Log_Collection/) to onboard endpoint agents.