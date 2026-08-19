#!/usr/bin/env bash
set -euo pipefail

# PostgreSQL restore script
# Usage: ./scripts/restore.sh <backup-file>

if [ $# -lt 1 ]; then
  echo "Usage: $0 <backup-file>"
  echo "  e.g. $0 ./backups/sms_20260101T120000Z.sql.gz"
  exit 1
fi

BACKUP_FILE="$1"

if [ ! -f "$BACKUP_FILE" ]; then
  echo "Error: backup file not found: $BACKUP_FILE"
  exit 1
fi

DB_URL="${DATABASE_URL:?DATABASE_URL must be set}"

DB_HOST=$(echo "$DB_URL" | sed -n 's|.*@\([^:]*\):\([0-9]*\)/.*|\1|p')
DB_PORT=$(echo "$DB_URL" | sed -n 's|.*@\([^:]*\):\([0-9]*\)/.*|\2|p')
DB_USER=$(echo "$DB_URL" | sed -n 's|.*//\([^:]*\):.*|\1|p')
DB_PASS=$(echo "$DB_URL" | sed -n 's|.*//[^:]*:\([^@]*\)@.*|\1|p')
DB_NAME=$(echo "$DB_URL" | sed -n 's|.*/\([^?]*\).*|\1|p')

echo "This will OVERWRITE database '${DB_NAME}' on ${DB_HOST}:${DB_PORT}"
echo "Backup file: ${BACKUP_FILE}"
echo ""
read -r -p "Type 'yes' to confirm: " CONFIRM
if [ "$CONFIRM" != "yes" ]; then
  echo "Aborted."
  exit 0
fi

export PGPASSWORD="$DB_PASS"

echo "[$(date -u +"%Y-%m-%d %H:%M:%S UTC")] Restoring from ${BACKUP_FILE}..."

gunzip -c "$BACKUP_FILE" \
  | psql \
    -h "$DB_HOST" \
    -p "$DB_PORT" \
    -U "$DB_USER" \
    -d "$DB_NAME" \
    --quiet

unset PGPASSWORD
echo "[$(date -u +"%Y-%m-%d %H:%M:%S UTC")] Restore complete."
