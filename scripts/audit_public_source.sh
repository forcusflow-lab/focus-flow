#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SCAN_PATHS=(app components lib plugins assets app.config.ts package.json)
PATTERN='AppBlock|MobileSoft|cz\.mobilesoft|Freedom|to\.freedom|App Blocker'

if grep -RInE --exclude-dir=.git "$PATTERN" "${SCAN_PATHS[@]}"; then
  echo "Public source audit failed: a prohibited external identifier was found." >&2
  exit 1
fi

echo "Public source audit passed: no prohibited external identifiers in product source, assets, plugins, or configuration."
