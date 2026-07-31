# API Reference — Advanced SOC Lab

Complete REST API reference for all SOC Lab platforms.
All curl examples use the lab's default network (`192.168.56.10`).
Replace credentials with the values from your `.env` file.

---

## 1. Wazuh REST API

**Base URL:** `https://192.168.56.10:55000`  
**Auth:** JWT Bearer token (obtained below)  
**TLS:** Self-signed cert — use `-k` / `--insecure` in curl during lab  
**Documentation:** https://documentation.wazuh.com/current/user-manual/api/reference.html

### 1.1 Authentication

```bash
# Obtain JWT token (valid 900 seconds by default)
TOKEN=$(curl -sk -u wazuh-wui:MyS3cr37P450r.*- \
  -X POST "https://192.168.56.10:55000/security/user/authenticate" \
  | jq -r '.data.token')

echo "Token: $TOKEN"

# All subsequent requests use:
# -H "Authorization: Bearer $TOKEN"
```

### 1.2 Manager Status

```bash
# Full manager status
curl -sk -X GET "https://192.168.56.10:55000/manager/status" \
  -H "Authorization: Bearer $TOKEN" | jq

# Manager info (version, build)
curl -sk -X GET "https://192.168.56.10:55000/manager/info" \
  -H "Authorization: Bearer $TOKEN" | jq

# Manager configuration
curl -sk -X GET "https://192.168.56.10:55000/manager/configuration" \
  -H "Authorization: Bearer $TOKEN" | jq '.data.affected_items[0].global'
```

### 1.3 Agents

```bash
# List all agents
curl -sk -X GET "https://192.168.56.10:55000/agents" \
  -H "Authorization: Bearer $TOKEN" | jq \
  '.data.affected_items[] | {id, name, ip, status, os_name, version}'

# Get specific agent by name
curl -sk -X GET "https://192.168.56.10:55000/agents?name=win10-victim" \
  -H "Authorization: Bearer $TOKEN" | jq '.data.affected_items[0]'

# Get agent summary (active/disconnected counts)
curl -sk -X GET "https://192.168.56.10:55000/agents/summary/status" \
  -H "Authorization: Bearer $TOKEN" | jq

# Restart a specific agent
curl -sk -X PUT "https://192.168.56.10:55000/agents/001/restart" \
  -H "Authorization: Bearer $TOKEN" | jq

# Delete/remove an agent
curl -sk -X DELETE "https://192.168.56.10:55000/agents?agents_list=001&status=all&older_than=0s" \
  -H "Authorization: Bearer $TOKEN" | jq
```

### 1.4 Rules

```bash
# List all custom rules (IDs 100000-200000)
curl -sk -X GET "https://192.168.56.10:55000/rules?rule_ids=100001-100020&limit=25" \
  -H "Authorization: Bearer $TOKEN" | jq \
  '.data.affected_items[] | {id, level, description}'

# Search rules by description keyword
curl -sk -X GET "https://192.168.56.10:55000/rules?search=brute+force" \
  -H "Authorization: Bearer $TOKEN" | jq '.data.affected_items[] | {id, level, description}'

# Get a specific rule by ID
curl -sk -X GET "https://192.168.56.10:55000/rules?rule_ids=100013" \
  -H "Authorization: Bearer $TOKEN" | jq
```

### 1.5 Alerts (via Wazuh Indexer / Elasticsearch)

The Wazuh API itself does not expose alert search — query the Indexer directly:

