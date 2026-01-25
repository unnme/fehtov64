#!/usr/bin/env bash

# Script to add staging domains to /etc/hosts
# Requires sudo privileges

set -e

HOSTS_FILE="/etc/hosts"
DOMAIN="staging.localhost.tiangolo.com"

# Entries to add
HOSTS_ENTRIES=(
    "127.0.0.1 $DOMAIN"
    "127.0.0.1 api.$DOMAIN"
    "127.0.0.1 dashboard.$DOMAIN"
    "127.0.0.1 adminer.$DOMAIN"
    "127.0.0.1 traefik.$DOMAIN"
)

echo "🔧 Configuring /etc/hosts for staging environment..."
echo ""

# Check if entries already exist
EXISTING_ENTRIES=false
for entry in "${HOSTS_ENTRIES[@]}"; do
    if grep -q "$entry" "$HOSTS_FILE" 2>/dev/null; then
        EXISTING_ENTRIES=true
        break
    fi
done

if [ "$EXISTING_ENTRIES" = true ]; then
    echo "⚠️  Existing entries for staging domains detected"
    read -p "Remove old entries and add new ones? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        # Remove old entries
        for entry in "${HOSTS_ENTRIES[@]}"; do
            sudo sed -i.bak "/$DOMAIN/d" "$HOSTS_FILE" 2>/dev/null || true
        done
        echo "✅ Old entries removed"
    else
        echo "❌ Cancelled"
        exit 0
    fi
fi

# Add new entries
echo ""
echo "📝 Adding entries to /etc/hosts:"
for entry in "${HOSTS_ENTRIES[@]}"; do
    if ! grep -q "$entry" "$HOSTS_FILE" 2>/dev/null; then
        echo "$entry" | sudo tee -a "$HOSTS_FILE" > /dev/null
        echo "   ✅ $entry"
    else
        echo "   ⏭️  $entry (already exists)"
    fi
done

echo ""
echo "✅ /etc/hosts configuration completed!"
echo ""
echo "Added domains:"
echo "  - $DOMAIN"
echo "  - api.$DOMAIN"
echo "  - dashboard.$DOMAIN"
echo "  - adminer.$DOMAIN"
echo "  - traefik.$DOMAIN"
