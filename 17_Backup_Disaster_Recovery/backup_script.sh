#!/bin/bash
# ============================================================
# Advanced SOC Lab — backup_script.sh
# Automated backup of SOC platform data:
#   - Wazuh configuration & rules
#   - Elasticsearch indices (Wazuh alerts)
#   - TheHive cases and attachments
#   - Docker volumes
#   - Custom detection rules
#
# Schedule with cron:
#   0 2 * * * /opt/soc-lab/17_Backup_Disaster_Recovery/backup_script.sh >> /var/log/soc-backup.log 2>&1
# ============================================================

set -euo pipefail

# ── Config ─────────────────────────────────────────────────
BACKUP_ROOT="${BACKUP_ROOT:-/opt/soc-backups}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
ES_HOST="${ES_HOST:-https://localhost:9200}"
ES_USER="${ES_USER:-admin}"
ES_PASS="${ES_PASS:-admin}"
THEHIVE_HOST="${THEHIVE_HOST:-http://localhost:9000}"
THEHIVE_KEY="${THEHIVE_KEY:-your-thehive-api-key}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="${BACKUP_ROOT}/${TIMESTAMP}"
LOG_PREFIX="[SOC-BACKUP]"

# Colors for output
GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'
log()  { echo -e "${GREEN}${LOG_PREFIX} $(date +%H:%M:%S) ✓ $1${NC}"; }
warn() { echo -e "${YELLOW}${LOG_PREFIX} $(date +%H:%M:%S) ⚠ $1${NC}"; }
err()  { echo -e "${RED}${LOG_PREFIX} $(date +%H:%M:%S) ✗ $1${NC}"; }

# ── Initialization ─────────────────────────────────────────
echo ""
echo "════════════════════════════════════════════════════════"
echo "  SOC LAB BACKUP — $(date)"
echo "  Destination: ${BACKUP_DIR}"
echo "════════════════════════════════════════════════════════"
echo ""

mkdir -p "${BACKUP_DIR}"/{wazuh,elasticsearch,thehive,docker,rules,config}

# ── 1. Wazuh Configuration Backup ─────────────────────────
log "Backing up Wazuh configuration..."

if [[ -d /var/ossec ]]; then
  tar -czf "${BACKUP_DIR}/wazuh/wazuh_etc_${TIMESTAMP}.tar.gz" \
    /var/ossec/etc/ 2>/dev/null || warn "Could not read /var/ossec/etc"

  tar -czf "${BACKUP_DIR}/wazuh/wazuh_logs_${TIMESTAMP}.tar.gz" \
    /var/ossec/logs/alerts/alerts.log \
    /var/ossec/logs/alerts/alerts.json 2>/dev/null || warn "Could not read Wazuh alert logs"

  tar -czf "${BACKUP_DIR}/wazuh/wazuh_rules_${TIMESTAMP}.tar.gz" \
    /var/ossec/etc/rules/ 2>/dev/null || warn "Could not read Wazuh rules"

  log "Wazuh config backed up"
else
  warn "Wazuh not installed locally. Skipping."
fi

# ── 2. Detection Rules Backup ──────────────────────────────
log "Backing up custom detection rules..."

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SOC_ROOT="$(dirname "$SCRIPT_DIR")"

if [[ -f "${SOC_ROOT}/09_Detection_Rules/local_rules.xml" ]]; then
  cp -r "${SOC_ROOT}/09_Detection_Rules/" "${BACKUP_DIR}/rules/"
  log "Custom rules backed up"
fi

# ── 3. Elasticsearch Snapshot ─────────────────────────────
log "Creating Elasticsearch snapshot..."

ES_REPO_NAME="soc_backup"
ES_REPO_PATH="/mnt/soc-snapshots"
SNAPSHOT_NAME="soc_${TIMESTAMP}"

# Register snapshot repository (if not exists)
curl -sk -X PUT "${ES_HOST}/_snapshot/${ES_REPO_NAME}" \
  -u "${ES_USER}:${ES_PASS}" \
  -H "Content-Type: application/json" \
  -d "{\"type\":\"fs\",\"settings\":{\"location\":\"${ES_REPO_PATH}\",\"compress\":true}}" \
  --insecure > /dev/null 2>&1 || warn "Could not register ES snapshot repo"

# Create snapshot
SNAPSHOT_RESULT=$(curl -sk -X PUT \
  "${ES_HOST}/_snapshot/${ES_REPO_NAME}/${SNAPSHOT_NAME}?wait_for_completion=true" \
  -u "${ES_USER}:${ES_PASS}" \
  --insecure 2>&1)

