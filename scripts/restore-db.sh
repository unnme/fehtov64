#!/usr/bin/env bash

# Database restore script
# Restores PostgreSQL database from a backup file

set -e

# Load environment variables
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
BACKUP_DIR="$PROJECT_DIR/backups"

if [ -f "$PROJECT_DIR/.env" ]; then
    set -a
    source "$PROJECT_DIR/.env"
    set +a
elif [ -f "$PROJECT_DIR/.env.production" ]; then
    set -a
    source "$PROJECT_DIR/.env.production"
    set +a
fi

# Check argument
if [ -z "$1" ]; then
    echo "Usage: $0 <backup_file.sql.gz>"
    echo ""
    echo "Available backups:"
    echo ""

    if [ -d "$BACKUP_DIR/daily" ] && [ "$(ls -A "$BACKUP_DIR/daily" 2>/dev/null)" ]; then
        echo "Daily:"
        ls -lh "$BACKUP_DIR/daily/"*.sql.gz 2>/dev/null | tail -5
        echo ""
    fi

    if [ -d "$BACKUP_DIR/weekly" ] && [ "$(ls -A "$BACKUP_DIR/weekly" 2>/dev/null)" ]; then
        echo "Weekly:"
        ls -lh "$BACKUP_DIR/weekly/"*.sql.gz 2>/dev/null | tail -5
        echo ""
    fi

    if [ -d "$BACKUP_DIR/monthly" ] && [ "$(ls -A "$BACKUP_DIR/monthly" 2>/dev/null)" ]; then
        echo "Monthly:"
        ls -lh "$BACKUP_DIR/monthly/"*.sql.gz 2>/dev/null | tail -5
        echo ""
    fi

    # Check if any backups exist
    if ! find "$BACKUP_DIR" -name "*.sql.gz" -type f 2>/dev/null | grep -q .; then
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
if [ -z "$POSTGRES_USER" ] || [ -z "$POSTGRES_DB" ]; then
    echo "❌ POSTGRES_USER and POSTGRES_DB must be set"
    exit 1
fi

echo "⚠️  WARNING: This will REPLACE all data in database '$POSTGRES_DB'"
echo "   Backup file: $BACKUP_FILE"
echo "   Container: $CONTAINER_NAME"
echo ""
read -p "Are you sure? (yes/no): " CONFIRM

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
