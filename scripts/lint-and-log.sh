#!/usr/bin/env bash
# lint-and-log.sh — Run design linter and append results to audit log
set -uo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
LOG="$ROOT/audits/lint-history.jsonl"
mkdir -p "$ROOT/audits"

output=$(bash "$ROOT/scripts/design-lint.sh" 2>&1)
rc=$?

# Parse results
violations=$(echo "$output" | grep -c '^\[WARN\]' || true)
pages_total=$(echo "$output" | grep -o 'Checked [0-9]*' | grep -o '[0-9]*' || echo 0)
pages_clean=$((pages_total - violations))
date_iso=$(date +%Y-%m-%dT%H:%M:%S%z | sed 's/\([0-9][0-9]\)$/:\1/')

echo "{\"date\":\"$date_iso\",\"violations\":$violations,\"pages_clean\":$pages_clean,\"pages_total\":$pages_total}" >> "$LOG"

if [ "$violations" -gt 0 ]; then
  echo "⚠ $violations lint violations found (logged to audits/lint-history.jsonl)"
else
  echo "✓ 0 violations — all $pages_total files clean"
fi

exit 0  # Never block deploys
