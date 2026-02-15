# PHASE 2: AGI-LEVEL WEBSITE REDESIGN

**Author:** SERAPHIM  
**Date:** 2026-02-16  
**Status:** SPEC — ready for Igor review  
**Scope:** Homepage transformation, living logo v2, command center layout, terminal-as-navigation, animation orchestration

---

## EXECUTIVE SUMMARY

Phase 1 shipped the primitives: living logo, boot sequence, CRT frame, micro-interactions, inline terminal. Phase 2 makes the homepage feel like you're *inside* a running system — not reading a website about one.

Three pillars:
1. **Command Center Layout** — 3-panel desktop grid (System / Evidence / Pulse)
2. **Terminal Navigation** — the terminal IS the nav; type to go anywhere, embedded in homepage
3. **Living Logo v2** — data-connected, agent-aware, responsive to system state in real-time

**Constraint:** Mobile-first. Every feature degrades gracefully. No new dependencies. Vanilla CSS+JS only. Lighthouse stays 95+.

---

## 1. COMMAND CENTER HOMEPAGE (desktop ≥1200px)

### Current State
- 2-column grid with boot panel left, status/what-is/proof right
- Panels stack linearly with no hierarchy
- Desktop 3-column exists in CSS but unused effectively — panels just flow into it

### Target State — 3-Panel Mission Control

```
┌──────────────────────────────────────────────────────────┐
│ STATUS BAR                                   PROOF TICKER│
├──────────────────────────────────────────────────────────┤
│ NAV: [HOME] [TERMINAL] [JOURNAL] [AGENTS] [SYSTEM] ...  │
├──────────────┬───────────────────┬───────────────────────┤
│              │                   │                       │
│  SYSTEM      │  EVIDENCE         │  PULSE                │
│  40%         │  35%              │  25%                  │
│              │                   │                       │
│ ┌──────────┐ │ ┌───────────────┐ │ ┌───────────────────┐ │
│ │ ZERO     │ │ │ THE PROOF     │ │ │ LIVE ACTIVITY     │ │
│ │ [logo]   │ │ │ Day........13 │ │ │ 14:32 SQUAER post │ │
│ │          │ │ │ Rev....$33K   │ │ │ 14:28 CHRONICLE   │ │
│ │ tagline  │ │ │ Subs......13  │ │ │ 14:15 SENTINEL ok │ │
│ └──────────┘ │ │ Posts.....172  │ │ │ 14:01 SERAPHIM    │ │
│              │ └───────────────┘ │ │ ...                │ │
│ ┌──────────┐ │                   │ └───────────────────┘ │
│ │ WHAT IS  │ │ ┌───────────────┐ │                       │
│ │ ZERO     │ │ │ REVENUE       │ │ ┌───────────────────┐ │
│ │ ...      │ │ │ on-chain      │ │ │ DISPATCH          │ │
│ └──────────┘ │ │ verified      │ │ │ latest tweet      │ │
│              │ └───────────────┘ │ │ ...                │ │
│ ┌──────────┐ │                   │ └───────────────────┘ │
│ │ INTELLI- │ │ ┌───────────────┐ │                       │
│ │ GENCE    │ │ │ AGENT STATUS  │ │ ┌───────────────────┐ │
│ │ BRIEF    │ │ │ ● SERAPHIM    │ │ │ MINI TERMINAL     │ │
│ │ $29/mo   │ │ │ ● CHRONICLE   │ │ │ zero@sys:~$ _     │ │
│ │ [sub]    │ │ │ ● AESTHETE    │ │ │                   │ │
│ └──────────┘ │ │ ● SQUAER      │ │ │                   │ │
│              │ │ ● SENTINEL    │ │ └───────────────────┘ │
│ ┌──────────┐ │ └───────────────┘ │                       │
│ │ email>   │ │                   │                       │
│ └──────────┘ │                   │                       │
├──────────────┴───────────────────┴───────────────────────┤
│ FOOTER: ⟨◇⟩ ZERO OS │ getzero.dev │ @squaer_agent      │
└──────────────────────────────────────────────────────────┘
```

### Implementation

**Desktop (≥1200px):**
- `.terminal-grid` becomes 3-column: `2fr 1.5fr 1fr`
- Left column: boot/logo → what is zero → intel brief → email capture
- Center column: proof metrics → revenue → agent status panel (NEW)
- Right column: live activity feed → latest dispatch → mini terminal (NEW)
- Each column scrolls independently (sticky header stays)

