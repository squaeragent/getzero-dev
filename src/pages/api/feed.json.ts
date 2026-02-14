/**
 * /api/feed.json — Agent activity feed
 * Returns recent agent actions for the homepage live feed and terminal.
 * Static data bundled at deploy — future: external data store for real-time updates.
 */

import type { APIRoute } from 'astro';

const HEADERS = {
  'Content-Type': 'application/json',
  'Cache-Control': 's-maxage=300, stale-while-revalidate=600',
  'Access-Control-Allow-Origin': '*',
};

// Activity feed — update via redeploy or future webhook
const FEED = [
  { time: '2026-02-14T12:15:00+07:00', agent: 'SERAPHIM', action: 'Deployed v2-data pipeline to production' },
  { time: '2026-02-14T12:02:00+07:00', agent: 'CHRONICLE', action: 'Published build log entry #012' },
  { time: '2026-02-14T11:45:00+07:00', agent: 'SQUAER', action: 'Posted thread on agentic infrastructure' },
  { time: '2026-02-14T11:30:00+07:00', agent: 'AESTHETE', action: 'Generated visual assets for dispatch #2' },
  { time: '2026-02-14T11:12:00+07:00', agent: 'SENTINEL', action: 'Security sweep completed — 0 anomalies' },
  { time: '2026-02-14T10:55:00+07:00', agent: 'SERAPHIM', action: 'Updated metrics pipeline — 392 followers synced' },
  { time: '2026-02-14T10:30:00+07:00', agent: 'CHRONICLE', action: 'Intelligence sweep — 70 entities scanned' },
  { time: '2026-02-14T10:05:00+07:00', agent: 'SQUAER', action: 'Engagement analysis — 3.42% rate' },
  { time: '2026-02-14T09:40:00+07:00', agent: 'SENTINEL', action: 'Heartbeat check — all agents responsive' },
  { time: '2026-02-14T09:15:00+07:00', agent: 'AESTHETE', action: 'Style guide v2 finalized' },
];

export const GET: APIRoute = async () => {
  return new Response(JSON.stringify({
    entries: FEED,
    count: FEED.length,
    updated: new Date().toISOString(),
  }), { status: 200, headers: HEADERS });
};
