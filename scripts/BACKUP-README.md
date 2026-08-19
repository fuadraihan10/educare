# Database Backup & Restore

## Quick Start

### Backup

```bash
# Default: uses DATABASE_URL, saves to ./backups, retains 7
DATABASE_URL="postgresql://sms:password@localhost:5432/sms" bash scripts/backup.sh

# Custom retention (keep last 14)
MAX_BACKUPS=14 DATABASE_URL="..." bash scripts/backup.sh

# Custom backup directory
BACKUP_DIR=/var/backups/sms DATABASE_URL="..." bash scripts/backup.sh
```

### Restore

```bash
bash scripts/restore.sh ./backups/sms_20260818T120000Z.sql.gz
```

The script will prompt for confirmation before overwriting the database.

## Configuration

| Variable | Default | Description |
|---|---|---|
| `DATABASE_URL` | *(required)* | PostgreSQL connection URL |
| `BACKUP_DIR` | `./backups` | Directory for backup files |
| `MAX_BACKUPS` | `7` | Number of backups to retain |

## Backup Format

Backups use `pg_dump` custom format (`-Fc`) compressed with `gzip`. The filename pattern is:

```
<database>_<ISO8601-UTC>.sql.gz
```

Example: `sms_20260818T120000Z.sql.gz`

## Retention Policy

By default the 7 most recent backups are kept. Older backups are automatically deleted after each new backup completes.

## Automation (cron)

Add to `/etc/crontab` or a cron drop-in:

```
# Daily at 02:00 UTC
0 2 * * * DATABASE_URL="postgresql://sms:password@localhost:5432/sms" MAX_BACKUPS=7 /path/to/scripts/backup.sh >> /var/log/sms-backup.log 2>&1
```

Or schedule via docker-compose if running in Docker:

```yaml
  backup:
    build: .
    entrypoint: ["bash", "scripts/backup.sh"]
    environment:
      DATABASE_URL: postgresql://sms:sms_dev_password@postgres:5432/sms
    volumes:
      - backups:/app/backups
    profiles:
      - tools
```

Then run: `docker compose --profile tools run --rm backup`
