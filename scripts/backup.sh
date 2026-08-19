#!/usr/bin/env bash
set -euo pipefail

# PostgreSQL backup script
# Usage: ./scripts/backup.sh

DB_URL="${DATABASE_URL:?DATABASE_URL must be set}"
BACKUP_DIR="${BACKUP_DIR:-./backups}"
MAX_BACKUPS="${MAX_BACKUPS:-7}"

mkdir -p "$BACKUP_DIR"

# Extract connection details from DATABASE_URL
# Expected format: postgresql://user:password@host:port/dbname
DB_HOST=$(echo "$DB_URL" | sed -n 's|.*@\([^:]*\):\([0-9]*\)/.*|\1|p')
DB_PORT=$(echo "$DB_URL" | sed -n 's|.*@\([^:]*\):\([0-9]*\)/.*|\2|p')
DB_USER=$(echo "$DB_URL" | sed -n 's|.*//\([^:]*\):.*|\1|p')
DB_PASS=$(echo "$DB_URL" | sed -n 's|.*//[^:]*:\([^@]*\)@.*|\1|p')
DB_NAME=$(echo "$DB_URL" | sed -n 's|.*/\([^?]*\).*|\1|p')

TIMESTAMP=$(date -u +"%Y%m%dT%H%M%SZ")
BACKUP_FILE="${BACKUP_DIR}/${DB_NAME}_${TIMESTAMP}.sql.gz"

export PGPASSWORD="$DB_PASS"

echo "[$(date -u +"%Y-%m-%d %H:%M:%S UTC")] Starting backup of database '${DB_NAME}'..."

pg_dump \
  -h "$DB_HOST" \
  -p "$DB_PORT" \
  -U "$DB_USER" \
  -d "$DB_NAME" \
  --no-owner \
  --no-privileges \
  --clean \
  --if-exists \
  -Fc \
  | gzip > "$BACKUP_FILE"

FILESIZE=$(wc -c < "$BACKUP_FILE" | tr -d ' ')
echo "[$(date -u +"%Y-%m-%d %H:%M:%S UTC")] Backup saved: ${BACKUP_FILE} (${FILESIZE} bytes)"

# Retention: keep only MAX_BACKUPS most recent backups
BACKUP_COUNT=$(find "$BACKUP_DIR" -name "${DB_NAME}_*.sql.gz" -type f | wc -l)
if [ "$BACKUP_COUNT" -gt "$MAX_BACKUPS" ]; then
  DELETE_COUNT=$((BACKUP_COUNT - MAX_BACKUPS))
  echo "[$(date -u +"%Y-%m-%d %H:%M:%S UTC")] Pruning ${DELETE_COUNT} old backup(s) (keeping last ${MAX_BACKUPS})..."
  find "$BACKUP_DIR" -name "${DB_NAME}_*.sql.gz" -type f \
    | sort \
    | head -n "$DELETE_COUNT" \
    | while IFS= read -r f; do rm -- "$f"; done
fi

unset PGPASSWORD
echo "[$(date -u +"%Y-%m-%d %H:%M:%S UTC")] Backup complete."
