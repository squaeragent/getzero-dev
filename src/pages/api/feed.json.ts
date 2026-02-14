export const prerender = false;
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const feedPath = path.join(process.cwd(), 'public/data/activity-feed.json');
    if (fs.existsSync(feedPath)) {
      const feed = JSON.parse(fs.readFileSync(feedPath, 'utf-8'));
      const entries = (feed.entries || feed || []).slice(0, 20);
      return new Response(JSON.stringify({ entries, timestamp: new Date().toISOString() }), {
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=30' }
      });
    }
    return new Response(JSON.stringify({ entries: [], timestamp: new Date().toISOString() }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: 'feed unavailable' }), { status: 500 });
  }
}