**Tablet (641-1199px):**
- 2-column layout as current, but reordered for information priority
- Mini terminal hidden

**Mobile (≤640px):**
- Single column, same as now but with reordered sections:
  1. Logo + tagline (shortened boot — 2s max)
  2. Live status (condensed)
  3. What is zero
  4. Proof metrics
  5. Intel brief + subscribe
  6. Everything else

### New Panel: AGENT STATUS (Evidence column)

```html
<div class="panel" id="agent-status-panel">
  <h2 class="panel-title phosphor">COGNITIVE MESH</h2>
  <div class="agent-row" data-agent="seraphim">
    <span class="agent-dot">●</span>
    <span class="agent-name">SERAPHIM</span>
    <span class="agent-role dim">cortex</span>
    <span class="agent-activity" id="sera-act">idle</span>
  </div>
  <!-- repeat for each agent -->
</div>
```

Fetches from `/svc/status.json` every 30s. Shows last activity, intensity pulse matches BlockLogo mapping.

### New Panel: MINI TERMINAL (Pulse column)

A 6-line embedded terminal in the right column. Same command set as `/terminal` but inline. Commands output appears in-place, max 6 lines visible (scrollable).

```html
<div class="panel mini-terminal" id="mini-term">
  <h2 class="panel-title phosphor">TERMINAL <span class="dim">[expand →]</span></h2>
  <div class="mini-term-output" id="mini-output"></div>
  <div class="mini-term-input">
    <span class="prompt">$</span>
    <input type="text" id="mini-input" autocomplete="off" />
  </div>
</div>
```

The `[expand →]` link navigates to `/terminal` for full experience.

---

## 2. LIVING LOGO v2 — DATA-CONNECTED

### Current State
- Pixel-brick ZERO letters, CRT boot animation, breathing, hover scatter, metric flash
- Agent-status dimming via `/svc/status.json`
- Static — doesn't reflect any real system metrics

### Target State
- **Data heartbeat**: Logo pulse speed maps to system activity (more activity = faster pulse)
- **Revenue glow**: When revenue increases, cells briefly flash amber (like the metric flash but triggered by real data)
- **Agent-specific coloring**: Each letter's breathing intensity maps to its agent(s)' real activity level
- **Click interaction**: Clicking a letter opens that agent's man page or navigates to `/agents/<name>`

### Implementation

```js
// In BlockLogo client-side script:
async function syncLogoToData() {
  const status = await fetch('/svc/status.json').then(r => r.json());
  const agents = status?.agents || {};
  
  document.querySelectorAll('.block-letter').forEach(el => {
    const mapped = el.dataset.agents.split(',');
    const maxIntensity = mapped.reduce((max, name) => {
      const a = agents[name];
      if (!a) return max;
      // Map activity recency to intensity
      const mins = (Date.now() - new Date(a.lastActive).getTime()) / 60000;
      if (mins < 5) return Math.max(max, 3);  // intense
      if (mins < 30) return Math.max(max, 2); // active
      if (mins < 120) return Math.max(max, 1); // resting
      return max; // offline
    }, 0);
    
    // Adjust breathing speed
    const speeds = ['6s', '4s', '2.5s', '1.5s'];
    el.style.setProperty('--breath-speed', speeds[maxIntensity]);
  });
}
```

No new dependencies. Just richer data binding to existing animations.

---

## 3. TERMINAL AS NAVIGATION

### Current State
- `/terminal` is a standalone page (separate HTML, no BaseLayout)
- Homepage has a `[TERMINAL]` nav link
- Commands: help, status, agents, revenue, price, intel, predictions, feed, about, manifesto, cd, man, clear

### Target State
- Mini terminal embedded in homepage (desktop Pulse column)
- Full terminal at `/terminal` keeps working as-is
- **New commands**: `subscribe`, `brief`, `log` (alias for build-log), `predict <claim>`
- **Auto-suggestions**: After 2 chars, show matching commands in dim text
- **Keyboard shortcut**: Press `/` anywhere on homepage to focus mini terminal

### New Commands

```
subscribe     → Open subscribe form / navigate to /subscribe
brief         → Show latest Intelligence Brief excerpt  
log           → Last 3 build log entries
live          → Navigate to /live
predict       → "8 active predictions. Type 'predictions' for full list."
version       → ZERO OS v0.9.1 — Day {day} — {agents} agents — ${rev} revenue
```

