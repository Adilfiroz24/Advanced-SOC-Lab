# SOC Lab Tools Reference

## Core Platform

| Tool | Version | Role | Port |
|------|---------|------|------|
| **Wazuh Manager** | 4.7.x | SIEM / XDR | 1514, 55000 |
| **Elasticsearch** | 8.x | Data store | 9200, 9300 |
| **Kibana** | 8.x | Visualization | 5601 |
| **Filebeat** | 8.x | Log shipper | — |
| **Winlogbeat** | 8.x | Windows log shipper | — |

## Endpoint Monitoring

| Tool | Platform | Purpose |
|------|----------|---------|
| **Sysmon** | Windows | Process, network, file telemetry |
| **Wazuh Agent** | Linux/Windows | FIM, rootkit detection, SCA |
| **Auditd** | Linux | Kernel-level audit logging |

## Network Security

| Tool | Version | Role |
|------|---------|------|
| **Suricata** | 7.x | IDS/IPS, network signatures |
| **Zeek** | 6.x | Protocol analysis, behavioral detection |
| **pfSense** | 2.7.x | Firewall, traffic filtering |

## SOAR & Case Management

| Tool | Version | Role | Port |
|------|---------|------|------|
| **TheHive** | 5.x | Case management | 9000 |
| **Cortex** | 3.x | Automated response | 9001 |
| **MISP** | 2.4.x | Threat intelligence | 443 |

## Deception & Honeypots

| Tool | Purpose |
|------|---------|
| **Cowrie** | SSH/Telnet honeypot |
| **OpenCanary** | Multi-protocol honeypot |

## Vulnerability Management

| Tool | Purpose | Schedule |
|------|---------|---------|
| **OpenVAS / Greenbone** | Network vulnerability scanner | Weekly |
| **Trivy** | Container image scanning | On build |

## Attack Simulation (Purple Team)

| Tool | Purpose |
|------|---------|
| **MITRE Caldera** | Automated adversary emulation |
| **Atomic Red Team** | MITRE technique tests |
| **Metasploit** | Exploitation framework |
| **Hydra** | Credential brute-forcing |
| **Nmap** | Network reconnaissance |

## Threat Intelligence

| Source | Type | Update Frequency |
|--------|------|-----------------|
| **MISP** | IOC sharing platform | Real-time feeds |
| **AbuseIPDB** | IP reputation | Real-time API |
| **VirusTotal** | File/URL/IP | Real-time API |
| **AlienVault OTX** | Threat feeds | Hourly |
| **Shodan** | Internet exposure | On-demand |

## Compliance Frameworks Covered

- PCI-DSS v4.0
- HIPAA Security Rule
- NIST CSF 2.0
- ISO 27001:2022
- SOC 2 Type II