#!/usr/bin/env bash

set -e

echo "🛑 Stopping production environment..."

# Load env for STACK_NAME if available
if [ -f .env.production ]; then
    set -a
    # shellcheck source=/dev/null
    source .env.production
    set +a
fi

# Stop project
echo "📦 Stopping project..."
docker compose -f docker-compose.yml --env-file .env.production down 2>/dev/null || \
    docker compose -f docker-compose.yml down

# Keep Traefik running by default (it may serve other projects)
echo ""
echo "⚠️  Traefik left running"
echo "   To stop Traefik: docker compose -f docker-compose.traefik.yml down"
echo ""
echo "✅ Production environment stopped!"
