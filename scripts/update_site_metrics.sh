#!/bin/bash
# update_site_metrics.sh — Fetches live metrics and updates SSR endpoints
# Run via cron: every 4 hours, pushes to trigger Vercel redeploy
# Usage: ./scripts/update_site_metrics.sh

set -euo pipefail

REPO_DIR="/tmp/getzero-dev"
cd "$REPO_DIR"

# Source credentials
source ~/.zshrc 2>/dev/null || true
source ~/.config/openclaw/.env 2>/dev/null || true

echo "[$(date +%H:%M)] Fetching X metrics..."

# Fetch from X API
X_DATA=$(curl -sf -H "Authorization: Bearer $SQUAER_X_BEARER_TOKEN" \
  "https://api.x.com/2/users/2002263777346265088?user.fields=public_metrics" 2>/dev/null || echo '{}')

FOLLOWERS=$(echo "$X_DATA" | python3 -c "import json,sys; print(json.load(sys.stdin).get('data',{}).get('public_metrics',{}).get('followers_count', 0))" 2>/dev/null || echo 0)
TWEETS=$(echo "$X_DATA" | python3 -c "import json,sys; print(json.load(sys.stdin).get('data',{}).get('public_metrics',{}).get('tweet_count', 0))" 2>/dev/null || echo 0)

if [ "$FOLLOWERS" -eq 0 ] || [ "$TWEETS" -eq 0 ]; then
  echo "[WARN] X API returned 0 — skipping update"
  exit 0
fi

echo "[$(date +%H:%M)] X: $FOLLOWERS followers, $TWEETS tweets"

# Update SSR endpoints
for f in src/pages/svc/status.json.ts src/pages/svc/metrics.json.ts; do
  # Update followers
  sed -i '' "s/followers: [0-9]*/followers: $FOLLOWERS/" "$f"
  # Update posts/tweets
  sed -i '' "s/posts: [0-9]*/posts: $TWEETS/" "$f"
done

# Update static data files
python3 -c "
import json

# metrics.json
with open('public/data/metrics.json') as f: d=json.load(f)
d['followers'] = $FOLLOWERS
d['posts'] = $TWEETS
with open('public/data/metrics.json','w') as f: json.dump(d, f, indent=2)

# state.json
with open('public/data/state.json') as f: d=json.load(f)
d['x']['followers'] = $FOLLOWERS
d['x']['posts_shipped'] = $TWEETS
d['metrics']['followers'] = $FOLLOWERS
d['metrics']['posts'] = $TWEETS
with open('public/data/state.json','w') as f: json.dump(d, f, indent=2)
"

# Check if anything changed
if git diff --quiet; then
  echo "[$(date +%H:%M)] No changes — metrics up to date"
  exit 0
fi

# Commit and push
git add -A
git commit -m "auto: update metrics ($FOLLOWERS followers, $TWEETS posts) [skip ci]"
git push origin main 2>/dev/null

echo "[$(date +%H:%M)] ✅ Pushed — Vercel will redeploy"
