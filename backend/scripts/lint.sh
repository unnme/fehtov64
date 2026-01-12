#!/usr/bin/env bash

set -e
set -x

echo "🔍 Running type checking with mypy..."
mypy app

echo "🔍 Running linting with ruff..."
ruff check app scripts

echo "🔍 Checking code formatting with ruff..."
ruff format --check app scripts
