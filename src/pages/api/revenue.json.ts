/**
 * /api/revenue.json — Live LP revenue data
 * Fetches DexScreener pair data server-side with 60s CDN cache.
 * Single source of truth for revenue metrics across homepage, terminal, and external consumers.
 */

import type { APIRoute } from 'astro';

const PAIR_ADDR = '0x1d201b9760e79e058f3eaaddcb2cf777fbfdca39597c972b4e783acdfbf77ed6';
const DEX_URL = `https://api.dexscreener.com/latest/dex/pairs/base/${PAIR_ADDR}`;

// Cumulative LP commissions earned — update when cron refreshes metrics
const TOTAL_LP_EARNED = 32340;

const HEADERS = {
  'Content-Type': 'application/json',
  'Cache-Control': 's-maxage=60, stale-while-revalidate=300',
  'Access-Control-Allow-Origin': '*',
};

export const GET: APIRoute = async () => {
  try {
    const res = await fetch(DEX_URL, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) throw new Error(`DexScreener ${res.status}`);
    const data = await res.json();
    const pair = data?.pairs?.[0];

    return new Response(JSON.stringify({
      lp_commissions_total: TOTAL_LP_EARNED,
      token_price_usd: pair?.priceUsd ? parseFloat(pair.priceUsd) : null,
      volume_24h: pair?.volume?.h24 ?? null,
      volume_6h: pair?.volume?.h6 ?? null,
      volume_1h: pair?.volume?.h1 ?? null,
      liquidity_usd: pair?.liquidity?.usd ?? null,
      price_change_24h: pair?.priceChange?.h24 ?? null,
      pair_address: PAIR_ADDR,
      chain: 'base',
      dex: pair?.dexId ?? 'uniswap',
      source: 'dexscreener',
      updated: new Date().toISOString(),
    }), { status: 200, headers: HEADERS });
  } catch (e: any) {
    // Fallback with cached total — DexScreener may be down or rate-limited
    return new Response(JSON.stringify({
      lp_commissions_total: TOTAL_LP_EARNED,
      token_price_usd: null,
      volume_24h: null,
      liquidity_usd: null,
      error: e?.message || 'DexScreener fetch failed',
      source: 'fallback',
      updated: new Date().toISOString(),
    }), { status: 200, headers: HEADERS });
  }
};
