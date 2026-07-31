# Hardware Specifications — Advanced SOC Lab

## Minimum Host Requirements

| Component | Minimum | Recommended | Notes |
|---|---|---|---|
| **CPU** | 4 cores / 8 threads | 8 cores / 16 threads | Virtualization extensions (VT-x/AMD-V) required |
| **RAM** | 16 GB | 32 GB | Elasticsearch/OpenSearch alone wants 2-4 GB heap |
| **Disk** | 200 GB SSD | 500 GB NVMe SSD | SIEM indices grow fast; SSD avoids I/O bottlenecks |
| **Network** | 1 NIC (NAT) | 1 NIC + Host-Only adapter | Host-only isolates lab traffic from your LAN |
| **OS** | Windows 10/11, macOS, Linux | Linux (Ubuntu 22.04) host | Linux hosts get best Docker/KVM performance |

## Per-VM Resource Allocation

| VM | vCPU | RAM | Disk | Purpose |
|---|---|---|---|---|
| **siem-server** (Ubuntu 22.04) | 4 | 8 GB | 80 GB | Wazuh, TheHive, Cortex, MISP, Suricata |
| **kali-attacker** (Kali Rolling) | 2 | 4 GB | 40 GB | Nmap, Hydra, Metasploit, Atomic Red Team |
| **win10-victim** (Windows 10) | 2 | 4 GB | 60 GB | Sysmon, Winlogbeat, Wazuh Agent |
| **TOTAL** | 8 | 16 GB | 180 GB | Matches minimum host spec above |

> If running the Docker Compose stack (`docker-compose.yml`) directly on the host
> instead of inside the `siem-server` VM, allocate the same 8 vCPU / 8 GB RAM /
> 80 GB disk to Docker Desktop / the Linux host directly.

## Component-Level Resource Notes

| Service | RAM (JVM heap or equivalent) | Disk growth rate |
|---|---|---|
| Wazuh Indexer (OpenSearch) | 1 GB heap (`-Xms1g -Xmx1g`) | ~1-3 GB/day at moderate alert volume |
| Wazuh Manager | ~512 MB | Logs rotate; minimal |
| Elasticsearch (TheHive index) | 1 GB heap | ~500 MB/day |
| Cassandra (TheHive DB) | 1 GB heap | Grows with case count; low volume |
| TheHive | 512 MB - 1 GB | Attachments via MinIO |
| Cortex | 512 MB - 1 GB | Analyzer job history |
| MISP + MySQL | ~1 GB combined | Depends on feed subscription size |
| Suricata | Minimal RAM, CPU-bound | EVE JSON logs: several GB/day on busy networks |

## Network Requirements

- **Host-only network**: `192.168.56.0/24` (VirtualBox default) — isolates attack
  traffic from your real network
- **Internet access**: required for package installation, MISP feed sync,
  AbuseIPDB/VirusTotal API calls, and Atomic Red Team technique downloads
- **Open ports on host** (if running Docker stack directly): see
  [`README.md` → Services & Ports](../README.md#services--ports)

## Recommended Hypervisors

| Hypervisor | Platform | Notes |
|---|---|---|
| VirtualBox 7.x | Windows/macOS/Linux | Free, used in `vagrantfile` examples |
| VMware Workstation/Fusion | Windows/macOS | Better performance, paid |
| KVM/libvirt | Linux | Best performance on Linux hosts |
| Docker Desktop | Windows/macOS/Linux | For container-only deployment (no Windows victim VM) |

## Storage Growth Planning

At a sustained rate of ~50 alerts/hour with default retention:

| Period | Estimated disk usage |
|---|---|
| 1 day | 2-5 GB |
| 1 week | 15-35 GB |
| 1 month | 60-150 GB |

Configure index lifecycle management (ILM) in Wazuh Indexer or run
[`17_Backup_Disaster_Recovery/backup_script.sh`](../17_Backup_Disaster_Recovery/backup_script.sh)
on a schedule to archive and prune old data.