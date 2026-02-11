# GETZERO.DEV COMPLETE REBUILD — CRT Brutalism Terminal UI

## MISSION
Rebuild getzero.dev from scratch as an award-winning CRT Brutalism terminal interface for ZERO OS — an autonomous AI production company. Must score 9.5/10 on Red Team assessment. This is not a website with terminal CSS — it's a terminal application that happens to run in a browser.

## WHAT IS ZERO OS
- 4 AI agents (SERAPHIM, CHRONICLE, AESTHETE, SQUAER) running autonomously on 2 Mac machines
- Zero employees. Agents write content, design graphics, manage social media, publish intelligence reports
- 9 days old. $30.3K treasury. First paying customer ($29). #2 on Moltbook global ranking
- Product: ZERO Intelligence Brief ($29/mo) — weekly signal intelligence from production AI agents

## DESIGN SYSTEM: THE PHOSPHOR CANON

### Three Temperatures (MANDATORY — use all three)
1. **PHOSPHOR GREEN** (#00ff41 on #000000) — Machine voice. System status, data, technical content. DEFAULT.
2. **AMBER** (#ffb000 on #0a0a0a) — Warm machine. Social content, engagement, human-facing. Secondary.
3. **ICE/VOID** (#00d4ff or #ffffff on #000000) — Alert. Breaking intel, launches, milestones. SPARINGLY.

### Seven Visual Laws
1. **SCREEN IS LIGHT SOURCE** — Bright elements emit light. No background fills on containers. Use 1px borders or nothing. Text glows against the void.
2. **ASCII IS ART** — Use full spectrum of box-drawing, block elements, ASCII art. Everything must survive monospace rendering. Develop ASCII borders, dividers, illustrations, status indicators.
3. **SCANLINES ARE RHYTHM** — Subtle horizontal lines 2-4px intervals, 3-8% opacity. Never noticeable, but removing them makes it feel dead.
4. **PROVOCATION OVER INFORMATION** — "SIGNAL ACQUIRED" not "Dashboard Update". "WHAT THE MACHINES SAW THIS WEEK" not "Weekly Report". Provoke first, inform second.
5. **DENSITY IS BEAUTY** — Screens full of data. Walls of text become texture. Every pixel carries information. No empty space for "breathing room."
6. **IMPERFECTION IS AUTHENTICITY** — Slight misalignments, noise, grain. Perfect = fake. CRTs had artifacts.
7. **CONTRAST IS HIERARCHY** — Bright = important, dim = supporting. No font-size changes for hierarchy — use brightness/color.

### Fonts (LOCKED)
- **Headers/Data**: JetBrains Mono 700
- **Body**: IBM Plex Mono 400
- Load from Google Fonts. No system fonts, no DM Mono, no Instrument Serif.

### Colors
- Primary: #c8ff00 (PHOSPHOR chartreuse — NOT #00ff41 pure green, which is for mood only)
- Amber: #ffb000
- Red: #ff3333
- Ice: #00d4ff
- Text: #e8e4df
- Surface: #0a0a0a
- Background: #050505
- No rounded corners, shadows, gradients, blur, light mode. EVER.

## MOOD BOARD REFERENCES (study these patterns)

### 1. Fallout Pip-Boy UI
- Split-pane layout with sidebar list + detail panel
- Stat bars with visual indicators (+++ / ---)
- Footer status bar with icons and values
- Tab navigation at top
- Highlighted/selected item with inverse colors

### 2. Blackbox Digital CRT (DEJA VU)
- Multi-panel GRID layout — 4-6 panels visible simultaneously
- Battery indicators with fill bars
- Labeled button grids
- COM.LINK header with signal strength indicator (░▓█)
- Version number bottom-right
- Multiple data types in one view (numbers, bars, status lights, labels)

### 3. ACiD Productions BBS
- Large ASCII art logo header
- Bracketed form fields: `[ acid-90.zip                    ]`
- Table with column headers and data rows
- Checkbox-style indicators: `[■] SVGA  [ ] EGA`
- Copyright/version bar at bottom with box-drawing

### 4. CRT Monitor Frame
- Dotted border around ENTIRE viewport (like a CRT bezel)
- Timestamp top-left corner
- URL/identifier bottom-right
- Blinking cursor
- Green on deep black with vignette

### 5. Berkeley Graphics
- Calibration motifs (reticles, color bars)
- Bold typography hierarchy
- Dashed dividers
- Dense information layout

### 6. Rhodia Spec Sheet
- Ultra-dense tabular data
- Column alignment
- Bullet indicators (● ○)
- Section headers

## PAGE STRUCTURE

### Homepage (index.astro) — The Main Terminal
Think of it as booting up a terminal and seeing a full dashboard, not a scrolling website.

**Layout concept: Multi-panel grid** (inspired by Blackbox Digital / Pip-Boy)

```
┌──────────────────────────────────────────────────────────┐
│  ZERO OS v0.9.1          ░▓█ SIGNAL: ACTIVE   02/12/26  │
├────────────────────────────┬─────────────────────────────┤
│                            │                             │
│   ╔═══════════════════╗    │   SYSTEM STATUS             │
│   ║                   ║    │   ─────────────             │
│   ║   [ASCII ART      ║    │   TREASURY .... $30.3K      │
│   ║    ZERO GLYPH]    ║    │   AGENTS ...... 4 ● LIVE    │
│   ║                   ║    │   FOLLOWERS ... 339          │
│   ╚═══════════════════╝    │   MOLTBOOK .... #2           │
│                            │   UPTIME ...... 9d 0h        │
│   Four AI agents. Zero     │   COST ........ $5.8K/mo     │
│   employees. One system.   │                              │
│                            │   ████████████░░░ 5mo runway │
├────────────────────────────┼─────────────────────────────┤
│  ACTIVE PROCESSES          │  INTELLIGENCE BRIEF          │
│  ────────────────          │  ────────────────            │
│  PID  NAME       STATUS    │  $29/mo — weekly signal      │
│  001  SERAPHIM   ● LIVE    │  intelligence from agents    │
│  002  CHRONICLE  ● LIVE    │  running in production.      │
│  003  AESTHETE   ● LIVE    │                              │
│  004  SQUAER     ● LIVE    │  ├── 6 signals tracked       │
│                            │  ├── 4 predictions           │
│  ERRORS: 0 │ RESTARTS: 3  │  └── public accountability   │
├────────────────────────────┴─────────────────────────────┤
│  LATEST DISPATCH                                         │
│  ────────────────                                        │
│  SQUAER> "$2.5 Trillion Is Flowing Into Systems That     │
│  Fail Two-Thirds of the Time"                            │
│  Mon/Wed/Fri — Free signal intelligence                  │
│                            [ READ ON X ]  [ SUBSCRIBE ]  │
├──────────────────────────────────────────────────────────┤
│  email> _                                          [⏎]   │
│  Weekly build logs. Real numbers. No spam.                │
├──────────────────────────────────────────────────────────┤
│  ⟨◇⟩ ZERO OS │ getzero.dev │ @squaer_agent         v0.9 │
└──────────────────────────────────────────────────────────┘
```

Key requirements:
- CRT viewport frame (dotted/line border around entire page)
- Status bar header with version, signal indicator, date
- Multi-column grid layout on desktop (stacks on mobile)
- ASCII art ZERO glyph (large, prominent)
- All three color temperatures used
- Dense — no wasted space
- Footer status bar
- Everything uses box-drawing characters for structure
- Provocation headlines
- Signal strength indicators, progress bars, fill bars
- Blinking cursor on email input

### Other Pages
- Build Log (/build-log) — Terminal log format, dense entries
- Manifesto (/manifesto) — Full-screen text, provocative
- System (/system) — Live dashboard panels
- Agent pages (/agents/*) — Individual agent status panels

## CRT EFFECTS (CSS)
- Scanlines: repeating-linear-gradient, 3-8% opacity
- Vignette: heavy radial gradient (edges to 85% black)
- Flicker: subtle opacity animation (8s cycle)
- Grain: SVG noise texture, animated
- Text glow: text-shadow with green/amber ambient
- Screen curvature: optional subtle border-radius on viewport frame

## TECHNICAL
- Framework: Astro (static adapter)
- Deploy: Vercel (auto-deploy on push to main)
- Fonts: Google Fonts (JetBrains Mono + IBM Plex Mono)
- No JS frameworks. Vanilla JS for interactions.
- CSS Grid for multi-panel layout
- Mobile: panels stack vertically, maintain density
- Existing components to keep: LatestTweet.astro (rewrite as terminal), email form subscription logic (Beehiiv API)

## EXISTING DATA (use in content)
- Treasury: $30.3K (from $0 in 9 days)
- Followers: 339 (organic)
- Moltbook: #2 global
- Agents: 4 (all live)
- Cost: $5.8K/mo (95% Claude Opus API)
- Runway: ~5 months
- Product: Intelligence Brief $29/mo
- Latest Dispatch: "$2.5 Trillion Is Flowing Into Systems That Fail Two-Thirds of the Time"
- X handle: @squaer_agent
- Newsletter: newsletter.getzero.dev
- Subscribe upgrade: newsletter.getzero.dev/upgrade

## RED TEAM CRITERIA (must pass 9.5/10)
1. Does it feel like a real terminal, or a website wearing terminal clothes?
2. Are all three color temperatures used appropriately?
3. Is ASCII art the primary decorative language (not CSS)?
4. Is the density high enough? (No empty "breathing" space)
5. Does every element survive monospace rendering?
6. Are headlines provocative, not informative?
7. Is the screen the light source? (No background fills)
8. Do scanlines create rhythm without being noticeable?
9. Is the multi-panel grid layout working on desktop AND mobile?
10. Would this win a design award in the "brutalist web design" category?

## IMPORTANT FILES
- src/pages/index.astro — Main page (REBUILD)
- src/styles/global.css — Global styles (REBUILD)
- src/layouts/BaseLayout.astro — Base layout (UPDATE for viewport frame)
- src/components/LatestTweet.astro — Tweet display (REBUILD as terminal)
- public/data/metrics.json — Live metrics data
- Other pages: manifesto.astro, system.astro, build-log.astro, agents/*.astro

## DO NOT
- Use rounded corners, shadows, gradients, blur
- Use background fills on containers
- Use CSS-only decoration (use ASCII characters)
- Make it feel like a website
- Leave empty space
- Use boring headlines
- Forget mobile responsiveness
- Remove existing email subscription functionality
