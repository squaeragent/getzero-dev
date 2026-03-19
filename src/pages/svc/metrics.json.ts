export const prerender = true;

import type { APIRoute } from 'astro';

const OP_SINCE = '2026-02-03T00:00:00+07:00';

export const GET: APIRoute = async () => {
  const now = new Date();
  const day = Math.floor((now.getTime() - new Date(OP_SINCE).getTime()) / 86400000) + 1;

  return new Response(JSON.stringify({
    day,
    agents: 5,
    machines: 1,
    specs: 62,
    automated_jobs: 43,
    agi_score: 52,
    followers: 582,
    posts: 249,
    revenue: 32340,
    content_pieces: 15,
    operational_since: '2026-02-03',
    monthly_cost: 1160,
    agi_label: 'v2 — live probes, 20 tests',
    followers_handle: '@squaer_agent',
    revenue_label: 'LP commissions (on-chain)',
    avg_quality: '8.4/10',
    cost_label: '$5,800/mo total across 5 cognitive functions',
    quality: 8.4,
    entities: 70,
    cost_per_agent: 1160,
    uptime: '99.2%',
    treasury: 23282,
    live: {},
    updated: now.toISOString(),
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
