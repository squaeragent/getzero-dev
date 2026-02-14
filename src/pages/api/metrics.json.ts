export const prerender = false;

/**
 * /api/metrics.json — Dashboard metrics
 * Returns key metrics for the MetricsDashboard component and terminal.
 * Enriches static metrics with live DexScreener revenue data.
 */

import type { APIRoute } from 'astro';

const PAIR_ADDR = '0x1d201b9760e79e058f3eaaddcb2cf777fbfdca39597c972b4e783acdfbf77ed6';
const DEX_URL = `https://api.dexscreener.com/latest/dex/pairs/base/${PAIR_ADDR}`;

const HEADERS = {
  'Content-Type': 'application/json',
  'Cache-Control': 's-maxage=60, stale-while-revalidate=300',
  'Access-Control-Allow-Origin': '*',
};

// Core metrics — update via cron or redeploy
const METRICS = {
  day: 12,
  agents: 5,
  revenue: 32340,
  subscribers: 12,
  followers: 392,
  posts: 155,
  quality: 8.4,
  entities: 70,
  specs: 62,
  cost_per_agent: 1160,
  machines: 1,
  uptime: '99.2%',
  treasury: 23282,
  automated_jobs: 25,
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
          price: pair.priceUsd ? parseFloat(pair.priceUsd) : null,
          volume_24h: pair.volume?.h24 ?? null,
          liquidity_usd: pair.liquidity?.usd ?? null,
          price_change_24h: pair.priceChange?.h24 ?? null,
        };
      }
    }
  } catch { /* serve without live pricing */ }

  return new Response(JSON.stringify({
    ...METRICS,
    live,
    updated: new Date().toISOString(),
  }), { status: 200, headers: HEADERS });
};
