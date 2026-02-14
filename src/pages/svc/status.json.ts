export const prerender = false;
import fs from 'node:fs';
import path from 'node:path';

export async function GET() {
  const stateFile = path.join(process.cwd(), 'public/data/state.json');
  const metricsFile = path.join(process.cwd(), 'public/data/metrics.json');

  const state = JSON.parse(fs.readFileSync(stateFile, 'utf-8'));
  const metrics = JSON.parse(fs.readFileSync(metricsFile, 'utf-8'));

  return new Response(JSON.stringify({
    status: 'operational',
    agents: { active: 4, total: 5 },
    metrics,
    state,
    timestamp: new Date().toISOString()
  }), { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
}
