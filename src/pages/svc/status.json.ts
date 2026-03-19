export const prerender = true;

import type { APIRoute } from 'astro';

const OP_SINCE = '2026-02-03T00:00:00+07:00';

export const GET: APIRoute = async () => {
  const now = new Date();
  const day = Math.floor((now.getTime() - new Date(OP_SINCE).getTime()) / 86400000) + 1;

  return new Response(JSON.stringify({
    day,
    operational_since: '2026-02-03',
    x: { posts_shipped: 249, followers: 582 },
    content: { avg_quality_score: 8.4 },
    revenue: 32340,
    costs: { per_function: 1160, monthly: 5800 },
    system: { status: 'OPERATIONAL', functions_live: 5 },
    live: {},
    generated_at: now.toISOString(),
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
