export const prerender = false;

/**
 * /api/status.json — System status endpoint
 * Returns operational state, agent status, and key metrics.
 * Reads from bundled static data + enriches with live DexScreener revenue.
 */

import type { APIRoute } from 'astro';

const PAIR_ADDR = '0x1d201b9760e79e058f3eaaddcb2cf777fbfdca39597c972b4e783acdfbf77ed6';
const DEX_URL = `https://api.dexscreener.com/latest/dex/pairs/base/${PAIR_ADDR}`;

const HEADERS = {
  'Content-Type': 'application/json',
  'Cache-Control': 's-maxage=120, stale-while-revalidate=600',
  'Access-Control-Allow-Origin': '*',
};

// Authoritative state — update via cron or redeploy
const STATE = {
  system: {
    status: 'OPERATIONAL',
    agents_live: 5,
    machines: 1,
    specs_loaded: 62,
    uptime: '99.2%',
  },
  metrics: {
    day: 12,
    followers: 392,
    posts: 155,
    quality_avg: 8.4,
    entities_tracked: 70,
  },
  revenue: {
    total_earned: 32340,
    subscribers: 12,
    treasury_value: 23282,
    cost_per_agent_monthly: 1160,
  },
  intelligence: {
    l0_monitors: 6,
    l1_entities: 56,
    l2_signals: 36,
    l3_predictions: 5,
    automated_jobs: 25,
  },
};

export const GET: APIRoute = async () => {
  let live: Record<string, any> = {};

  try {
    const res = await fetch(DEX_URL, { signal: AbortSignal.timeout(4000) });
    if (res.ok) {
      const data = await res.json();
      const pair = data?.pairs?.[0];
      if (pair) {
        live = {
          token_price_usd: parseFloat(pair.priceUsd),
          volume_24h: pair.volume?.h24,
          liquidity_usd: pair.liquidity?.usd,
        };
      }
    }
  } catch { /* DexScreener unavailable — serve without live pricing */ }

  return new Response(JSON.stringify({
    ...STATE,
    live,
    updated: new Date().toISOString(),
  }), { status: 200, headers: HEADERS });
};
