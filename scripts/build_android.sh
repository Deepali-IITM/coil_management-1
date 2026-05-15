#!/usr/bin/env bash
# Full Android APK build pipeline.
# Prerequisites: Node.js, JDK 17+, Android SDK (ANDROID_HOME set).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "==> Step 1 — Prepare web assets ..."
bash scripts/prepare_www.sh

echo "==> Step 2 — Install Node dependencies ..."
npm install

echo "==> Step 3 — Capacitor sync ..."
npx cap sync android

echo "==> Step 4 — Build APK (debug) ..."
cd android
./gradlew assembleDebug

APK="app/build/outputs/apk/debug/app-debug.apk"
if [ -f "$APK" ]; then
  cp "$APK" "$ROOT/CoilMS-debug.apk"
  echo ""
  echo "==> APK ready: CoilMS-debug.apk"
  echo "    Install on device: adb install CoilMS-debug.apk"
else
  echo "ERROR: APK not found at $APK" && exit 1
fi