if echo "$SNAPSHOT_RESULT" | grep -q '"state":"SUCCESS"'; then
  log "Elasticsearch snapshot '${SNAPSHOT_NAME}' created successfully"
  echo "$SNAPSHOT_RESULT" > "${BACKUP_DIR}/elasticsearch/snapshot_result.json"
else
  warn "Elasticsearch snapshot may have failed: ${SNAPSHOT_RESULT}"
fi

# ── 4. TheHive Cases Export ───────────────────────────────
log "Exporting TheHive cases..."

if curl -sf "${THEHIVE_HOST}/api/status" > /dev/null 2>&1; then
  curl -sf "${THEHIVE_HOST}/api/v1/query" \
    -H "Authorization: Bearer ${THEHIVE_KEY}" \
    -H "Content-Type: application/json" \
    -d '{"query":[{"_name":"listCase"},{"_name":"sort","_fields":[{"startDate":"desc"}]},{"_name":"page","from":0,"to":1000}]}' \
    -o "${BACKUP_DIR}/thehive/cases_export_${TIMESTAMP}.json" 2>/dev/null || \
    warn "TheHive case export failed. Check API key."
  log "TheHive cases exported"
else
  warn "TheHive not reachable. Skipping case export."
fi

# ── 5. Docker Volume Backup ───────────────────────────────
log "Backing up Docker volumes..."

DOCKER_VOLUMES=(
  "soc-lab_wazuh_etc"
  "soc-lab_wazuh_logs"
  "soc-lab_thehive_data"
  "soc-lab_cassandra_data"
  "soc-lab_minio_data"
)

for vol in "${DOCKER_VOLUMES[@]}"; do
  if docker volume inspect "$vol" > /dev/null 2>&1; then
    docker run --rm \
      -v "${vol}:/data" \
      -v "${BACKUP_DIR}/docker:/backup" \
      alpine:latest \
      tar -czf "/backup/${vol}_${TIMESTAMP}.tar.gz" /data 2>/dev/null
    log "Volume backed up: ${vol}"
  else
    warn "Docker volume not found: ${vol}"
  fi
done

# ── 6. Config files backup ────────────────────────────────
log "Backing up SOC Lab project config..."
if [[ -f "${SOC_ROOT}/docker-compose.yml" ]]; then
  cp "${SOC_ROOT}/docker-compose.yml" "${BACKUP_DIR}/config/"
fi
if [[ -f "${SOC_ROOT}/.env" ]]; then
  cp "${SOC_ROOT}/.env" "${BACKUP_DIR}/config/"
fi

# ── 7. Create manifest ────────────────────────────────────
log "Creating backup manifest..."
cat > "${BACKUP_DIR}/MANIFEST.txt" <<MANIFEST
SOC Lab Backup Manifest
========================
Timestamp:  ${TIMESTAMP}
Date:       $(date)
Hostname:   $(hostname)
Backup Dir: ${BACKUP_DIR}

Contents:
$(find "${BACKUP_DIR}" -type f | sort)

Disk Usage:
$(du -sh "${BACKUP_DIR}")
MANIFEST

# ── 8. Compress final archive ─────────────────────────────
log "Creating final archive..."
ARCHIVE="${BACKUP_ROOT}/soc_backup_${TIMESTAMP}.tar.gz"
tar -czf "${ARCHIVE}" -C "${BACKUP_ROOT}" "${TIMESTAMP}/"
ARCHIVE_SIZE=$(du -sh "${ARCHIVE}" | cut -f1)
log "Archive created: ${ARCHIVE} (${ARCHIVE_SIZE})"

# Remove working directory
rm -rf "${BACKUP_DIR}"

# ── 9. Enforce retention policy ───────────────────────────
log "Applying retention policy (${RETENTION_DAYS} days)..."
DELETED=$(find "${BACKUP_ROOT}" -name "soc_backup_*.tar.gz" \
  -mtime "+${RETENTION_DAYS}" -delete -print | wc -l)
log "Removed ${DELETED} backups older than ${RETENTION_DAYS} days"

# ── Summary ───────────────────────────────────────────────
echo ""
echo "════════════════════════════════════════════════════════"
echo "  ✅ SOC LAB BACKUP COMPLETE"
echo "════════════════════════════════════════════════════════"
echo "  Archive:   ${ARCHIVE}"
echo "  Size:      ${ARCHIVE_SIZE}"
echo "  Timestamp: ${TIMESTAMP}"
echo "════════════════════════════════════════════════════════"
echo ""