export const prerender = false;

/**
 * /svc/revenue.json — Live LP revenue data with commission extrapolation
 * 
 * Combines:
 * 1. Known baseline from commissions.json (manually calibrated)
 * 2. DexScreener live volume data
 * 3. Volume-weighted fee extrapolation since last calibration
 * 
 * The commission ticker shows: baseline + estimated fees from recent volume.
 * Recalibrate baseline periodically via scripts/update_commissions.sh
 */

import type { APIRoute } from 'astro';
import fs from 'node:fs';
import path from 'node:path';

const PAIR_ADDR = '0x1d201b9760e79e058f3eaaddcb2cf777fbfdca39597c972b4e783acdfbf77ed6';
const DEX_URL = `https://api.dexscreener.com/latest/dex/pairs/base/${PAIR_ADDR}`;

// Load commission baseline from data file
function loadBaseline(): { baseline_usd: number; baseline_date: string; fee_rate: number; lp_share: number } {
  try {
    const dataPath = path.join(process.cwd(), 'public', 'data', 'commissions.json');
    return JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
  } catch {
    return { baseline_usd: 32340, baseline_date: '2026-02-11T23:59:59+07:00', fee_rate: 0.01, lp_share: 1.0 };
  }
}

// Estimate fees earned since baseline using 24h volume extrapolation
function extrapolateFees(volume24h: number, feeRate: number, lpShare: number, daysSinceBaseline: number): number {
  // Conservative: use 24h volume as daily rate, multiply by days elapsed
  // This approximates cumulative fees — will drift, hence periodic recalibration
  const dailyFees = volume24h * feeRate * lpShare;
  return Math.round(dailyFees * daysSinceBaseline);
}

const HEADERS = {
  'Content-Type': 'application/json',
  'Cache-Control': 's-maxage=60, stale-while-revalidate=300',
  'Access-Control-Allow-Origin': '*',
};

export const GET: APIRoute = async () => {
  const { baseline_usd, baseline_date, fee_rate, lp_share } = loadBaseline();
  const now = new Date();
  const baselineTime = new Date(baseline_date);
  const daysSinceBaseline = Math.max(0, (now.getTime() - baselineTime.getTime()) / 86400000);

  try {
    const res = await fetch(DEX_URL, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) throw new Error(`DexScreener ${res.status}`);
    const data = await res.json();
    const pair = data?.pairs?.[0];

    const volume24h = pair?.volume?.h24 ?? 0;
    const estimatedNewFees = extrapolateFees(volume24h, fee_rate, lp_share, daysSinceBaseline);
    const totalEstimated = baseline_usd + estimatedNewFees;

    return new Response(JSON.stringify({
      lp_commissions_total: totalEstimated,
      lp_commissions_baseline: baseline_usd,
      lp_commissions_estimated_new: estimatedNewFees,
      baseline_date,
      days_since_calibration: Math.round(daysSinceBaseline * 10) / 10,
      fee_rate,
      token_price_usd: pair?.priceUsd ? parseFloat(pair.priceUsd) : null,
      volume_24h: pair?.volume?.h24 ?? null,
      volume_6h: pair?.volume?.h6 ?? null,
      volume_1h: pair?.volume?.h1 ?? null,
      liquidity_usd: pair?.liquidity?.usd ?? null,
      price_change_24h: pair?.priceChange?.h24 ?? null,
      fdv: pair?.fdv ?? null,
      market_cap: pair?.marketCap ?? null,
      pair_address: PAIR_ADDR,
      chain: 'base',
      dex: pair?.dexId ?? 'uniswap',
      source: 'dexscreener+extrapolation',
      updated: now.toISOString(),
    }), { status: 200, headers: HEADERS });
  } catch (e: any) {
    return new Response(JSON.stringify({
      lp_commissions_total: baseline_usd,
      lp_commissions_baseline: baseline_usd,
      lp_commissions_estimated_new: 0,
      baseline_date,
      token_price_usd: null,
      volume_24h: null,
      liquidity_usd: null,
      error: e?.message || 'DexScreener fetch failed',
      source: 'fallback',
      updated: now.toISOString(),
    }), { status: 200, headers: HEADERS });
  }
};