```bash
# All alerts in the last hour
curl -sk -u admin:SecretPassword1! \
  "https://192.168.56.10:9200/wazuh-alerts-*/_search" \
  -H "Content-Type: application/json" -d '{
    "query": {"range": {"timestamp": {"gte": "now-1h"}}},
    "sort": [{"timestamp": {"order": "desc"}}],
    "size": 10
  }' | jq '.hits.hits[]._source | {timestamp, "rule_id": .rule.id, "level": .rule.level, "desc": .rule.description, "agent": .agent.name}'

# Alerts for a specific rule ID
curl -sk -u admin:SecretPassword1! \
  "https://192.168.56.10:9200/wazuh-alerts-*/_search?q=rule.id:100001&size=5&pretty"

# Alert count aggregation by rule ID (last 24h)
curl -sk -u admin:SecretPassword1! \
  "https://192.168.56.10:9200/wazuh-alerts-*/_search" \
  -H "Content-Type: application/json" -d '{
    "query": {"range": {"timestamp": {"gte": "now-24h"}}},
    "aggs": {"by_rule": {"terms": {"field": "rule.id", "size": 25}}},
    "size": 0
  }' | jq '.aggregations.by_rule.buckets[] | {rule_id: .key, count: .doc_count}'

# Alerts for a specific source IP
curl -sk -u admin:SecretPassword1! \
  "https://192.168.56.10:9200/wazuh-alerts-*/_search?q=data.srcip:203.0.113.45&size=5&pretty"

# Critical alerts only (level >= 12)
curl -sk -u admin:SecretPassword1! \
  "https://192.168.56.10:9200/wazuh-alerts-*/_search" \
  -H "Content-Type: application/json" -d '{
    "query": {"bool": {"must": [
      {"range": {"timestamp": {"gte": "now-1h"}}},
      {"range": {"rule.level": {"gte": 12}}}
    ]}},
    "sort": [{"timestamp": {"order": "desc"}}],
    "size": 20
  }' | jq '.hits.hits[]._source | {timestamp, "rule_id": .rule.id, "level": .rule.level, "desc": .rule.description}'
```

### 1.6 Active Response

```bash
# Run firewall-drop active response on an agent
curl -sk -X PUT "https://192.168.56.10:55000/active-response" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"command":"firewall-drop","arguments":["-", "null", "(null)", "203.0.113.45", "1001", "5716", "9"]}' \
  --data-urlencode "agents_list=001"

# List available active response commands
curl -sk -X GET "https://192.168.56.10:55000/manager/configuration?section=active-response" \
  -H "Authorization: Bearer $TOKEN" | jq
```

### 1.7 SCA (Security Configuration Assessment)

```bash
# List SCA policies for an agent
curl -sk -X GET "https://192.168.56.10:55000/sca/001" \
  -H "Authorization: Bearer $TOKEN" | jq '.data.affected_items[] | {policy_id, name, pass, fail, score}'

# Get individual SCA check results
curl -sk -X GET "https://192.168.56.10:55000/sca/001/checks/cis_ubuntu22-04" \
  -H "Authorization: Bearer $TOKEN" | jq '.data.affected_items[:5]'
```

---

## 2. TheHive API (v5)

**Base URL:** `http://192.168.56.10:9000`  
**Auth:** `Authorization: Bearer <api-key>` (generate in TheHive UI: Organisation → API Keys)  
**Documentation:** https://docs.strangebee.com/thehive/api-docs/

```bash
# Set your key once
TH_KEY="your-thehive-api-key"
TH="http://192.168.56.10:9000"
TH_H="-H \"Authorization: Bearer $TH_KEY\" -H \"Content-Type: application/json\""
```

### 2.1 Cases

