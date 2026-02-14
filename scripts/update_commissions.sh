#!/usr/bin/env bash
# update_commissions.sh — Recalibrate LP commission baseline
#
# Usage:
#   ./scripts/update_commissions.sh <total_usd>
#   ./scripts/update_commissions.sh 35000
#
# This updates the baseline in public/data/commissions.json which the
# SSR revenue endpoint uses for commission extrapolation.
#
# Run this when you audit actual on-chain LP earnings.
# The revenue endpoint extrapolates from this baseline using DexScreener
# volume × fee_rate × days since calibration.

set -euo pipefail

REPO_DIR="$(cd "$(dirname "$0")/.." && pwd)"
COMMISSIONS_FILE="$REPO_DIR/public/data/commissions.json"

if [ $# -lt 1 ]; then
  echo "Usage: $0 <total_usd> [fee_rate]"
  echo ""
  echo "  total_usd  — Cumulative LP commissions earned (e.g. 35000)"
  echo "  fee_rate   — Pool swap fee as decimal (default: 0.01 = 1%)"
  echo ""
  echo "Current baseline:"
  cat "$COMMISSIONS_FILE" 2>/dev/null || echo "  (not found)"
  exit 1
fi

TOTAL_USD="$1"
FEE_RATE="${2:-0.01}"
NOW="$(date -u +%Y-%m-%dT%H:%M:%S+00:00)"
TODAY="$(date -u +%Y-%m-%d)"

cat > "$COMMISSIONS_FILE" <<EOF
{
  "baseline_usd": ${TOTAL_USD},
  "baseline_date": "${NOW}",
  "fee_rate": ${FEE_RATE},
  "lp_share": 1.0,
  "notes": "Cumulative LP commissions from SQUAER/WETH pool. Fee rate is pool swap fee. LP share is 1.0 if sole provider.",
  "last_calibration": "${TODAY}",
  "calibration_source": "manual_wallet_audit"
}
EOF

echo "✓ Commission baseline updated:"
echo "  total: \$${TOTAL_USD}"
echo "  fee_rate: ${FEE_RATE}"
echo "  date: ${NOW}"
echo ""
echo "Committing and pushing..."

cd "$REPO_DIR"
git add public/data/commissions.json
git commit -m "chore: recalibrate LP commissions to \$${TOTAL_USD}" 2>/dev/null || echo "(no changes to commit)"

# Push triggers Vercel redeploy
if git remote get-url origin &>/dev/null; then
  git push origin main 2>/dev/null && echo "✓ Pushed — Vercel will redeploy" || echo "⚠ Push failed"
fi
