export const prerender = false;
import fs from 'fs';
import path from 'path';

export async function GET() {
  // Fallback values from metrics.json
  let fallback = { revenue: 32340, volume24h: null, price: null };
  try {
    const metricsPath = path.join(process.cwd(), 'public', 'data', 'metrics.json');
    const metrics = JSON.parse(fs.readFileSync(metricsPath, 'utf-8'));
    fallback.revenue = metrics.revenue ?? fallback.revenue;
  } catch {}

  try {
    const pairAddress = '0x1d201b9760e79e058f3eaaddcb2cf777fbfdca39597c972b4e783acdfbf77ed6';
    const res = await fetch(`https://api.dexscreener.com/latest/dex/pairs/base/${pairAddress}`);
    const data = await res.json();
    const pair = data?.pairs?.[0];

    if (!pair) {
      return new Response(JSON.stringify({
        price: null,
        priceChange24h: null,
        volume24h: null,
        liquidity: null,
        marketCap: null,
        totalRevenue: fallback.revenue,
        timestamp: new Date().toISOString()
      }), {
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=60' }
      });
    }

    return new Response(JSON.stringify({
      price: pair.priceUsd,
      priceChange24h: pair.priceChange?.h24,
      volume24h: pair.volume?.h24,
      liquidity: pair.liquidity?.usd,
      marketCap: pair.marketCap,
      totalRevenue: fallback.revenue,
      timestamp: new Date().toISOString()
    }), {
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=60' }
    });
  } catch (e) {
    return new Response(JSON.stringify({
      price: null,
      volume24h: null,
      totalRevenue: fallback.revenue,
      error: 'fetch failed',
      timestamp: new Date().toISOString()
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=60' }
    });
  }
}
