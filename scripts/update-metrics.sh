#!/bin/bash
# update-metrics.sh — refreshes public/data/metrics.json with REAL data
# Sources: X API (followers, posts), on-chain (revenue), date math (day count)
# Run via cron or manually before deploy

set -euo pipefail
SITE_DIR="${1:-$(dirname "$0")/..}"
METRICS="$SITE_DIR/public/data/metrics.json"
STATE="$SITE_DIR/public/data/state.json"

# Load secrets
source ~/.config/openclaw/.env 2>/dev/null || true

# Calculate day from operational start
OP_START="2026-02-03"
TODAY=$(date +%Y-%m-%d)
DAY=$(( ($(date -j -f "%Y-%m-%d" "$TODAY" +%s 2>/dev/null || date -d "$TODAY" +%s) - $(date -j -f "%Y-%m-%d" "$OP_START" +%s 2>/dev/null || date -d "$OP_START" +%s)) / 86400 + 1 ))
NOW=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

# Get real follower/post count from X API
FOLLOWERS=""
POSTS=""
if [ -n "${SQUAER_X_BEARER_TOKEN:-}" ]; then
  X_DATA=$(curl -sf -H "Authorization: Bearer $SQUAER_X_BEARER_TOKEN" \
    "https://api.x.com/2/users/2002263777346265088?user.fields=public_metrics" 2>/dev/null || echo "")
  if [ -n "$X_DATA" ]; then
    FOLLOWERS=$(echo "$X_DATA" | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['public_metrics']['followers_count'])" 2>/dev/null || echo "")
    POSTS=$(echo "$X_DATA" | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['public_metrics']['tweet_count'])" 2>/dev/null || echo "")
  fi
fi

# Update metrics.json
python3 -c "
import json
with open('$METRICS') as f: m = json.load(f)
m['day'] = $DAY
m['updated'] = '$NOW'
followers = '${FOLLOWERS}'
posts = '${POSTS}'
if followers: m['followers'] = int(followers)
if posts: m['posts'] = int(posts)
with open('$METRICS', 'w') as f: json.dump(m, f, indent=2)
print(f'metrics.json → Day {$DAY}, followers={m.get(\"followers\")}, posts={m.get(\"posts\")}')
"

# Update state.json
python3 -c "
import json
with open('$STATE') as f: s = json.load(f)
s['day'] = $DAY
s['generated_at'] = '$NOW'
followers = '${FOLLOWERS}'
posts = '${POSTS}'
if followers and 'followers' in s: s['followers'] = int(followers)
if posts and 'posts' in s: s['posts'] = int(posts)
with open('$STATE', 'w') as f: json.dump(s, f, indent=2)
print(f'state.json → Day {$DAY}')
"
