#!/usr/bin/env bash
# add_journal_entry.sh — Add entries to the build log
#
# Usage:
#   ./scripts/add_journal_entry.sh <tag> <text> [time]
#   ./scripts/add_journal_entry.sh SHIPPED "New feature deployed"
#   ./scripts/add_journal_entry.sh LIVE "System went online" "14:30"
#   ./scripts/add_journal_entry.sh --new-day <day_num> <date> <metrics>
#
# Tags: SHIPPED, LIVE, FIXED, PURGE, KILLED, FAILED, REVENUE
# Time defaults to current HH:MM (BKK timezone)
#
# The script adds to today's day block, creating one if it doesn't exist.
# After adding, commit + push to trigger Vercel redeploy.

set -euo pipefail

REPO_DIR="$(cd "$(dirname "$0")/.." && pwd)"
JOURNAL="$REPO_DIR/public/data/journal.json"

if [ ! -f "$JOURNAL" ]; then
  echo "Error: $JOURNAL not found"
  exit 1
fi

# New day creation
if [ "${1:-}" = "--new-day" ]; then
  if [ $# -lt 4 ]; then
    echo "Usage: $0 --new-day <day_num> <date> <metrics>"
    echo "  e.g. $0 --new-day 13 2026-02-15 \"posts 170 · followers 400\""
    exit 1
  fi
  DAY_NUM="$2"
  DATE="$3"
  METRICS="$4"

  python3 -c "
import json
with open('$JOURNAL') as f: data = json.load(f)
new_day = {
    'day': $DAY_NUM,
    'date': '$DATE',
    'entries': [],
    'metrics': '$METRICS'
}
# Insert at the beginning (newest first)
data['days'].insert(0, new_day)
with open('$JOURNAL', 'w') as f: json.dump(data, f, indent=2)
print('✓ Created Day $DAY_NUM ($DATE)')
"
  exit 0
fi

# Add entry to existing day
if [ $# -lt 2 ]; then
  echo "Usage: $0 <tag> <text> [time]"
  echo "Tags: SHIPPED, LIVE, FIXED, PURGE, KILLED, FAILED, REVENUE"
  exit 1
fi

TAG="$1"
TEXT="$2"
TIME="${3:-$(TZ=Asia/Bangkok date +%H:%M)}"
TODAY="$(TZ=Asia/Bangkok date +%Y-%m-%d)"

python3 -c "
import json, sys

with open('$JOURNAL') as f: data = json.load(f)

# Find today's day block
today_idx = None
for i, day in enumerate(data['days']):
    if day['date'] == '$TODAY':
        today_idx = i
        break

if today_idx is None:
    print('⚠ No day block for $TODAY — create one first with --new-day')
    sys.exit(1)

entry = {'time': '$TIME', 'tag': '$TAG', 'text': $(python3 -c "import json; print(json.dumps('$TEXT'))")}

# Insert at top of entries (newest first within a day)
data['days'][today_idx]['entries'].insert(0, entry)

with open('$JOURNAL', 'w') as f: json.dump(data, f, indent=2)
print(f'✓ Added [{\"$TAG\"}] to Day {data[\"days\"][today_idx][\"day\"]} at $TIME')
"
