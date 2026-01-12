#!/usr/bin/env bash

set -e
set -x

echo "🔧 Running ruff check with auto-fix..."
ruff check --fix app scripts

echo "🔧 Formatting code with ruff..."
ruff format app scripts

echo "✅ Formatting complete!"
