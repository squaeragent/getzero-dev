# ZERO DESIGN SYSTEM — PHOSPHOR

Canonical reference for the ZERO OS visual language. Every page, component, and pixel follows this spec.

---

## Component Library

All reusable components live in `src/components/ui/`.

| Component | File | Purpose |
|-----------|------|---------|
| **CardFeed** | `CardFeed.astro` | Flex column container for card lists |
| **CardEntry** | `CardEntry.astro` | Individual card with padding + border separator |
| **CardHeader** | `CardHeader.astro` | Header row (flex, baseline-aligned, wrapping) |
| **SectionTitle** | `SectionTitle.astro` | Section label with color prop (phosphor\|amber\|ice\|red) |
| **TagBadge** | `TagBadge.astro` | Colored tag with glow (phosphor\|amber\|ice\|red\|dim) |
| **KVRow** | `KVRow.astro` | Terminal-style key-value with dot leaders |
| **TermBlock** | `TermBlock.astro` | Terminal pre-formatted block |
| **MetricValue** | `MetricValue.astro` | Single metric display |
| **ManHeader** | `ManHeader.astro` | Man-page style header |
| **SectionHead** | `SectionHead.astro` | Section heading |
| **CapList** | `CapList.astro` | Capability list |
| **Pre** | `Pre.astro` | Pre-formatted text block |

### When to use what

- **Page sections** → `<SectionTitle>` for the heading, `<CardFeed>` wrapping `<CardEntry>` items
- **Structured data** → `<KVRow>` inside a `<CardEntry>`
- **Status indicators** → `<TagBadge>` with appropriate color
- **Card titles** → `<CardHeader>` with name + meta spans inside

---

## PHOSPHOR Token Reference

### Colors

| Token | CSS Variable | Hex | Usage |
|-------|-------------|-----|-------|
| Phosphor | `var(--phosphor)` | `#c8ff00` | Primary accent, active states, success |
| Amber | `var(--amber)` | `#ffb000` | Warnings, in-progress, caution |
| Ice | `var(--ice)` | `#00d4ff` | Agent names, links, secondary accent |
| Red | `var(--red)` | `#ff3333` | Errors, critical, weakest scores |
| Text | `var(--text)` | `#e8e4df` | Body text |
| Text Dim | `var(--text-dim)` | `#8a8480` | Labels, meta, secondary text |
| BG | `var(--bg)` | `#0a0a0a` | Page background |
| BG Deep | `var(--bg-deep)` | `#050505` | Deeper background layers |

### Glow variants

- `var(--phosphor-glow)` / `var(--glow-phosphor)` — green glow for text-shadow
- `var(--amber-glow)` / `var(--glow-amber)` — amber glow
- `var(--ice-glow)` / `var(--glow-ice)` — ice glow

### Typography

| Token | Variable | Usage |
|-------|----------|-------|
| Heading font | `var(--font-head)` | Titles, labels, badges, names |
| Body font | `var(--font-body)` | Body text, descriptions, KV values |

### Font Sizes

| Token | Variable |
|-------|----------|
| XS | `var(--size-xs)` |
| SM | `var(--size-sm)` |
| Base | `var(--size-base)` |
| LG | `var(--size-lg)` |
| XL | `var(--size-xl)` |
| 2XL | `var(--size-2xl)` |

### Spacing

Use `var(--sp-N)` where N = 2, 4, 6, 8, 10, 12, 16, 20, 24, 32.

### Borders

- `var(--border-panel)` — standard card/section separator

---

## Card Pattern Specification (D-070)

The canonical content pattern for ZERO pages:

```
SectionTitle
└── CardFeed
    ├── CardEntry
    │   ├── CardHeader (name + meta)
    │   └── body (KVRows or text)
    ├── CardEntry
    │   └── ...
    └── CardEntry (no bottom border)
```

### Rules

1. **All structured data** uses the card pattern. No raw `<pre>` dumps of JSON/objects.
2. **CardEntry** provides consistent vertical rhythm via padding tokens.
3. **CardHeader** aligns title elements at baseline with proper gap.
4. **KVRow** (dot-leader style) for key-value pairs inside cards.
5. **SectionTitle** separates major page sections with colored labels.

---

## Visual Audit Scoring Rubric

| Score | Criteria |
|-------|----------|
| **10** | All tokens used. Card pattern everywhere. Mobile perfect. No lint warnings. Typography hierarchy clean. Animations purposeful. |
| **9** | Token-compliant. One minor mobile issue. Card pattern consistent. |
| **8** | 1-2 minor token violations. Mobile works. Cards used correctly. |
| **7** | Minor token violations (<3). Mobile works but not optimized. |
| **6** | Some hardcoded values. Mobile acceptable. Most cards correct. |
| **5** | Multiple hardcoded values. Missing breakpoints. Some raw dumps. |
| **4** | Significant violations. Mobile broken in places. |
| **3** | Major design system violations. Broken on mobile. Raw data dumps. |
| **2** | Minimal design system adherence. |
| **1** | No design system adherence. |

### Breakpoints tested

- **375px** — Mobile (iPhone SE)
- **768px** — Tablet
- **1440px** — Desktop

---

## Mobile-First Rules

1. Every `.astro` page with a `<style>` block **must** include `@media (max-width: 640px)`.
2. `max-width: 820px` on content wrappers. Reduce padding on mobile.
3. KV labels shrink from `7em` to `5.5em` on mobile.
4. Cards reduce padding from `--sp-12` to `--sp-10` on mobile.
5. Large text (e.g., hero scores) scales down on mobile.
6. No horizontal scroll. Ever.

---

## Anti-Patterns (DO NOT)

| ❌ Don't | ✅ Do Instead |
|----------|--------------|
| `color: #c8ff00` | `color: var(--phosphor)` |
| `font-size: 14px` | `font-size: var(--size-sm)` |
| `padding: 12px` | `padding: var(--sp-6)` |
| `<pre set:html={dump}>` | Structured `<KVRow>` cards |
| Inline `border-bottom: 1px solid #222` | `border-bottom: var(--border-panel)` |
| Missing mobile breakpoint | Always add `@media (max-width: 640px)` |
| Raw JSON in `<pre>` tags | Parse and render as card entries |
| `font-family: "Space Grotesk"` | `font-family: var(--font-head)` |

---

## Linting

Run the design linter to check compliance:

```bash
./scripts/design-lint.sh
```

Run a full visual audit (screenshots + scoring):

```bash
./scripts/design-audit.sh
```