```bash
# List all cases (newest first)
curl -sf "$TH/api/v1/query" \
  -H "Authorization: Bearer $TH_KEY" \
  -H "Content-Type: application/json" \
  -d '{"query":[{"_name":"listCase"},{"_name":"sort","_fields":[{"startDate":"desc"}]},{"_name":"page","from":0,"to":25}]}' \
  | jq '.[] | {id: ._id, title, severity, status, assignee}'

# Get a single case by ID
curl -sf "$TH/api/v1/case/<case-id>" \
  -H "Authorization: Bearer $TH_KEY" | jq

# Create a new case
curl -sf -X POST "$TH/api/v1/case" \
  -H "Authorization: Bearer $TH_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "[SOC-AUTO] SSH Brute Force from 203.0.113.45",
    "description": "Wazuh rule 100001 fired — 47 failed SSH attempts in 60s.\n\nSource: 203.0.113.45\nAbuseIPDB score: 94%",
    "severity": 3,
    "startDate": '"$(date +%s%3N)"',
    "tags": ["wazuh-auto", "T1110.001", "ssh"],
    "flag": false,
    "tlp": 2,
    "pap": 2
  }' | jq '{id: ._id, title, severity, status}'

# Update case status to Resolved
curl -sf -X PATCH "$TH/api/v1/case/<case-id>" \
  -H "Authorization: Bearer $TH_KEY" \
  -H "Content-Type: application/json" \
  -d '{"status":"Resolved","resolution":"TruePositive","summary":"IP blocked via iptables. No further activity observed."}' \
  | jq '{id: ._id, status, resolution}'

# Add a task to a case
curl -sf -X POST "$TH/api/v1/case/<case-id>/task" \
  -H "Authorization: Bearer $TH_KEY" \
  -H "Content-Type: application/json" \
  -d '{"title":"Block source IP on firewall","group":"Containment","status":"Waiting"}' \
  | jq '{id: ._id, title, status}'
```

### 2.2 Observables (IOCs)

```bash
# Add an IP observable to a case
curl -sf -X POST "$TH/api/v1/case/<case-id>/observable" \
  -H "Authorization: Bearer $TH_KEY" \
  -H "Content-Type: application/json" \
  -d '{"dataType":"ip","data":"203.0.113.45","ioc":true,"tlp":2,"tags":["brute-force","abuseipdb-94"]}' \
  | jq '{id: ._id, dataType, data, ioc}'

# Add a hash observable
curl -sf -X POST "$TH/api/v1/case/<case-id>/observable" \
  -H "Authorization: Bearer $TH_KEY" \
  -H "Content-Type: application/json" \
  -d '{"dataType":"hash","data":"5f1d8aa80a4463a86e0c2df4e3fd9d15aabb12d52fd0cf91dc1ef0edc6a68c3a","ioc":true,"tlp":2,"tags":["mimikatz","T1003.001"]}' \
  | jq

# List observables for a case
curl -sf "$TH/api/v1/query" \
  -H "Authorization: Bearer $TH_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"query\":[{\"_name\":\"getCase\",\"idOrName\":\"<case-id>\"},{\"_name\":\"observables\"}]}" \
  | jq '.[] | {dataType, data, ioc}'
```

### 2.3 Alerts

```bash
# List recent alerts (TheHive alert = pre-case notification)
curl -sf "$TH/api/v1/query" \
  -H "Authorization: Bearer $TH_KEY" \
  -H "Content-Type: application/json" \
  -d '{"query":[{"_name":"listAlert"},{"_name":"sort","_fields":[{"date":"desc"}]},{"_name":"page","from":0,"to":10}]}' \
  | jq '.[] | {id: ._id, title, severity, status}'

# Create a TheHive alert from a Wazuh event
curl -sf -X POST "$TH/api/v1/alert" \
  -H "Authorization: Bearer $TH_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "wazuh",
    "source": "wazuh-manager",
    "sourceRef": "rule-100013-'"$(date +%s)"'",
    "title": "LSASS credential dump detected on win10-victim",
    "description": "Rule 100013 (level 15): LSASS memory access matching Mimikatz pattern.",
    "severity": 4,
    "date": '"$(date +%s%3N)"',
    "tags": ["T1003.001","wazuh","critical"],
    "tlp": 2
  }' | jq '{id: ._id, title, status}'
```

### 2.4 Status

```bash
# Platform health check
curl -sf "$TH/api/status" | jq '{status: .status, version: .versions.TheHive}'
```

---

## 3. Cortex API

**Base URL:** `http://192.168.56.10:9001`  
**Auth:** `Authorization: Bearer <api-key>` (set up in Cortex UI on first run)  
**Documentation:** https://github.com/TheHive-Project/Cortex/wiki/API-Guide

```bash
CX_KEY="your-cortex-api-key"
CX="http://192.168.56.10:9001"
```

### 3.1 Analyzers

