#!/bin/bash
# ============================================================
# Advanced SOC Lab — Wazuh All-in-One Install Script
# Deploys: Wazuh Manager + Elasticsearch + Kibana + Dashboard
# Target: Ubuntu 22.04 LTS
# Version: Wazuh 4.7.x
# ============================================================

set -euo pipefail

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'
log()  { echo -e "${GREEN}[$(date +%H:%M:%S)] ✓ $1${NC}"; }
warn() { echo -e "${YELLOW}[$(date +%H:%M:%S)] ⚠ $1${NC}"; }
err()  { echo -e "${RED}[$(date +%H:%M:%S)] ✗ $1${NC}"; exit 1; }

# ── Prerequisites ──────────────────────────────────────────
[[ $EUID -ne 0 ]] && err "Run as root: sudo bash wazuh_install.sh"
RAM_GB=$(free -g | awk '/^Mem:/{print $2}')
[[ $RAM_GB -lt 6 ]] && warn "Low RAM detected (${RAM_GB}GB). Recommended: 8GB+"

log "Starting Wazuh deployment..."

# ── System dependencies ────────────────────────────────────
apt-get update -y
apt-get install -y curl wget gnupg apt-transport-https lsb-release \
  software-properties-common unzip jq net-tools

# ── Download Wazuh install script ──────────────────────────
log "Downloading Wazuh install assistant..."
curl -sO https://packages.wazuh.com/4.7/wazuh-install.sh
curl -sO https://packages.wazuh.com/4.7/config.yml

# ── Configure Wazuh nodes ──────────────────────────────────
SIEM_IP=$(hostname -I | awk '{print $1}')
cat > config.yml <<EOF
nodes:
  indexer:
    - name: node-1
      ip: "${SIEM_IP}"
  server:
    - name: wazuh-1
      ip: "${SIEM_IP}"
  dashboard:
    - name: dashboard
      ip: "${SIEM_IP}"
EOF

log "Wazuh config written for IP: ${SIEM_IP}"

# ── Run installation ───────────────────────────────────────
log "Installing Wazuh (this takes 5-10 minutes)..."
bash wazuh-install.sh -a 2>&1 | tee /var/log/wazuh-install.log
log "Wazuh installation complete"

# ── Enable and start services ──────────────────────────────
systemctl daemon-reload
for svc in wazuh-manager wazuh-indexer wazuh-dashboard; do
  systemctl enable "$svc" && systemctl start "$svc"
  log "Service started: $svc"
done

# ── Wait for Elasticsearch to be ready ────────────────────
log "Waiting for Wazuh Indexer to be healthy..."
for i in $(seq 1 30); do
  if curl -sk "https://${SIEM_IP}:9200" -u admin:admin --insecure | grep -q "cluster_name"; then
    log "Indexer is up!"; break
  fi
  sleep 5
  echo -n "."
done

# ── Install custom detection rules ────────────────────────
log "Installing custom detection rules..."
RULES_DIR="/var/ossec/etc/rules"
cp ../09_Detection_Rules/local_rules.xml "${RULES_DIR}/local_rules.xml" 2>/dev/null || warn "Copy local_rules.xml manually"

# ── Configure log forwarding ──────────────────────────────
cat >> /var/ossec/etc/ossec.conf <<'OSSEC'
  <!-- Syslog UDP input for network devices -->
  <remote>
    <connection>syslog</connection>
    <port>514</port>
    <protocol>udp</protocol>
    <allowed-ips>192.168.56.0/24</allowed-ips>
  </remote>
OSSEC

systemctl restart wazuh-manager

# ── Extract credentials ────────────────────────────────────
log "Extracting API credentials..."
if [[ -f wazuh-passwords.txt ]]; then
  cat wazuh-passwords.txt | grep -E "(admin|wazuh)" | tee /root/soc-credentials.txt
fi

# ── Configure API user ────────────────────────────────────
log "Setting up Wazuh API..."
curl -sk -u "wazuh-wui:$(grep wazuh-wui /root/soc-credentials.txt | awk '{print $NF}')" \
  -X GET "https://${SIEM_IP}:55000/" --insecure | jq '.title' || warn "API check manual"

# ── Open firewall ports ────────────────────────────────────
if command -v ufw &>/dev/null; then
  ufw allow 1514/tcp   # Wazuh agent
  ufw allow 1515/tcp   # Wazuh enrollment
  ufw allow 55000/tcp  # Wazuh API
  ufw allow 9200/tcp   # Elasticsearch
  ufw allow 5601/tcp   # Kibana
  ufw allow 9000/tcp   # TheHive
  ufw allow 514/udp    # Syslog
  log "Firewall rules applied"
fi

# ── Performance tuning ────────────────────────────────────
log "Applying performance tuning..."
echo "vm.max_map_count=262144" >> /etc/sysctl.conf
sysctl -p

# ── Summary ───────────────────────────────────────────────
echo ""
echo "═══════════════════════════════════════════════════"
echo "  ✅ WAZUH SOC PLATFORM DEPLOYED SUCCESSFULLY"
echo "═══════════════════════════════════════════════════"
echo "  🌐 Wazuh Dashboard:  https://${SIEM_IP}:443"
echo "  🔍 Kibana:           https://${SIEM_IP}:5601"
echo "  🔌 Wazuh API:        https://${SIEM_IP}:55000"
echo "  📁 Credentials:      /root/soc-credentials.txt"
echo "  📋 Install log:      /var/log/wazuh-install.log"
echo "═══════════════════════════════════════════════════"
echo ""
echo "  NEXT STEPS:"
echo "  1. Deploy Wazuh agents on endpoints"
echo "  2. Configure Suricata: bash ../06_Network_Security_Monitoring/suricata_install.sh"
echo "  3. Launch TheHive:     docker-compose -f ../10_SOAR_Case_Management/docker-compose-thehive.yml up -d"
echo "═══════════════════════════════════════════════════"