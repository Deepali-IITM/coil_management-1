#!/usr/bin/env bash
# Prepare the www/ directory used by Capacitor (Android APK build).
# Copies frontend/static/* and generates a Jinja2-free index.html.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
WWW="$ROOT/www"

echo "==> Cleaning $WWW ..."
rm -rf "$WWW"
mkdir -p "$WWW"

echo "==> Copying static assets ..."
cp -r "$ROOT/frontend/static/." "$WWW/"

# Generate a static index.html (no Jinja2 url_for — use relative paths)
cat > "$WWW/index.html" << 'HTML'
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
  <meta name="theme-color" content="#6366f1" />
  <meta name="mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
  <meta name="apple-mobile-web-app-title" content="CoilMS" />
  <link rel="manifest" href="./manifest.json" />
  <link rel="apple-touch-icon" href="./icons/icon-192.png" />

  <script src="./vendor/vue.min.js"></script>
  <script src="./vendor/vue-router.min.js"></script>
  <script src="./vendor/vuex.min.js"></script>

  <link rel="stylesheet" href="./vendor/bootstrap.min.css" />
  <link rel="stylesheet" href="./vendor/bootstrap-icons.min.css" />
  <link rel="stylesheet" href="./styles.css" />

  <title>CoilMS — Coil &amp; Sheet Management</title>
</head>
<body>
  <div id="app"></div>
  <script src="./index.js" type="module"></script>
  <script src="./vendor/bootstrap.bundle.min.js"></script>
  <script src="./vendor/chart.min.js"></script>
</body>
</html>
HTML

echo "==> www/ ready. Run: npx cap sync android"
