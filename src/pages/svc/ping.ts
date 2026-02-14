export const prerender = false;

import type { APIRoute } from 'astro';

export const GET: APIRoute = async () => {
  return new Response(JSON.stringify({ pong: true, path: '/svc/ping', ts: Date.now() }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
