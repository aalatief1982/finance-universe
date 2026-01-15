#!/usr/bin/env bash
set -euo pipefail

PLUGIN_DIR="capacitor-background-sms-listener"

echo "Ensuring Background SMS Listener plugin assets..."

mkdir -p "$PLUGIN_DIR/dist/esm" "$PLUGIN_DIR/dist/types"

if [ ! -f "$PLUGIN_DIR/dist/esm/index.js" ]; then
  echo "// JavaScript side implemented in app code" > "$PLUGIN_DIR/dist/esm/index.js"
fi

if [ ! -f "$PLUGIN_DIR/dist/plugin.js" ]; then
  echo "module.exports = {};" > "$PLUGIN_DIR/dist/plugin.js"
fi

if [ ! -f "$PLUGIN_DIR/dist/types/index.d.ts" ]; then
  echo "export {};" > "$PLUGIN_DIR/dist/types/index.d.ts"
fi

echo "Plugin setup complete!"