```bash
# List all enabled analyzers
curl -sf "$CX/api/analyzer" \
  -H "Authorization: Bearer $CX_KEY" \
  | jq '.[] | {id, name, version, dataTypeList}'

# Find analyzers that accept IP addresses
curl -sf "$CX/api/analyzer/type/ip" \
  -H "Authorization: Bearer $CX_KEY" \
  | jq '.[].name'

# Run AbuseIPDB analyzer on an IP
curl -sf -X POST "$CX/api/analyzer/AbuseIPDB_1_0/run" \
  -H "Authorization: Bearer $CX_KEY" \
  -H "Content-Type: application/json" \
  -d '{"data":"203.0.113.45","dataType":"ip","tlp":2}' \
  | jq '{id, status}'
```

### 3.2 Jobs

```bash
# Get job status and report
curl -sf "$CX/api/job/<job-id>" \
  -H "Authorization: Bearer $CX_KEY" \
  | jq '{id, status, startDate, endDate}'

# Get job report/results
curl -sf "$CX/api/job/<job-id>/report" \
  -H "Authorization: Bearer $CX_KEY" | jq

# List recent jobs
curl -sf "$CX/api/job?limit=10" \
  -H "Authorization: Bearer $CX_KEY" \
  | jq '.[] | {id, analyzerName, status, date}'
```

### 3.3 Responders

```bash
# List all responders
curl -sf "$CX/api/responder" \
  -H "Authorization: Bearer $CX_KEY" \
  | jq '.[] | {id, name, dataTypeList}'

# Run a responder (e.g., block IP on pfSense)
curl -sf -X POST "$CX/api/responder/<responder-id>/run" \
  -H "Authorization: Bearer $CX_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "data": {"ip": "203.0.113.45", "reason": "Brute force T1110.001"},
    "dataType": "thehive:case_task",
    "tlp": 2
  }' | jq '{id, status}'
```

---

## 4. MISP API

**Base URL:** `https://192.168.56.10:8443`  
**Auth:** `Authorization: <api-key>` header (generate in MISP: Administration → List Auth Keys)  
**TLS:** Use `-k` in curl for self-signed lab cert  
**Documentation:** https://www.misp-project.org/openapi/

```bash
MP_KEY="your-misp-api-key"
MP="https://192.168.56.10:8443"
```

### 4.1 Events

```bash
# List recent events
curl -sk "$MP/events/index" \
  -H "Authorization: $MP_KEY" \
  -H "Accept: application/json" \
  | jq '.[] | {id, info, threat_level_id, published, attribute_count}'

# Get a specific event with all attributes
curl -sk "$MP/events/view/<event-id>" \
  -H "Authorization: $MP_KEY" \
  -H "Accept: application/json" | jq

# Search events by tag
curl -sk -X POST "$MP/events/restSearch" \
  -H "Authorization: $MP_KEY" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{"returnFormat":"json","tags":["tlp:red"],"limit":10}' \
  | jq '.response[].Event | {id, info, threat_level_id}'
```

### 4.2 Attributes (IOCs)

```bash
# Search for a specific IP across all events
curl -sk -X POST "$MP/attributes/restSearch" \
  -H "Authorization: $MP_KEY" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{"returnFormat":"json","value":"203.0.113.45","type":"ip-dst"}' \
  | jq '.response.Attribute[] | {id, event_id, type, value, to_ids, comment}'

# Get all IDS-flagged IP attributes
curl -sk -X POST "$MP/attributes/restSearch" \
  -H "Authorization: $MP_KEY" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{"returnFormat":"json","to_ids":true,"type":["ip-src","ip-dst"],"limit":500}' \
  | jq '.response.Attribute[] | {type, value, event_id}'

# Add a new attribute to an event
curl -sk -X POST "$MP/attributes/add/<event-id>" \
  -H "Authorization: $MP_KEY" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{"type":"ip-dst","value":"198.51.100.23","to_ids":true,"comment":"Cowrie honeypot attacker IP","category":"Network activity"}' \
  | jq '.Attribute | {id, type, value}'
```

