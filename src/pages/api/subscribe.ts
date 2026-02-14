export const prerender = false;

export async function POST({ request }: { request: Request }) {
  try {
    const { email } = await request.json();
    if (!email || !email.includes('@')) {
      return new Response(JSON.stringify({ error: 'Invalid email' }), { status: 400 });
    }

    const res = await fetch('https://api.beehiiv.com/v2/publications/pub_cc921b38/subscriptions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.BEEHIIV_API_KEY || process.env.BEEHIIV_API_KEY}`
      },
      body: JSON.stringify({
        email,
        reactivate_existing: true,
        send_welcome_email: true,
        utm_source: 'getzero.dev',
        utm_medium: 'website'
      })
    });

    if (res.ok) {
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    }
    const err = await res.text();
    return new Response(JSON.stringify({ error: 'Subscription failed' }), { status: 500 });
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 });
  }
}
