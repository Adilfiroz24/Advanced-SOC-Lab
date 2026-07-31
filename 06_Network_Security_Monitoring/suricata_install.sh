#!/bin/bash
# ============================================================
# Advanced SOC Lab — Suricata IDS/IPS Install Script
# Integrates with Wazuh via EVE JSON log forwarding
# Target: Ubuntu 22.04 LTS
# ============================================================

set -euo pipefail
GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'
log()  { echo -e "${GREEN}[$(date +%H:%M:%S)] ✓ $1${NC}"; }
warn() { echo -e "${YELLOW}[$(date +%H:%M:%S)] ⚠ $1${NC}"; }

IFACE=$(ip route | grep default | awk '{print $5}' | head -1)
[[ -z "$IFACE" ]] && IFACE="eth0"
log "Detected network interface: $IFACE"

# ── Install Suricata ───────────────────────────────────────
log "Adding Suricata PPA..."
add-apt-repository -y ppa:oisf/suricata-stable
apt-get update -y
apt-get install -y suricata suricata-update jq

# ── Update rules ──────────────────────────────────────────
log "Updating Suricata rule sources..."
suricata-update update-sources
suricata-update enable-source et/open          # Emerging Threats Open
suricata-update enable-source ptresearch/attackdetection
suricata-update
log "Rules updated successfully"

# ── Configure Suricata ────────────────────────────────────
log "Configuring Suricata..."
SURICATA_CONF="/etc/suricata/suricata.yaml"

# Backup original
cp "$SURICATA_CONF" "${SURICATA_CONF}.bak"

cat > "$SURICATA_CONF" <<SURICONFIG
%YAML 1.1
---

vars:
  address-groups:
    HOME_NET: "[192.168.56.0/24,10.0.0.0/8]"
    EXTERNAL_NET: "!\$HOME_NET"
    HTTP_SERVERS: "\$HOME_NET"
    SMTP_SERVERS: "\$HOME_NET"
    SQL_SERVERS: "\$HOME_NET"
    DNS_SERVERS: "\$HOME_NET"
    TELNET_SERVERS: "\$HOME_NET"
    AIM_SERVERS: "\$EXTERNAL_NET"
    DC_SERVERS: "\$HOME_NET"
    DNP3_SERVER: "\$HOME_NET"
    DNP3_CLIENT: "\$HOME_NET"
    MODBUS_CLIENT: "\$HOME_NET"
    MODBUS_SERVER: "\$HOME_NET"

  port-groups:
    HTTP_PORTS: "80,8080,8000,8443"
    SHELLCODE_PORTS: "!80"
    ORACLE_PORTS: 1521
    SSH_PORTS: 22
    DNP3_PORTS: 20000
    MODBUS_PORTS: 502
    FILE_DATA_PORTS: "[\$HTTP_PORTS,110,143]"

default-log-dir: /var/log/suricata/

stats:
  enabled: yes
  interval: 8

outputs:
  - fast:
      enabled: no
      filename: fast.log

  - eve-log:
      enabled: yes
      filetype: regular
      filename: eve.json
      pcap-file: false
      community-id: true
      community-id-seed: 0
      types:
        - alert:
            payload: yes
            payload-buffer-size: 4kb
            payload-printable: yes
            packet: yes
            metadata: yes
            http: yes
            tls: yes
            ssh: yes
            smtp: yes
            dnp3: yes
            app-layer: yes
            flow: yes
        - http:
            extended: yes
        - dns:
            version: 2
        - tls:
            extended: yes
        - files:
            force-magic: no
        - smtp:
        - ftp
        - rdp
        - nfs
        - smb
        - ssh
        - flow
        - netflow

af-packet:
  - interface: ${IFACE}
    cluster-id: 99
    cluster-type: cluster_flow
    defrag: yes
    use-mmap: yes
    tpacket-v3: yes

pcap:
  - interface: ${IFACE}

app-layer:
  protocols:
    rfb:
      enabled: yes
      detection-ports:
        dp: 5900, 5901, 5902, 5903, 5904, 5905, 5906, 5907, 5908, 5909
    krb5:
      enabled: yes
    snmp:
      enabled: yes
    ikev2:
      enabled: yes
    tls:
      enabled: yes
      detection-ports:
        dp: 443
    dcerpc:
      enabled: yes
    ftp:
      enabled: yes
    rdp:
      enabled: yes
    ssh:
      enabled: yes
    smtp:
      enabled: yes
    imap:
      enabled: detection-only
    http:
      enabled: yes
      libhtp:
        default-config:
          personality: IDS
          request-body-limit: 100kb
          response-body-limit: 100kb
          request-body-minimal-inspect-size: 32kb
          request-body-inspect-window: 4kb
          response-body-minimal-inspect-size: 40kb
          response-body-inspect-window: 16kb
    dns:
      enabled: yes

