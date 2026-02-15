export const prerender = false;

/**
 * /svc/feed.json — Real agent activity feed
 * Reads from public/data/feed.json (synced from Cluster_Memory every 5 min).
 * Falls back to empty feed if no data yet.
 */

import type { APIRoute } from 'astro';
import fs from 'node:fs';
import path from 'node:path';

const HEADERS = {
  'Content-Type': 'application/json',
  'Cache-Control': 's-maxage=30, stale-while-revalidate=120',
  'Access-Control-Allow-Origin': '*',
};

export const GET: APIRoute = async () => {
  try {
    const feedPath = path.join(process.cwd(), 'public', 'data', 'feed.json');
    if (fs.existsSync(feedPath)) {
      const raw = fs.readFileSync(feedPath, 'utf-8');
      const data = JSON.parse(raw);
      // Add server timestamp for freshness checks
      data.server_time = new Date().toISOString();
      return new Response(JSON.stringify(data), { status: 200, headers: HEADERS });
    }

    // No feed yet — return empty
    return new Response(JSON.stringify({
      metadata: { updated: new Date().toISOString(), count: 0, version: 2 },
      events: [],
      server_time: new Date().toISOString(),
    }), { status: 200, headers: HEADERS });
  } catch (e: any) {
    return new Response(JSON.stringify({
      error: 'Feed unavailable',
      detail: e.message,
    }), { status: 500, headers: HEADERS });
  }
};
