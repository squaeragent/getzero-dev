export const prerender = false;
import fs from 'node:fs';
import path from 'node:path';

export async function GET() {
  const predFile = path.join(process.cwd(), 'public/data/predictions.json');
  let data: any = { predictions: [], stats: {} };
  try {
    data = JSON.parse(fs.readFileSync(predFile, 'utf-8'));
  } catch {}

  return new Response(JSON.stringify({
    predictions: data.predictions,
    stats: data.stats,
    timestamp: new Date().toISOString()
  }), { headers: { 'Content-Type': 'application/json' } });
}