### 4.3 Feeds

```bash
# List configured feeds
curl -sk "$MP/feeds/index" \
  -H "Authorization: $MP_KEY" \
  -H "Accept: application/json" | jq '.[] | {id, name, enabled, url}'

# Fetch/update a specific feed
curl -sk "$MP/feeds/fetchFromFeed/<feed-id>" \
  -H "Authorization: $MP_KEY" \
  -H "Accept: application/json" | jq

# Fetch all enabled feeds
curl -sk "$MP/feeds/fetchFromAllFeeds" \
  -H "Authorization: $MP_KEY" \
  -H "Accept: application/json" | jq
```

---

## 5. Elasticsearch / Wazuh Indexer API

**Base URL:** `https://192.168.56.10:9200`  
**Auth:** HTTP Basic — `admin:SecretPassword1!`  
**Index pattern:** `wazuh-alerts-*`

### 5.1 Cluster and Index Management

```bash
# Cluster health
curl -sk -u admin:SecretPassword1! \
  "https://192.168.56.10:9200/_cluster/health?pretty"

# List all wazuh indices
curl -sk -u admin:SecretPassword1! \
  "https://192.168.56.10:9200/_cat/indices/wazuh-alerts-*?v&s=index"

# Index storage size
curl -sk -u admin:SecretPassword1! \
  "https://192.168.56.10:9200/_cat/indices/wazuh-alerts-*?v&h=index,docs.count,store.size&s=store.size:desc"

# Delete old index (careful — permanent)
curl -sk -u admin:SecretPassword1! -X DELETE \
  "https://192.168.56.10:9200/wazuh-alerts-4.x-2024.01.01"
```

### 5.2 Alert Queries

```bash
# Count alerts by MITRE technique (last 7 days)
curl -sk -u admin:SecretPassword1! \
  "https://192.168.56.10:9200/wazuh-alerts-*/_search" \
  -H "Content-Type: application/json" -d '{
    "query": {"bool": {"must": [
      {"range": {"timestamp": {"gte": "now-7d"}}},
      {"exists": {"field": "rule.mitre.id"}}
    ]}},
    "aggs": {"mitre_techniques": {"terms": {"field": "rule.mitre.id", "size": 50}}},
    "size": 0
  }' | jq '.aggregations.mitre_techniques.buckets[] | {technique: .key, count: .doc_count}'

# Top agents by alert volume
curl -sk -u admin:SecretPassword1! \
  "https://192.168.56.10:9200/wazuh-alerts-*/_search" \
  -H "Content-Type: application/json" -d '{
    "query": {"range": {"timestamp": {"gte": "now-24h"}}},
    "aggs": {"by_agent": {"terms": {"field": "agent.name", "size": 20}}},
    "size": 0
  }' | jq '.aggregations.by_agent.buckets[] | {agent: .key, alerts: .doc_count}'

# Unique source IPs in last hour
curl -sk -u admin:SecretPassword1! \
  "https://192.168.56.10:9200/wazuh-alerts-*/_search" \
  -H "Content-Type: application/json" -d '{
    "query": {"range": {"timestamp": {"gte": "now-1h"}}},
    "aggs": {"src_ips": {"terms": {"field": "data.srcip", "size": 25}}},
    "size": 0
  }' | jq '.aggregations.src_ips.buckets[] | {ip: .key, count: .doc_count}'

# Full alert document by ID
curl -sk -u admin:SecretPassword1! \
  "https://192.168.56.10:9200/wazuh-alerts-*/_doc/<document-id>" | jq
```

---

## 6. AbuseIPDB API

**Base URL:** `https://api.abuseipdb.com/api/v2`  
**Auth:** `Key: <api-key>` header  
**Free tier:** 1,000 requests/day  
**Documentation:** https://docs.abuseipdb.com/

