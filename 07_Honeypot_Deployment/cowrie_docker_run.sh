#!/bin/bash
# ============================================================
# Advanced SOC Lab — cowrie_docker_run.sh
# Deploy Cowrie SSH/Telnet honeypot as a Docker container
# Logs are forwarded to Wazuh via JSON log file monitoring
# ============================================================

set -euo pipefail

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'
log()  { echo -e "${GREEN}[$(date +%H:%M:%S)] ✓ $1${NC}"; }
warn() { echo -e "${YELLOW}[$(date +%H:%M:%S)] ⚠ $1${NC}"; }

# ── Config ─────────────────────────────────────────────────
COWRIE_CONTAINER="soc-cowrie-honeypot"
COWRIE_SSH_PORT="${COWRIE_SSH_PORT:-2222}"    # Attacker-facing SSH port
COWRIE_TEL_PORT="${COWRIE_TEL_PORT:-2323}"    # Attacker-facing Telnet port
HOST_SSH_PORT="${HOST_SSH_PORT:-22}"          # Redirect real SSH to this
LOG_DIR="${LOG_DIR:-/var/log/cowrie}"
WAZUH_AGENT_CONF="/var/ossec/etc/ossec.conf"

log "Starting Cowrie Honeypot deployment..."

# ── Create log directory ───────────────────────────────────
mkdir -p "$LOG_DIR"
mkdir -p /opt/cowrie/{etc,honeyfs,share}
log "Log directory created: $LOG_DIR"

# ── Redirect real SSH if needed ────────────────────────────
# Move real SSH to alternate port so honeypot can use 22
if [[ "${HOST_SSH_PORT}" != "22" ]]; then
  warn "Ensure your real SSH daemon is on port ${HOST_SSH_PORT} before running this"
  warn "Edit /etc/ssh/sshd_config: Port ${HOST_SSH_PORT}"
  warn "Then: systemctl restart sshd"
fi

# ── Generate Cowrie user database ─────────────────────────
log "Creating Cowrie user database..."
cat > /opt/cowrie/etc/userdb.txt <<'USERDB'
# Cowrie User Database — credentials that will appear "accepted"
# Format: username:password (or password hash)
# Attackers who guess these get a fake shell session

root:root
root:123456
root:password
root:toor
root:admin
root:1234
admin:admin
admin:password
admin:123456
admin:12345
user:user
test:test
guest:guest
ubuntu:ubuntu
pi:raspberry
postgres:postgres
oracle:oracle
ftp:ftp
mysql:mysql
USERDB

# ── Cowrie custom config ───────────────────────────────────
log "Writing Cowrie configuration..."
cat > /opt/cowrie/etc/cowrie.cfg <<'COWRIECFG'
[honeypot]
hostname = server01
log_path = /home/cowrie/var/log/cowrie
download_path = /home/cowrie/var/lib/cowrie/downloads
share_path = /home/cowrie/share/cowrie
contents_path = /home/cowrie/honeyfs
state_path = /home/cowrie/var/lib/cowrie
etc_path = /home/cowrie/etc
interact_enabled = false
backend = shell

[output_jsonlog]
enabled = true
logfile = ${honeypot:log_path}/cowrie.json

[output_textlog]
enabled = true
logfile = ${honeypot:log_path}/cowrie.log

[ssh]
enabled = true
listen_endpoints = tcp:2222:interface=0.0.0.0
version = SSH-2.0-OpenSSH_8.2p1 Ubuntu-4ubuntu0.5

[telnet]
enabled = true
listen_endpoints = tcp:2323:interface=0.0.0.0
COWRIECFG

# ── Pull and start Cowrie container ───────────────────────
log "Pulling Cowrie Docker image..."
docker pull cowrie/cowrie:latest

log "Starting Cowrie container..."
docker run -d \
  --name "$COWRIE_CONTAINER" \
  --restart unless-stopped \
  --network host \
  -p "${COWRIE_SSH_PORT}:2222" \
  -p "${COWRIE_TEL_PORT}:2323" \
  -v "$LOG_DIR:/home/cowrie/var/log/cowrie" \
  -v /opt/cowrie/etc:/home/cowrie/etc:ro \
  -v /opt/cowrie/honeyfs:/home/cowrie/honeyfs:ro \
  -e COWRIE_HOSTNAME="prod-server-01" \
  cowrie/cowrie:latest

sleep 3

# ── Verify running ─────────────────────────────────────────
if docker ps | grep -q "$COWRIE_CONTAINER"; then
  log "Cowrie is running!"
else
  warn "Cowrie may not have started. Check: docker logs $COWRIE_CONTAINER"
fi

# ── Configure Wazuh to monitor Cowrie logs ────────────────
log "Configuring Wazuh to ingest Cowrie JSON logs..."

COWRIE_WAZUH_CONFIG='
  <!-- Cowrie Honeypot Log Ingestion -->
  <localfile>
    <log_format>json</log_format>
    <location>/var/log/cowrie/cowrie.json</location>
    <label key="@source">cowrie-honeypot</label>
  </localfile>'

if [[ -f "$WAZUH_AGENT_CONF" ]]; then
  if ! grep -q "cowrie.json" "$WAZUH_AGENT_CONF"; then
    # Add before closing </ossec_config>
    sed -i "s|</ossec_config>|${COWRIE_WAZUH_CONFIG}\n</ossec_config>|" "$WAZUH_AGENT_CONF"
    systemctl restart wazuh-manager 2>/dev/null || warn "Restart Wazuh manually"
    log "Wazuh configured to ingest Cowrie logs"
  else
    log "Cowrie already in Wazuh config"
  fi
else
  warn "Wazuh config not found at ${WAZUH_AGENT_CONF}. Add Cowrie config manually."
  echo ""
  echo "Add to /var/ossec/etc/ossec.conf:"
  echo "${COWRIE_WAZUH_CONFIG}"
fi

# ── Optional: Redirect port 22 to honeypot ─────────────────
log "Setting up iptables redirect (port 22 → 2222)..."
iptables -t nat -A PREROUTING -p tcp --dport 22 -j REDIRECT --to-port 2222 2>/dev/null || \
  warn "iptables redirect failed. Set up manually if needed."

# ── Summary ───────────────────────────────────────────────
echo ""
echo "════════════════════════════════════════════════════════"
echo "  🍯 COWRIE HONEYPOT DEPLOYED"
echo "════════════════════════════════════════════════════════"
echo "  Container:  ${COWRIE_CONTAINER}"
echo "  SSH Port:   ${COWRIE_SSH_PORT} (honeypot)"
echo "  Telnet:     ${COWRIE_TEL_PORT} (honeypot)"
echo "  Logs:       ${LOG_DIR}/cowrie.json"
echo "  Wazuh:      Monitoring cowrie.json via JSON decoder"
echo ""
echo "  Monitor:    docker logs -f ${COWRIE_CONTAINER}"
echo "  Live feed:  tail -f ${LOG_DIR}/cowrie.log"
echo "════════════════════════════════════════════════════════"