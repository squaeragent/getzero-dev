/**
 * Build-time data sanitizer for getzero.dev
 * Standard: ~/Cluster_Memory/standards/data-visibility.md
 * 
 * Principle: if the data never makes it into HTML, it can't leak.
 * Three tiers: public | premium | internal
 * Default: internal (must be explicitly promoted)
 */

// ── Credential patterns (safety net) ──
const CREDENTIAL_PATTERNS = [
  /sk[-_][a-zA-Z0-9]{20,}/,              // Stripe/API secret keys
  /pk[-_][a-zA-Z0-9]{20,}/,              // Publishable keys
  /Bearer\s+[a-zA-Z0-9._\-]{20,}/,       // Bearer tokens
  /token[=:]\s*['"]?[a-zA-Z0-9._\-]{20,}/i, // Generic tokens
  /password[=:]\s*['"]?[^\s'"]{8,}/i,     // Passwords
  /[a-zA-Z0-9+/]{40,}={0,2}/,            // Base64 blobs (40+ chars)
  /0x[a-fA-F0-9]{40}/,                    // Wallet addresses
  /ghp_[a-zA-Z0-9]{36}/,                 // GitHub personal tokens
  /figd_[a-zA-Z0-9_]{30,}/,              // Figma tokens
  /xox[bsp]-[a-zA-Z0-9\-]{20,}/,         // Slack tokens
  /AKIA[A-Z0-9]{16}/,                    // AWS access keys
  /uvqx[a-z]{12}/,                       // App passwords
];

// ── Internal-only keywords (strip lines containing these) ──
const INTERNAL_KEYWORDS = [
  /requires_igor/i,
  /agent disagreement/i,
  /internal strategy/i,
  /competitive position/i,
  /pricing strategy/i,
  /revenue strategy/i,
  /SOUL\.md/,
  /JOURNAL\.md/,
  /MEMORY\.md/,
  /MESH\.md/,
  /topology.score/i,
  /influence.classif/i,
];

// ── Types ──
export type Visibility = 'public' | 'premium' | 'internal';

export interface VisibilityTagged {
  visibility?: Visibility;
  [key: string]: any;
}

/**
 * Filter an array of items by visibility tier.
 * Items without a visibility field default to 'internal' (hidden).
 */
export function filterByVisibility<T extends VisibilityTagged>(
  items: T[],
  tier: Visibility = 'public'
): T[] {
  const allowed: Visibility[] =
    tier === 'public' ? ['public'] :
    tier === 'premium' ? ['public', 'premium'] :
    ['public', 'premium', 'internal'];

  return items.filter(item => {
    const vis = item.visibility || 'internal';
    return allowed.includes(vis);
  });
}

/**
 * Sanitize a text string: remove lines matching credential patterns
 * or internal-only keywords. Returns cleaned text.
 */
export function sanitizeText(text: string): string {
  return text
    .split('\n')
    .filter(line => {
      // Strip lines with credential patterns
      for (const pat of CREDENTIAL_PATTERNS) {
        if (pat.test(line)) return false;
      }
      // Strip lines with internal keywords
      for (const kw of INTERNAL_KEYWORDS) {
        if (kw.test(line)) return false;
      }
      return true;
    })
    .join('\n');
}

/**
 * Check if a single string contains credential-shaped content.
 * Use as a final safety gate before rendering.
 */
export function containsCredential(text: string): boolean {
  for (const pat of CREDENTIAL_PATTERNS) {
    if (pat.test(text)) return true;
  }
  return false;
}

/**
 * Sanitize build log entries.
 * Strips: credentials, internal strategy, agent disagreements.
 */
export function sanitizeBuildLog(entries: string[]): string[] {
  return entries
    .map(entry => sanitizeText(entry))
    .filter(entry => entry.trim().length > 0);
}

/**
 * Sanitize open problems for public display.
 * Strips: revenue strategy, pricing, competitive positioning.
 */
const PROBLEMS_STRIP = [
  /revenue/i,
  /pricing/i,
  /competitive/i,
  /burn.rate/i,
  /runway/i,
  /cost.optim/i,
  /api.cost/i,
];

export function sanitizeProblems(problems: string[]): string[] {
  return problems.filter(p => {
    for (const pat of PROBLEMS_STRIP) {
      if (pat.test(p)) return false;
    }
    return !containsCredential(p);
  });
}

/**
 * Create aggregate stats from action plans (never expose individual plans).
 */
export interface ActionStats {
  total: number;
  autonomyRate: number;
  breakdown: Record<string, number>;
  urgentCount: number;
}

export function aggregateActions(plans: VisibilityTagged[]): ActionStats {
  const total = plans.length;
  const autoCount = plans.filter(p => p.action?.auto_executable).length;
  const breakdown: Record<string, number> = {};
  let urgentCount = 0;

  for (const plan of plans) {
    const type = plan.action?.type || 'UNKNOWN';
    breakdown[type] = (breakdown[type] || 0) + 1;
    if (plan.action?.urgency === 'CRITICAL' || plan.action?.urgency === 'URGENT') {
      urgentCount++;
    }
  }

  return {
    total,
    autonomyRate: total > 0 ? Math.round((autoCount / total) * 100) : 0,
    breakdown,
    urgentCount,
  };
}

/**
 * Sanitize intelligence architecture for public display.
 * Returns layer status + entity counts only.
 */
export interface PublicLayerStatus {
  layer: string;
  name: string;
  status: 'LIVE' | 'BUILDING' | 'SCAFFOLDED';
  summary: string;
}

export function sanitizeArchitecture(layers: PublicLayerStatus[]): PublicLayerStatus[] {
  // Architecture layers are safe — no entity details, no scores
  return layers;
}

/**
 * Full sanitization pass on any string destined for HTML output.
 * Last line of defense.
 */
export function finalSanitize(html: string): string {
  let clean = html;
  // Replace any credential-shaped strings with [REDACTED]
  for (const pat of CREDENTIAL_PATTERNS) {
    clean = clean.replace(new RegExp(pat.source, pat.flags + 'g'), '[REDACTED]');
  }
  return clean;
}