```bash
AB_KEY="your-abuseipdb-api-key"

# Check single IP reputation
curl -sf "https://api.abuseipdb.com/api/v2/check" \
  -H "Key: $AB_KEY" \
  -H "Accept: application/json" \
  --data-urlencode "ipAddress=203.0.113.45" \
  -G \
  | jq '.data | {ip: .ipAddress, score: .abuseConfidenceScore, country: .countryCode, isp: .isp, totalReports: .totalReports, lastReported: .lastReportedAt}'

# Check IP with verbose report history (last 90 days)
curl -sf "https://api.abuseipdb.com/api/v2/check" \
  -H "Key: $AB_KEY" \
  -H "Accept: application/json" \
  --data-urlencode "ipAddress=203.0.113.45" \
  --data-urlencode "maxAgeInDays=90" \
  --data-urlencode "verbose" \
  -G | jq '.data | {score: .abuseConfidenceScore, country: .countryCode, reports: (.reports | length)}'

# Report a malicious IP
curl -sf -X POST "https://api.abuseipdb.com/api/v2/report" \
  -H "Key: $AB_KEY" \
  -H "Accept: application/json" \
  --data-urlencode "ip=203.0.113.45" \
  --data-urlencode "categories=18,22" \
  --data-urlencode "comment=SSH brute force — 47 attempts in 60 seconds. Wazuh rule 100001." \
  | jq '.data | {ip: .ipAddress, abuseConfidenceScore}'
```

---

## 7. VirusTotal API v3

**Base URL:** `https://www.virustotal.com/api/v3`  
**Auth:** `x-apikey: <api-key>` header  
**Free tier:** 4 requests/minute, 500/day  
**Documentation:** https://developers.virustotal.com/reference/overview

```bash
VT_KEY="your-virustotal-api-key"

# Check IP address reputation
curl -sf "https://www.virustotal.com/api/v3/ip_addresses/203.0.113.45" \
  -H "x-apikey: $VT_KEY" \
  | jq '.data.attributes | {
      country: .country,
      reputation: .reputation,
      malicious: .last_analysis_stats.malicious,
      suspicious: .last_analysis_stats.suspicious,
      harmless: .last_analysis_stats.harmless,
      as_owner: .as_owner
    }'

# Check file hash (SHA256)
curl -sf "https://www.virustotal.com/api/v3/files/5f1d8aa80a4463a86e0c2df4e3fd9d15aabb12d52fd0cf91dc1ef0edc6a68c3a" \
  -H "x-apikey: $VT_KEY" \
  | jq '.data.attributes | {
      name: .meaningful_name,
      malicious: .last_analysis_stats.malicious,
      total: (.last_analysis_stats | add),
      first_seen: .first_submission_date,
      size: .size
    }'

# Check URL
curl -sf -X POST "https://www.virustotal.com/api/v3/urls" \
  -H "x-apikey: $VT_KEY" \
  --data-urlencode "url=http://malware.example.com/payload.sh" \
  | jq '.data.id'
# Then retrieve the analysis:
# curl -sf "https://www.virustotal.com/api/v3/analyses/<id>" -H "x-apikey: $VT_KEY" | jq
```

---

## 8. Quick Reference — All Service Endpoints

| Service | URL | Default Credentials | Notes |
|---|---|---|---|
| Wazuh Dashboard | `https://192.168.56.10:443` | admin / SecretPassword1! | HTTPS, self-signed cert |
| Wazuh API | `https://192.168.56.10:55000` | wazuh-wui / MyS3cr37P450r.*- | JWT auth |
| Wazuh Indexer | `https://192.168.56.10:9200` | admin / SecretPassword1! | Elasticsearch-compatible |
| Kibana | `http://192.168.56.10:5601` | (no auth in lab config) | Dashboard import |
| TheHive | `http://192.168.56.10:9000` | admin@thehive.local / secret | API key recommended |
| Cortex | `http://192.168.56.10:9001` | Set on first run | Analyzer platform |
| MISP | `https://192.168.56.10:8443` | admin@soc.lab / Admin1234! | Threat intelligence |
| React SOC UI | `http://localhost:3000` | n/a | Offline mock data mode |

---

## 9. Python SDK Examples

