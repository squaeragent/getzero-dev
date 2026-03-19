export const prerender = true;

import type { APIRoute } from 'astro';

export const GET: APIRoute = async () => {
  return new Response(JSON.stringify({
    lp_commissions_total: 32340,
    lp_commissions_baseline: 32340,
    baseline_date: '2026-02-14T19:00:00+07:00',
    source: 'static',
    updated: new Date().toISOString(),
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
