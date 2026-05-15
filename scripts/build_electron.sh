#!/usr/bin/env bash
# Build Windows/Linux/macOS desktop installer via Electron.
# Step 1: bundle Flask with PyInstaller → dist_server/
# Step 2: package with electron-builder → dist_electron/
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "==> Step 1 — Bundle Flask server with PyInstaller ..."
pip install pyinstaller
pyinstaller --onefile --name coilms_server \
  --add-data "backend:backend" \
  --add-data "frontend:frontend" \
  --hidden-import=pkg_resources \
  app.py

mkdir -p dist_server
cp dist/coilms_server* dist_server/
echo "    Server bundle: dist_server/"

echo "==> Step 2 — Build Electron app ..."
npm install
npm run electron:build

echo ""
echo "==> Done. Installer in dist_electron/"
