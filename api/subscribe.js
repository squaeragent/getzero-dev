export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email required' });
    }

    const response = await fetch(
      'https://api.beehiiv.com/v2/publications/pub_cc921b38-3409-4e7e-84b2-17638926e7ce/subscriptions',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.BEEHIIV_API_KEY}`
        },
        body: JSON.stringify({
          email,
          reactivate_existing: true,
          utm_source: 'getzero.dev'
        })
      }
    );

    const data = await response.json();

    if (response.ok) {
      return res.status(200).json({ success: true, status: data.data?.status });
    } else {
      return res.status(response.status).json({ error: data.message || 'Subscription failed' });
    }
  } catch (err) {
    return res.status(500).json({ error: 'Internal error' });
  }
}
