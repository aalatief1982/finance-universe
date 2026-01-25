#!/usr/bin/env bash
set -euo pipefail

PLUGIN_DIRS=(
  "capacitor-background-sms-listener"
  "capacitor-sms-reader"
)

ensure_plugin_assets() {
  local plugin_dir="$1"

  echo "Ensuring ${plugin_dir} plugin assets..."

  mkdir -p "${plugin_dir}/dist/esm" "${plugin_dir}/dist/types"

  if [ ! -f "${plugin_dir}/dist/esm/index.js" ]; then
    echo "// JavaScript side implemented in app code" > "${plugin_dir}/dist/esm/index.js"
  fi

  if [ ! -f "${plugin_dir}/dist/plugin.js" ]; then
    echo "module.exports = {};" > "${plugin_dir}/dist/plugin.js"
  fi

  if [ ! -f "${plugin_dir}/dist/types/index.d.ts" ]; then
    echo "export {};" > "${plugin_dir}/dist/types/index.d.ts"
  fi
}

for plugin_dir in "${PLUGIN_DIRS[@]}"; do
  ensure_plugin_assets "${plugin_dir}"
done

echo "Plugin setup complete!"
