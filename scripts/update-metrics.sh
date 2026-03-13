#!/bin/bash
# update-metrics.sh — refreshes public/data/metrics.json with current values
# Run via cron or manually before deploy

set -euo pipefail
SITE_DIR="${1:-$(dirname "$0")/..}"
METRICS="$SITE_DIR/public/data/metrics.json"
STATE="$SITE_DIR/public/data/state.json"

# Calculate day from operational start
OP_START="2026-02-03"
TODAY=$(date +%Y-%m-%d)
DAY=$(( ($(date -j -f "%Y-%m-%d" "$TODAY" +%s) - $(date -j -f "%Y-%m-%d" "$OP_START" +%s)) / 86400 + 1 ))

NOW=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

# Update metrics.json
python3 -c "
import json
with open('$METRICS') as f: m = json.load(f)
m['day'] = $DAY
m['updated'] = '$NOW'
with open('$METRICS', 'w') as f: json.dump(m, f, indent=2)
print(f'metrics.json → Day {$DAY}')
"

# Update state.json
python3 -c "
import json
with open('$STATE') as f: s = json.load(f)
s['day'] = $DAY
s['generated_at'] = '$NOW'
with open('$STATE', 'w') as f: json.dump(s, f, indent=2)
print(f'state.json → Day {$DAY}')
"
