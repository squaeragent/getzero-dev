#!/bin/bash
# Visual snapshot — screenshots all pages at 375px and 1440px
# Usage: ./scripts/snapshot.sh [base_url]
# Requires: npx playwright (auto-installs)

BASE_URL="${1:-http://localhost:4321}"
OUT_DIR="/tmp/getzero-snapshots/$(date +%Y%m%d_%H%M%S)"
mkdir -p "$OUT_DIR"

PAGES=(
  "/"
  "/build-log"
  "/agents"
  "/agents/seraphim"
  "/agents/squaer"
  "/agents/chronicle"
  "/agents/aesthete"
  "/agents/sentinel"
  "/system"
  "/intel"
  "/manifesto"
  "/product"
  "/predictions"
)

WIDTHS=(375 1440)

echo "📸 Snapshotting ${#PAGES[@]} pages × ${#WIDTHS[@]} widths"
echo "   Output: $OUT_DIR"

for page in "${PAGES[@]}"; do
  for width in "${WIDTHS[@]}"; do
    slug="${page//\//_}"
    [ "$slug" = "_" ] && slug="_home"
    filename="${slug}_${width}px.png"
    
    echo "   ${page} @ ${width}px → ${filename}"
    
    npx --yes playwright screenshot \
      --viewport-size="${width},900" \
      --full-page \
      "${BASE_URL}${page}" \
      "${OUT_DIR}/${filename}" 2>/dev/null
  done
done

echo "✅ Done: $(ls "$OUT_DIR" | wc -l | tr -d ' ') screenshots in $OUT_DIR"
