export const prerender = false;

export async function GET() {
  return new Response(JSON.stringify({ pong: true, ts: Date.now() }), {
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
  });
}
