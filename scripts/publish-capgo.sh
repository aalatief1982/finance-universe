#!/usr/bin/env bash
set -euo pipefail

VERSION="${1:-}"
ZIP_URL="${2:-https://xpensia-505ac.web.app/www.zip}"

if [[ -z "${VERSION}" ]]; then
  echo "Usage: $0 <version> [zip-url]"
  echo "Example: $0 1.0.3 https://xpensia-505ac.web.app/www.zip"
  exit 1
fi

echo "[Capgo] Building web bundle..."
npm run build

echo "[Capgo] Creating www.zip from dist/..."
rm -f public/www.zip updates/www.zip
(
  cd dist
  zip -r ../public/www.zip .
)
cp public/www.zip updates/www.zip

echo "[Capgo] Updating manifest files..."
node -e "const fs=require('fs');const path=require('path');const files=['public/manifest.json','updates/manifest.json'];const version='${VERSION}';const url='${ZIP_URL}';for (const file of files){let data={version,url};try{data=JSON.parse(fs.readFileSync(file,'utf8'));}catch{};data.version=version;data.url=url;fs.writeFileSync(file,JSON.stringify(data,null,2));}"

echo "[Capgo] Done. Upload public/manifest.json and public/www.zip to hosting."
