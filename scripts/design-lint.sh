#!/usr/bin/env bash
# design-lint.sh — Scan .astro files for PHOSPHOR design system violations
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
WARN=0
CHECKED=0
PASSED=()

HEX_COLORS='#c8ff00|#ffb000|#00d4ff|#ff3333|#e8e4df|#8a8480|#0a0a0a|#050505'
HEX_MAP='#c8ff00=var(--phosphor)|#ffb000=var(--amber)|#00d4ff=var(--ice)|#ff3333=var(--red)|#e8e4df=var(--text)|#8a8480=var(--text-dim)|#0a0a0a=var(--bg)|#050505=var(--bg-deep)'

suggest_var() {
  local hex="$1"
  echo "$HEX_MAP" | tr '|' '\n' | grep -i "^${hex}=" | cut -d= -f2- || echo "design token"
}

for f in $(find "$ROOT/src/pages" "$ROOT/src/components" -name '*.astro' 2>/dev/null | sort); do
  rel="${f#$ROOT/}"
  issues=0
  CHECKED=$((CHECKED + 1))

  # 1. Hardcoded hex colors (skip tokens.css, CSS var definitions, comments)
  while IFS=: read -r num line; do
    # Skip lines that are CSS variable definitions (--foo: #hex)
    echo "$line" | grep -qE '^\s*--' && continue
    # Skip HTML/CSS comments
    echo "$line" | grep -qE '^\s*(<!--|/\*|\*)' && continue
    # Skip hex inside var() fallbacks — e.g. var(--phosphor, #c8ff00)
    echo "$line" | grep -qE 'var\(--[a-z-]+,\s*#[0-9a-fA-F]+\)' && continue
    # Skip inline styles on form inputs/buttons (exempt per design spec)
    echo "$line" | grep -qiE '<(input|button)\b' && continue
    # Skip text content (hex mentioned in prose, not CSS)
    echo "$line" | grep -qE "'" && ! echo "$line" | grep -qE ':\s*#[0-9a-fA-F]' && continue
    # Skip D-070 exempt comments
    echo "$line" | grep -qE 'D-070: exempt' && continue
    hex=$(echo "$line" | grep -oEi "$HEX_COLORS" | head -1)
    suggestion=$(suggest_var "$hex")
    echo "[WARN] ${rel}:${num} — Hardcoded color ${hex} (use ${suggestion})"
    WARN=$((WARN + 1)); issues=$((issues + 1))
  done < <(grep -niE "$HEX_COLORS" "$f" 2>/dev/null || true)

  # 2. Hardcoded font sizes (skip tokens.css, global.css)
  if [[ "$rel" != *"tokens.css"* && "$rel" != *"global.css"* ]]; then
    while IFS=: read -r num line; do
      echo "$line" | grep -qE 'var\(--size-' && continue
      # Skip iOS zoom prevention on inputs
      echo "$line" | grep -qiE 'input.*font-size|prevents iOS zoom' && continue
      echo "[WARN] ${rel}:${num} — Hardcoded font-size (use var(--size-*))"
      WARN=$((WARN + 1)); issues=$((issues + 1))
    done < <(grep -nE 'font-size:\s*[0-9]+(px|rem)' "$f" 2>/dev/null || true)
  fi

  # 3. Raw pre dumps with set:html
  while IFS=: read -r num line; do
    echo "[WARN] ${rel}:${num} — Raw pre dump with set:html (D-070 violation)"
    WARN=$((WARN + 1)); issues=$((issues + 1))
  done < <(grep -n '<pre class="term-block"' "$f" 2>/dev/null | grep 'set:html' || true)

  # 4. Missing mobile breakpoint (pages only)
  if [[ "$rel" == src/pages/* ]]; then
    if grep -q '<style' "$f" && ! grep -qE '@media \(max-width: (640|768|375)px\)' "$f"; then
      echo "[WARN] ${rel} — Missing mobile breakpoint"
      WARN=$((WARN + 1)); issues=$((issues + 1))
    fi
  fi

  [[ $issues -eq 0 ]] && PASSED+=("$rel")
done

for p in "${PASSED[@]}"; do
  echo "[PASS] ${p} — No issues"
done

echo ""
echo "Checked ${CHECKED} files. ${WARN} warnings."
[[ $WARN -gt 0 ]] && exit 1
exit 0
