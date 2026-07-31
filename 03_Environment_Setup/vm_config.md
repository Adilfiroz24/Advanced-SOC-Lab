# VM Configuration — Advanced SOC Lab

This document details the exact OS images, network settings, and static IP
assignments used by all lab VMs. Matches the `vagrantfile` in this directory.

## Network Topology

All VMs share a **VirtualBox host-only network**: `192.168.56.0/24`

| VM | Hostname | Static IP | OS |
|---|---|---|---|
| SIEM Server | `siem-server` | `192.168.56.10` | Ubuntu 22.04 LTS (Jammy) |
| Kali Attacker | `kali-attacker` | `192.168.56.20` | Kali Linux Rolling |
| Windows Victim | `win10-victim` | `192.168.56.30` | Windows 10 22H2 |
| Web Server *(optional)* | `ubuntu-webserver` | `192.168.56.40` | Ubuntu 22.04 LTS |
| pfSense Firewall *(optional)* | `pfsense-fw` | `192.168.56.1` (LAN) | pfSense CE 2.7.x |

> See [`02_Architecture_Design/network_topology.drawio`](../02_Architecture_Design/network_topology.drawio)
> for the full visual diagram.

---

## VM 1 — SIEM Server (`siem-server`)

| Setting | Value |
|---|---|
| Base box | `ubuntu/jammy64` |
| vCPU | 4 |
| RAM | 8192 MB |
| Disk | 80 GB (dynamically allocated) |
| Network adapter 1 | NAT (internet access) |
| Network adapter 2 | Host-only, static `192.168.56.10` |
| Forwarded ports | 443→443 (Wazuh Dashboard), 5601→5601 (Kibana), 9000→9000 (TheHive), 9001→9001 (Cortex), 8443→8443 (MISP), 55000→55000 (Wazuh API) |

**Post-boot provisioning:**
```bash
sudo apt-get update -y
sudo apt-get install -y curl wget gnupg apt-transport-https docker.io docker-compose-plugin
bash 04_SIEM_Deployment/wazuh_install.sh
bash 06_Network_Security_Monitoring/suricata_install.sh
bash 07_Honeypot_Deployment/cowrie_docker_run.sh
```

---

## VM 2 — Kali Attacker (`kali-attacker`)

| Setting | Value |
|---|---|
| Base box | `kalilinux/rolling` |
| vCPU | 2 |
| RAM | 4096 MB |
| Disk | 40 GB |
| Network adapter 1 | NAT (internet access for tool updates) |
| Network adapter 2 | Host-only, static `192.168.56.20` |

**Pre-installed tools:** `nmap`, `hydra`, `metasploit-framework`, `seclists`,
Atomic Red Team. See [`15_Attack_Simulation/kali_attack_commands.md`](../15_Attack_Simulation/kali_attack_commands.md).

**Static IP config** (`/etc/network/interfaces` or netplan):
```yaml
network:
  version: 2
  ethernets:
    eth1:
      addresses: [192.168.56.20/24]
```

---

## VM 3 — Windows 10 Victim (`win10-victim`)

| Setting | Value |
|---|---|
| Base box | `gusztavvargadr/windows-10` |
| vCPU | 2 |
| RAM | 4096 MB |
| Disk | 60 GB |
| Network adapter 1 | NAT |
| Network adapter 2 | Host-only, static `192.168.56.30` |

**Static IP** (PowerShell, run as Administrator):
```powershell
New-NetIPAddress -InterfaceAlias "Ethernet 2" -IPAddress 192.168.56.30 `
  -PrefixLength 24 -DefaultGateway 192.168.56.1
Set-DnsClientServerAddress -InterfaceAlias "Ethernet 2" -ServerAddresses 8.8.8.8
```

**Agent installation:** Install Sysmon with
[`05_Log_Collection/sysmon_config.xml`](../05_Log_Collection/sysmon_config.xml),
then enroll the Wazuh agent pointing at `192.168.56.10`. See
[`05_Log_Collection/filebeat_setup.md`](../05_Log_Collection/filebeat_setup.md)
and [`05_Log_Collection/log_forwarding_test.md`](../05_Log_Collection/log_forwarding_test.md)
for full setup and verification steps.

---

## VM 4 — Ubuntu Web Server *(optional, for SQLi/Log4Shell testing)*

| Setting | Value |
|---|---|
| Base box | `ubuntu/jammy64` |
| vCPU | 2 |
| RAM | 2048 MB |
| Disk | 30 GB |
| Network adapter 2 | Host-only, static `192.168.56.40` |

Used as the target for rules `100019` (Log4Shell) and `100020` (SQL injection)
in [`09_Detection_Rules/local_rules.xml`](../09_Detection_Rules/local_rules.xml).

---

## DNS & Time Sync

All VMs should:
1. Use `8.8.8.8` / `1.1.1.1` as DNS resolvers (or your host's DNS forwarder)
2. Sync time via NTP — **critical** for accurate alert correlation in Wazuh/Elasticsearch.
   Time drift between agents and the SIEM causes incorrect MTTD calculations.

```bash
# Ubuntu/Kali
sudo timedatectl set-ntp true
timedatectl status
```

```powershell
# Windows
w32tm /resync
w32tm /query /status
```

---

## Snapshot Strategy

Take a clean snapshot of each VM immediately after initial provisioning,
**before** running any attack simulations:

```bash
vagrant snapshot save siem 04siem-clean
vagrant snapshot save attacker 04siem-clean
vagrant snapshot save victim 04siem-clean
```

This allows fast reset (`vagrant snapshot restore <name> <snapshot>`) between
purple-team exercises (see [`12_Purple_Team_Automation/`](../12_Purple_Team_Automation/)).