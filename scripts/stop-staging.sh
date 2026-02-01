#!/usr/bin/env bash

# Script to stop staging environment

set -e

echo "🛑 Stopping staging environment..."

# Stop project
echo "📦 Stopping project..."
docker compose -f docker-compose.yml --env-file .env.staging down

# Keep Traefik running (it may be used by other projects)
echo ""
echo "⚠️  Traefik left running"
echo "   To stop Traefik: docker compose -f docker-compose.traefik.yml down"
echo ""
echo "✅ Staging environment stopped!"
