export const prerender = false;

export async function GET() {
  return new Response(JSON.stringify({ method: 'GET', ok: true }), {
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
  });
}

export async function POST() {
  return new Response(JSON.stringify({ method: 'POST', ok: true }), {
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
  });
}