### 9.1 Wazuh — Python

```python
import os, requests, urllib3
urllib3.disable_warnings()

WAZUH_HOST = os.getenv("WAZUH_HOST", "https://192.168.56.10:55000")
WAZUH_USER = os.getenv("WAZUH_USER", "wazuh-wui")
WAZUH_PASS = os.getenv("WAZUH_PASS", "MyS3cr37P450r.*-")

def get_wazuh_token():
    r = requests.post(f"{WAZUH_HOST}/security/user/authenticate",
                      auth=(WAZUH_USER, WAZUH_PASS), verify=False, timeout=10)
    r.raise_for_status()
    return r.json()["data"]["token"]

def get_agents(token):
    r = requests.get(f"{WAZUH_HOST}/agents",
                     headers={"Authorization": f"Bearer {token}"},
                     verify=False, timeout=10)
    r.raise_for_status()
    return r.json()["data"]["affected_items"]

if __name__ == "__main__":
    token = get_wazuh_token()
    agents = get_agents(token)
    for a in agents:
        print(f"{a['id']} | {a['name']} | {a['ip']} | {a['status']}")
```

### 9.2 TheHive — Python

```python
import os, requests

THEHIVE_HOST = os.getenv("THEHIVE_HOST", "http://192.168.56.10:9000")
THEHIVE_KEY  = os.getenv("THEHIVE_API_KEY", "your-key")
HEADERS = {"Authorization": f"Bearer {THEHIVE_KEY}", "Content-Type": "application/json"}

def create_case(title, description, severity=3, tags=None):
    """severity: 1=Low, 2=Medium, 3=High, 4=Critical"""
    payload = {
        "title": title,
        "description": description,
        "severity": severity,
        "startDate": __import__("time").time_ns() // 1_000_000,
        "tags": tags or [],
        "tlp": 2,
        "pap": 2,
    }
    r = requests.post(f"{THEHIVE_HOST}/api/v1/case",
                      json=payload, headers=HEADERS, timeout=15)
    r.raise_for_status()
    return r.json()

def add_observable(case_id, data_type, value, ioc=True):
    payload = {"dataType": data_type, "data": value, "ioc": ioc, "tlp": 2}
    r = requests.post(f"{THEHIVE_HOST}/api/v1/case/{case_id}/observable",
                      json=payload, headers=HEADERS, timeout=10)
    r.raise_for_status()
    return r.json()

if __name__ == "__main__":
    case = create_case(
        title="[TEST] API reference example case",
        description="Created via Python SDK example in api_reference.md",
        severity=2,
        tags=["test", "api-reference"]
    )
    print(f"Case created: {case['_id']} — {case['title']}")
    obs = add_observable(case["_id"], "ip", "203.0.113.45", ioc=True)
    print(f"Observable added: {obs['_id']}")
```

---

## 10. Additional References

| Resource | URL |
|---|---|
| Wazuh Documentation | https://documentation.wazuh.com/current/ |
| Wazuh API Reference | https://documentation.wazuh.com/current/user-manual/api/reference.html |
| TheHive API Docs | https://docs.strangebee.com/thehive/api-docs/ |
| Cortex API Guide | https://github.com/TheHive-Project/Cortex/wiki/API-Guide |
| MISP OpenAPI | https://www.misp-project.org/openapi/ |
| MISP Python Library | https://github.com/MISP/PyMISP |
| AbuseIPDB API Docs | https://docs.abuseipdb.com/ |
| VirusTotal API v3 | https://developers.virustotal.com/reference/overview |
| MITRE ATT&CK API | https://attack.mitre.org/resources/working-with-attack/ |
| Sigma Rules GitHub | https://github.com/SigmaHQ/sigma |
| Atomic Red Team | https://github.com/redcanaryco/atomic-red-team |
| MITRE Caldera | https://caldera.readthedocs.io/ |
| Suricata EVE JSON | https://suricata.readthedocs.io/en/latest/output/eve/eve-json-format.html |
| Elastic Query DSL | https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl.html |