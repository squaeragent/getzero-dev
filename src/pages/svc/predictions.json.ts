export const prerender = false;

import type { APIRoute } from 'astro';
import fs from 'node:fs';
import path from 'node:path';

const HEADERS = {
  'Content-Type': 'application/json',
  'Cache-Control': 's-maxage=300, stale-while-revalidate=600',
  'Access-Control-Allow-Origin': '*',
};

export const GET: APIRoute = async () => {
  try {
    const dataPath = path.join(process.cwd(), 'public', 'data', 'predictions.json');
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
    return new Response(JSON.stringify(data), { status: 200, headers: HEADERS });
  } catch (e) {
    return new Response(JSON.stringify({ error: 'predictions data not found' }), { status: 500, headers: HEADERS });
  }
};
