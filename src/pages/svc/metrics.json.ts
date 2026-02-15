export const prerender = false;

/**
 * /svc/metrics.json — Dashboard metrics
 * Returns ALL keys needed by MetricsDashboard component + terminal commands.
 * Enriches with live DexScreener pricing.
 */

import type { APIRoute } from 'astro';

const PAIR_ADDR = '0x1d201b9760e79e058f3eaaddcb2cf777fbfdca39597c972b4e783acdfbf77ed6';
const DEX_URL = `https://api.dexscreener.com/latest/dex/pairs/base/${PAIR_ADDR}`;
const OP_SINCE = '2026-02-03T00:00:00+07:00';

const HEADERS = {
  'Content-Type': 'application/json',
  'Cache-Control': 's-maxage=60, stale-while-revalidate=300',
  'Access-Control-Allow-Origin': '*',
};

export const GET: APIRoute = async () => {
  // Dynamic day
  const now = new Date();
  const day = Math.floor((now.getTime() - new Date(OP_SINCE).getTime()) / 86400000) + 1;

  let live: Record<string, any> = {};
  try {
    const res = await fetch(DEX_URL, { signal: AbortSignal.timeout(4000) });
    if (res.ok) {
      const data = await res.json();
      const pair = data?.pairs?.[0];
      if (pair) {
        live = {
          price: pair.priceUsd ? parseFloat(pair.priceUsd) : null,
          volume_24h: pair.volume?.h24 ?? null,
          liquidity_usd: pair.liquidity?.usd ?? null,
          price_change_24h: pair.priceChange?.h24 ?? null,
        };
      }
    }
  } catch { /* serve without live pricing */ }

  // ── All keys the MetricsDashboard needs ──
  const metrics = {
    // Main value cards (data-key → value)
    day,
    agents: 5,
    machines: 1,
    specs: 62,
    automated_jobs: 43,
    agi_score: 52,
    followers: 428,
    posts: 185,
    revenue: 33343,
    content_pieces: 15,
    subscribers: 12,
    operational_since: '2026-02-03',
    monthly_cost: 1160,          // per-agent (card label = "COST / AGENT")

    // Sub-text values (data-key → text for {v} template)
    agi_label: 'v2 — live probes, 20 tests',
    followers_handle: '@squaer_agent',
    revenue_label: 'LP commissions (on-chain)',
    avg_quality: '8.4/10',
    dispatches: 2,
    cost_label: '$5,800/mo total across 5 agents',

    // Extra flat keys for terminal + other consumers
    quality: 8.4,
    entities: 70,
    cost_per_agent: 1160,
    uptime: '99.2%',
    treasury: 23282,

    // Live DexScreener
    live,
    updated: now.toISOString(),
  };

  return new Response(JSON.stringify(metrics), { status: 200, headers: HEADERS });
};
