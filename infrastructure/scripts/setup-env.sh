#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"

if [[ ! -f "$ROOT/.env" ]]; then
  cp "$ROOT/.env.example" "$ROOT/.env"
  echo "Created .env from .env.example"
else
  echo ".env already exists"
fi

if [[ ! -f "$ROOT/apps/mobile/.env" ]]; then
  cp "$ROOT/apps/mobile/.env.example" "$ROOT/apps/mobile/.env"
  echo "Created apps/mobile/.env from apps/mobile/.env.example"
else
  echo "apps/mobile/.env already exists"
fi
