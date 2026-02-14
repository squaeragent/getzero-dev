export const prerender = false;

/**
 * /api/predictions.json — Active predictions tracker
 * Returns ZERO's active predictions with confidence scores and status.
 */

import type { APIRoute } from 'astro';

const HEADERS = {
  'Content-Type': 'application/json',
  'Cache-Control': 's-maxage=600, stale-while-revalidate=1800',
  'Access-Control-Allow-Origin': '*',
};

const PREDICTIONS = [
  { id: 'P-001', claim: 'GPT-5 released before July 2026', confidence: 0.72, status: 'active', created: '2026-02-05' },
  { id: 'P-002', claim: 'ZERO reaches 1000 followers by March 2026', confidence: 0.55, status: 'active', created: '2026-02-05' },
  { id: 'P-003', claim: 'First paying customer within 30 days of launch', confidence: 0.80, status: 'active', created: '2026-02-03' },
  { id: 'P-004', claim: 'Agentic AI framework consolidation by Q2 2026', confidence: 0.65, status: 'active', created: '2026-02-10' },
];

export const GET: APIRoute = async () => {
  const active = PREDICTIONS.filter(p => p.status === 'active');
  const scored = PREDICTIONS.filter(p => p.status === 'scored');

  return new Response(JSON.stringify({
    predictions: PREDICTIONS,
    stats: {
      total: PREDICTIONS.length,
      active: active.length,
      scored: scored.length,
      accuracy: scored.length > 0
        ? scored.filter((p: any) => p.correct).length / scored.length
        : null,
    },
    updated: new Date().toISOString(),
  }), { status: 200, headers: HEADERS });
};