logging:
  default-log-level: notice
  outputs:
  - console:
      enabled: yes
  - file:
      enabled: yes
      level: info
      filename: /var/log/suricata/suricata.log
  - syslog:
      enabled: no
      facility: local5
      format: "[%i] <%d> -- "

rule-files:
  - /var/lib/suricata/rules/suricata.rules
  - /etc/suricata/rules/local.rules

classification-file: /etc/suricata/classification.config
reference-config-file: /etc/suricata/reference.config

SURICONFIG

# ── Create local custom rules ─────────────────────────────
mkdir -p /etc/suricata/rules
cat > /etc/suricata/rules/local.rules <<'RULES'
# SOC Lab Custom Rules

# Detect Nmap SYN scan
alert tcp any any -> $HOME_NET any (msg:"SOC-LAB Nmap SYN Scan Detected"; flags:S; threshold:type threshold, track by_src, count 100, seconds 10; classtype:network-scan; sid:9000001; rev:1;)

# Detect Hydra brute force SSH
alert tcp any any -> $HOME_NET 22 (msg:"SOC-LAB Hydra SSH Brute Force"; threshold:type threshold, track by_src, count 10, seconds 5; classtype:attempted-admin; sid:9000002; rev:1;)

# Detect Metasploit Meterpreter beacon
alert tcp $HOME_NET any -> any 4444 (msg:"SOC-LAB Meterpreter Reverse Shell Port 4444"; classtype:trojan-activity; sid:9000003; rev:1;)

# Detect RDP brute force
alert tcp any any -> $HOME_NET 3389 (msg:"SOC-LAB RDP Brute Force Attempt"; threshold:type threshold, track by_src, count 5, seconds 10; classtype:attempted-admin; sid:9000004; rev:1;)

# Detect DNS tunneling (high query frequency)
alert dns any any -> any any (msg:"SOC-LAB Potential DNS Tunneling"; threshold:type threshold, track by_src, count 50, seconds 5; classtype:policy-violation; sid:9000005; rev:1;)

# Detect WannaCry / EternalBlue SMB exploit
alert tcp any any -> $HOME_NET 445 (msg:"SOC-LAB EternalBlue SMB Exploit Attempt"; content:"|00 00 00 00 00 01 00 00 00 00|"; classtype:attempted-admin; sid:9000006; rev:1;)

# Detect ICMP flood
alert icmp any any -> $HOME_NET any (msg:"SOC-LAB ICMP Flood"; threshold:type threshold, track by_src, count 100, seconds 10; classtype:bad-unknown; sid:9000007; rev:1;)
RULES

# ── Wazuh integration for Suricata logs ───────────────────
log "Configuring Wazuh to ingest Suricata EVE logs..."
WAZUH_LOCAL_CONFIG="/var/ossec/etc/ossec.conf"
if [[ -f "$WAZUH_LOCAL_CONFIG" ]]; then
  # Check if suricata config already exists
  if ! grep -q "suricata" "$WAZUH_LOCAL_CONFIG"; then
    cat >> "$WAZUH_LOCAL_CONFIG" <<'WAZUH_CONFIG'

  <!-- Suricata EVE JSON log ingestion -->
  <localfile>
    <log_format>json</log_format>
    <location>/var/log/suricata/eve.json</location>
  </localfile>
WAZUH_CONFIG
    log "Wazuh configured to ingest Suricata logs"
  fi
fi

# ── Enable and start Suricata ─────────────────────────────
log "Enabling Suricata service..."
systemctl enable suricata
systemctl restart suricata

# ── Test Suricata ─────────────────────────────────────────
sleep 3
if systemctl is-active --quiet suricata; then
  log "Suricata is running successfully!"
  suricata --build-info | grep "Version"
else
  warn "Suricata may not have started. Check: journalctl -u suricata"
fi

# ── Summary ───────────────────────────────────────────────
echo ""
echo "═══════════════════════════════════════════════════"
echo "  ✅ SURICATA IDS/IPS DEPLOYED"
echo "═══════════════════════════════════════════════════"
echo "  📁 EVE Log:   /var/log/suricata/eve.json"
echo "  📋 Rules:     /var/lib/suricata/rules/suricata.rules"
echo "  🔧 Config:    /etc/suricata/suricata.yaml"
echo "  🌐 Interface: $IFACE"
echo ""
echo "  Test with: curl http://testmynids.us/uid/index.html"
echo "  Monitor:   tail -f /var/log/suricata/fast.log"
echo "═══════════════════════════════════════════════════"