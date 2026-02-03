#!/usr/bin/env bash

# Database restore script
# Restores PostgreSQL database from a backup file

set -euo pipefail

# Load environment variables
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
BACKUP_DIR="$PROJECT_DIR/backups"

if [ -f "$PROJECT_DIR/.env" ]; then
  set -a
  # shellcheck disable=SC1091
  source "$PROJECT_DIR/.env"
  set +a
elif [ -f "$PROJECT_DIR/.env.production" ]; then
  set -a
  # shellcheck disable=SC1091
  source "$PROJECT_DIR/.env.production"
  set +a
fi

# Check argument
if [ $# -eq 0 ]; then
  echo "Usage: $0 <backup_file.sql.gz>"
  echo ""
  echo "Available backups:"
  echo ""

  for TYPE in daily weekly monthly; do
    DIR="$BACKUP_DIR/$TYPE"
    if [ -d "$DIR" ] && find "$DIR" -maxdepth 1 -name "*.sql.gz" -type f | grep -q .; then
      echo "${TYPE^}:"
      find "$DIR" -maxdepth 1 -name "*.sql.gz" -type f \
        -exec ls -lh {} + 2>/dev/null | tail -5
      echo ""
    fi
  done

  # Check if any backups exist
  if ! find "$BACKUP_DIR" -name "*.sql.gz" -type f | grep -q .; then
    echo "  No backups found in $BACKUP_DIR"
  fi

  exit 1
fi

BACKUP_FILE="$1"

# Check if file exists
if [ ! -f "$BACKUP_FILE" ]; then
  echo "❌ File not found: $BACKUP_FILE"
  exit 1
fi

# Configuration
CONTAINER_NAME="${CONTAINER_NAME:-$(docker ps --filter "name=db" --format "{{.Names}}" | grep -v backup | head -1)}"

# Check required variables
if [ -z "${POSTGRES_USER:-}" ] || [ -z "${POSTGRES_DB:-}" ]; then
  echo "❌ POSTGRES_USER and POSTGRES_DB must be set"
  exit 1
fi

echo "⚠️  WARNING: This will REPLACE all data in database '$POSTGRES_DB'"
echo "   Backup file: $BACKUP_FILE"
echo "   Container: $CONTAINER_NAME"
echo ""
read -r -p "Are you sure? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
  echo "❌ Cancelled"
  exit 0
fi

echo ""
echo "🔄 Restoring database..."

# Drop and recreate database
echo "   Dropping existing database..."
docker exec "$CONTAINER_NAME" psql -U "$POSTGRES_USER" -c "DROP DATABASE IF EXISTS $POSTGRES_DB WITH (FORCE);" postgres
docker exec "$CONTAINER_NAME" psql -U "$POSTGRES_USER" -c "CREATE DATABASE $POSTGRES_DB;" postgres

# Restore from backup
echo "   Restoring from backup..."
gunzip -c "$BACKUP_FILE" | docker exec -i "$CONTAINER_NAME" psql -U "$POSTGRES_USER" "$POSTGRES_DB"

echo ""
echo "✅ Database restored successfully!"
echo ""
echo "⚠️  You may need to restart the backend:"
echo "   docker compose restart backend"
