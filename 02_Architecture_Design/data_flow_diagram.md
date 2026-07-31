# Data Flow Diagram — Advanced SOC Lab

## End-to-End Log & Alert Pipeline

```
┌─────────────────────────────────────────────────────────────────┐
│                        DATA SOURCES                             │
│  Windows 10     │  Ubuntu Server  │  Network Traffic  │ Cowrie  │
│  (Sysmon +      │  (Filebeat +    │  (Suricata IDS/   │ Honey-  │
│   Winlogbeat)   │   Wazuh Agent)  │   Zeek NSM)       │  pot)   │
└────────┬────────┴────────┬────────┴────────┬──────────┴────┬────┘
         │                 │                 │               │
         └────────────────►│◄────────────────┘               │
                           │                                 │
                    ┌──────▼──────┐                          │
                    │   WAZUH     │◄─────────────────────────┘
                    │  MANAGER    │
                    │ (Port 1514) │
                    └──────┬──────┘
                           │  Rules Engine
                           │  MITRE ATT&CK Mapping
                           │  Threat Decoders
                    ┌──────▼──────┐
                    │ ELASTICSEARCH│
                    │  (Port 9200) │
                    │  Index:      │
                    │  wazuh-alerts│
                    └──────┬──────┘
                    ┌──────┴──────────────────┐
                    │                         │
             ┌──────▼──────┐        ┌─────────▼──────┐
             │   KIBANA    │        │  WAZUH API     │
             │ Dashboards  │        │  (Port 55000)  │
             │ (Port 5601) │        └────────┬───────┘
             └─────────────┘                 │
                                    ┌────────▼───────┐
                                    │ auto_investigate│
                                    │    .py          │
                                    │ (enrichment)    │
                                    └────────┬───────┘
                                    ┌────────▼───────┐
                                    │  AbuseIPDB /   │
                                    │  VirusTotal /  │
                                    │  MISP TI       │
                                    └────────┬───────┘
                                    ┌────────▼───────┐
                                    │   THEHIVE      │
                                    │  Case Manager  │
                                    │  (Port 9000)   │
                                    └────────┬───────┘
                                    ┌────────▼───────┐
                                    │    CORTEX      │
                                    │  Responders    │
                                    │  (Port 9001)   │
                                    └────────┬───────┘
                               ┌─────────────┴──────────┐
                               │                         │
                      ┌────────▼───────┐       ┌─────────▼──────┐
                      │  block_ip.py   │       │ Analyst Review  │
                      │ (pfSense API)  │       │  Dashboard UI   │
                      └────────────────┘       └────────────────┘
```

## Alert Severity Routing

| Wazuh Level | Action |
|-------------|--------|
| 1–7 | Log to Elasticsearch only |
| 8–11 | Create TheHive case, notify Slack |
| 12–14 | Auto-block IP, page on-call, create P1 case |
| 15 | CRITICAL: All of above + compliance notification |

## Enrichment Pipeline

```
Raw Alert → IP Reputation (AbuseIPDB) → Domain Intel (VirusTotal)
          → MISP IOC Match → GeoIP Lookup → Asset Criticality
          → Risk Score Calculation → TheHive Case Creation
```

## Retention Policy

| Data Type | Hot Storage | Warm Storage | Cold Archive |
|-----------|-------------|--------------|--------------|
| Security Alerts | 30 days | 90 days | 365 days |
| Raw Logs | 7 days | 30 days | 180 days |
| NetFlow | 14 days | 60 days | 365 days |
| Cases | Active + 1yr | — | 7 years |