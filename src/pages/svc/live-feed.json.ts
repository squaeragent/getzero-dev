export const prerender = false;

import type { APIRoute } from 'astro';
import fs from 'node:fs';
import path from 'node:path';

const HEADERS = {
  'Content-Type': 'application/json',
  'Cache-Control': 's-maxage=30, stale-while-revalidate=60',
  'Access-Control-Allow-Origin': '*',
};

export const GET: APIRoute = async () => {
  try {
    const dataPath = path.join(process.cwd(), 'public', 'data', 'live-feed.json');
    const raw = fs.readFileSync(dataPath, 'utf-8');
    const data = JSON.parse(raw);
    data.server_time = new Date().toISOString();
    return new Response(JSON.stringify(data), { status: 200, headers: HEADERS });
  } catch (e: any) {
    // Filesystem read failed — return empty feed instead of 500
    // Client JS will show "no recent events" gracefully
    return new Response(
      JSON.stringify({
        entries: [],
        metadata: { updated: new Date().toISOString(), count: 0 },
      }),
      { status: 200, headers: HEADERS }
    );
  }
};
