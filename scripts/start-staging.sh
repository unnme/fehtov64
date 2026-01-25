#!/usr/bin/env bash

set -e

# Load variables from .env.staging
if [ -f .env.staging ]; then
    export $(grep -v '^#' .env.staging | xargs)
else
    echo "❌ File .env.staging not found"
    echo "   Create .env.staging file in project root"
    exit 1
fi

# Generate HASHED_PASSWORD if needed
if [ -n "$TRAEFIK_PASSWORD" ] && [ -z "$HASHED_PASSWORD" ]; then
    echo "🔐 Generating HASHED_PASSWORD from TRAEFIK_PASSWORD..."
    export HASHED_PASSWORD=$(openssl passwd -apr1 "$TRAEFIK_PASSWORD")
    echo "✅ HASHED_PASSWORD generated"
fi

echo "🚀 Starting staging environment:"
echo "   ENVIRONMENT: $ENVIRONMENT"
echo "   DOMAIN: $DOMAIN"
echo "   STACK_NAME: $STACK_NAME"
echo ""

# Create traefik-public network if it doesn't exist
echo "📦 Checking traefik-public network..."
docker network create traefik-public 2>/dev/null || echo "   traefik-public network already exists"

# Start Traefik
echo "📦 Starting Traefik..."
docker compose -f docker-compose.traefik.yml up -d --build

# Small pause for Traefik to start
sleep 2

# Start project with variables from .env.staging
echo "📦 Starting project in staging mode..."
docker compose -f docker-compose.yml -f docker-compose.staging.yml up -d --build

echo ""
echo "✅ Staging environment started!"
echo ""
echo "Available URLs:"
echo "  - Frontend Dashboard: http://dashboard.$DOMAIN"
echo "  - Backend API: http://api.$DOMAIN"
echo "  - API Docs: http://api.$DOMAIN/docs"
echo "  - Adminer: http://adminer.$DOMAIN"
echo "  - Traefik Dashboard: http://traefik.$DOMAIN"
echo "  - Mailcatcher: http://localhost:1080"
echo ""
echo "⚠️  Make sure /etc/hosts has entries for staging domains!"
echo "   Run: ./scripts/setup-staging-hosts.sh"
