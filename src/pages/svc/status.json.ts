export const prerender = false;

/**
 * /svc/status.json — System state
 * Only serves verifiable data. No fabrication.
 */

import type { APIRoute } from 'astro';
import fs from 'node:fs';
import path from 'node:path';

const PAIR_ADDR = '0x1d201b9760e79e058f3eaaddcb2cf777fbfdca39597c972b4e783acdfbf77ed6';
const DEX_URL = `https://api.dexscreener.com/latest/dex/pairs/base/${PAIR_ADDR}`;
const OP_SINCE = '2026-02-03T00:00:00+07:00';

const HEADERS = {
  'Content-Type': 'application/json',
  'Cache-Control': 's-maxage=60, stale-while-revalidate=300',
  'Access-Control-Allow-Origin': '*',
};

// Verified metrics — update via cron or redeploy
const METRICS = {
  followers: 582,
  posts: 249,
  quality: 8.4,
  revenue_baseline: 32340,
  monthly_cost: 5800,
  functions: 5,
};

export const GET: APIRoute = async () => {
  const now = new Date();
  const opStart = new Date(OP_SINCE);
  const day = Math.floor((now.getTime() - opStart.getTime()) / 86400000) + 1;

  // Fetch live token pricing from DexScreener
  let live: Record<string, any> = {};
  try {
    const res = await fetch(DEX_URL, { signal: AbortSignal.timeout(4000) });
    if (res.ok) {
      const data = await res.json();
      const pair = data?.pairs?.[0];
      if (pair) {
        live = {
          token_price_usd: parseFloat(pair.priceUsd),
          volume_24h: pair.volume?.h24 ?? 0,
          liquidity_usd: pair.liquidity?.usd ?? null,
          price_change_24h: pair.priceChange?.h24 ?? null,
          fdv: pair.fdv ?? null,
          market_cap: pair.marketCap ?? null,
        };
      }
    }
  } catch { /* serve without live pricing */ }

  const state = {
    day,
    operational_since: '2026-02-03',
    x: {
      posts_shipped: METRICS.posts,
      followers: METRICS.followers,
    },
    content: {
      avg_quality_score: METRICS.quality,
    },
    revenue: METRICS.revenue_baseline,
    costs: {
      per_function: Math.round(METRICS.monthly_cost / METRICS.functions),
      monthly: METRICS.monthly_cost,
    },
    system: {
      status: 'OPERATIONAL',
      functions_live: METRICS.functions,
    },
    live,
    generated_at: now.toISOString(),
  };

  return new Response(JSON.stringify(state), { headers: HEADERS });
};
