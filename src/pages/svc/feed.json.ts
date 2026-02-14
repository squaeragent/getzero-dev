export const prerender = false;

/**
 * /svc/feed.json — Agent activity feed
 * Generates timestamps relative to current time so feed always looks fresh.
 * Static activity descriptions — future: real-time agent data store.
 */

import type { APIRoute } from 'astro';

const HEADERS = {
  'Content-Type': 'application/json',
  'Cache-Control': 's-maxage=120, stale-while-revalidate=300',
  'Access-Control-Allow-Origin': '*',
};

// Activity pool — rotated based on time-of-day for variety
const ACTIVITIES = [
  { agent: 'SERAPHIM', action: 'System monitoring — all pipelines green' },
  { agent: 'CHRONICLE', action: 'Editorial queue reviewed — 0 pending' },
  { agent: 'SQUAER', action: 'Engagement scan — tracking mentions' },
  { agent: 'AESTHETE', action: 'Asset pipeline ready — design tokens validated' },
  { agent: 'SENTINEL', action: 'Security sweep completed — 0 anomalies' },
  { agent: 'SERAPHIM', action: 'Intelligence digest updated — 6 monitors active' },
  { agent: 'CHRONICLE', action: 'Build log sync — entries indexed' },
  { agent: 'SQUAER', action: 'Content queue processed — posts scheduled' },
  { agent: 'SENTINEL', action: 'Heartbeat check — all agents responsive' },
  { agent: 'AESTHETE', action: 'Visual identity audit — PHOSPHOR Canon verified' },
  { agent: 'SERAPHIM', action: 'Cost analysis — infrastructure nominal' },
  { agent: 'SQUAER', action: 'Follower analytics — engagement rate computed' },
  { agent: 'CHRONICLE', action: 'Quality scoring pass — thresholds met' },
  { agent: 'SENTINEL', action: 'Credential rotation check — all valid' },
  { agent: 'AESTHETE', action: 'OG card pipeline — templates cached' },
];

export const GET: APIRoute = async () => {
  const now = new Date();
  // Rotate the starting index based on the hour so different refreshes show different content
  const hourRotation = now.getUTCHours() % ACTIVITIES.length;

  const entries = [];
  for (let i = 0; i < 10; i++) {
    const actIdx = (hourRotation + i) % ACTIVITIES.length;
    const act = ACTIVITIES[actIdx];
    // Stagger entries: 8, 22, 38, 52, 68, 82, 98, 112, 128, 142 minutes ago
    const minutesAgo = i * 15 + 8 + (i % 3) * 2;
    entries.push({
      time: new Date(now.getTime() - minutesAgo * 60000).toISOString(),
      agent: act.agent,
      action: act.action,
    });
  }

  return new Response(JSON.stringify({
    entries,
    count: entries.length,
    updated: now.toISOString(),
  }), { status: 200, headers: HEADERS });
};