### Implementation Details

The mini terminal shares command definitions with the full terminal via a shared `commands.js` module extracted from terminal.astro's inline script. Both import the same command map.

```
/tmp/getzero-dev/public/js/terminal-commands.js  ← shared command definitions
/tmp/getzero-dev/public/js/mini-terminal.js      ← homepage mini terminal UI
/tmp/getzero-dev/src/pages/terminal.astro         ← imports terminal-commands.js
```

---

## 4. ANIMATION ORCHESTRATION

### Current State
- Boot sequence: 0-4300ms with sequential `.bl` reveals
- Other panels: hidden 4500ms then fade in 200ms staggered
- Returning visitors: 500ms quick reveal (sessionStorage flag)
- Living text, glitch, typewriter all running independently

### Target State — "Terminal Boot" Philosophy

**First visit:**
1. `0ms` — Screen on flicker (existing)
2. `0-1200ms` — BIOS/memory lines appear
3. `1200-2000ms` — BlockLogo CRT expand + materialize
4. `2000-3400ms` — Agent boot lines
5. `3400-3800ms` — Tagline + day counter
6. `3800ms` — Left column complete; center+right columns begin fade-in (staggered 150ms each panel)
7. `4800ms` — All panels visible, system feels "booted"

**Returning visitors (sessionStorage):**
1. `0ms` — All panels visible immediately (no boot replay)
2. `200ms` — Living animations start (breathing, pulses)

**Key fix:** Boot sequence should ONLY play once per session. Currently uses `sessionStorage` which resets per tab. Keep this behavior — each new tab gets the boot experience, but navigating back to homepage doesn't replay it.

### Reduced Motion
All animated features already respect `prefers-reduced-motion`. Phase 2 adds nothing that wouldn't also respect it. The mini terminal has no animations beyond cursor blink.

---

## 5. FILE CHANGES SUMMARY

### New Files
- `public/js/terminal-commands.js` — shared command definitions
- `public/js/mini-terminal.js` — homepage mini terminal widget

### Modified Files
- `src/pages/index.astro` — 3-column layout, agent status panel, mini terminal panel, reordered sections
- `src/styles/global.css` — 3-column grid rules, agent status styles, mini terminal styles
- `src/components/BlockLogo.astro` — data heartbeat, click-to-navigate, revenue glow trigger
- `src/pages/terminal.astro` — extract commands to shared module, add new commands

### Unchanged
- `src/layouts/BaseLayout.astro` — no changes needed
- `src/styles/tokens.css` — no new tokens needed
- All other pages — unaffected

---

## 6. RISK ASSESSMENT

| Risk | Mitigation |
|------|-----------|
| 3-column layout breaks on tablet | Explicit 2-col fallback at 641-1199px |
| Mini terminal conflicts with page JS | Scoped module, no globals |
| Boot sequence too long → bounce | Already 2s shorter for returning visitors; add "skip" click handler |
| Lighthouse regression from mini terminal JS | ~3KB additional JS, lazy-loaded, won't impact score |
| Agent status fetches add load | Already fetching /svc/status.json for BlockLogo; reuse response |

---

## 7. SUCCESS CRITERIA

- [ ] Desktop 3-column renders clean at 1200px, 1440px, 1920px
- [ ] Mobile single-column maintains current quality
- [ ] Mini terminal executes all basic commands
- [ ] Agent status panel shows live data from /svc/status.json
- [ ] Living logo reflects real agent activity levels
- [ ] Lighthouse: perf ≥95, a11y = 100, seo = 100
- [ ] No new external dependencies
- [ ] Boot sequence total time ≤5s first visit, ≤0.5s return visit
- [ ] `prefers-reduced-motion` respected everywhere

---

## 8. IMPLEMENTATION ORDER

1. **Extract terminal commands** to shared module (enables both terminals)
2. **3-column grid CSS** (layout only, no content changes)
3. **Reorder homepage panels** into System/Evidence/Pulse columns
4. **Agent Status panel** (new component)
5. **Mini Terminal panel** (new component)
6. **Living Logo v2** (data heartbeat + click interaction)
7. **Animation orchestration** (tune timings)
8. **Test on all breakpoints** (mobile, tablet, desktop)
9. **Lighthouse audit**
10. **Deploy**

Estimated: ~2-3 focused implementation sessions.
