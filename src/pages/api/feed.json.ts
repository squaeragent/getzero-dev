export const prerender = false;
import fs from 'node:fs';
import path from 'node:path';

export async function GET() {
  const feedFile = path.join(process.cwd(), 'public/data/activity-feed.json');
  let feed: any[] = [];
  try {
    feed = JSON.parse(fs.readFileSync(feedFile, 'utf-8'));
  } catch {}

  return new Response(JSON.stringify({
    entries: feed.slice(0, 20),
    count: feed.length,
    timestamp: new Date().toISOString()
  }), { headers: { 'Content-Type': 'application/json' } });
}
