import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Resend } from 'resend';
import crypto from 'crypto';

// This replaces the Beehiiv subscribe endpoint
// Stores subscribers in git-tracked JSON (via GitHub API or webhook)

const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || '';
const REPO = 'squaeragent/cluster-memory';
const SUBSCRIBERS_PATH = 'products/intelligence-brief/subscribers.json';

interface Subscriber {
  email: string;
  confirmed: boolean;
  subscribed_at: string;
  source: string;
  confirmation_token?: string;
  unsubscribed: boolean;
  unsubscribed_at: string | null;
}

interface SubscribersData {
  subscribers: Subscriber[];
  stats: {
    total: number;
    confirmed: number;
    unsubscribed: number;
    last_updated: string;
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  const { email } = req.body as { email?: string };
  
  // Validate email
  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return res.status(400).json({ error: 'Invalid email' });
  }
  
  const cleanEmail = email.trim().toLowerCase();
  
  // Generate confirmation token
  const confirmToken = crypto.randomBytes(32).toString('hex');
  
  try {
    // Fetch current subscribers from GitHub
    const ghResponse = await fetch(
      `https://api.github.com/repos/${REPO}/contents/${SUBSCRIBERS_PATH}`,
      {
        headers: {
          'Authorization': `Bearer ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      }
    );
    
    if (!ghResponse.ok) {
      console.error('GitHub fetch failed:', await ghResponse.text());
      return res.status(500).json({ error: 'Failed to fetch subscriber list' });
    }
    
    const ghData = await ghResponse.json();
    const content = Buffer.from(ghData.content, 'base64').toString('utf-8');
    const data: SubscribersData = JSON.parse(content);
    
    // Check if already subscribed
    const existing = data.subscribers.find(s => s.email === cleanEmail);
    
    if (existing && existing.confirmed) {
      return res.status(200).json({ message: 'Already subscribed', status: 'confirmed' });
    }
    
    if (existing && !existing.confirmed) {
      return res.status(200).json({ message: 'Check your email for confirmation link', status: 'pending' });
    }
    
    // Add new subscriber (unconfirmed)
    const newSubscriber: Subscriber = {
      email: cleanEmail,
      confirmed: false,
      subscribed_at: new Date().toISOString(),
      source: 'website',
      confirmation_token: confirmToken,
      unsubscribed: false,
      unsubscribed_at: null,
    };
    
    data.subscribers.push(newSubscriber);
    data.stats.total = data.subscribers.length;
    data.stats.confirmed = data.subscribers.filter(s => s.confirmed).length;
    data.stats.unsubscribed = data.subscribers.filter(s => s.unsubscribed).length;
    data.stats.last_updated = new Date().toISOString();
    
    // Commit back to GitHub
    const updateResponse = await fetch(
      `https://api.github.com/repos/${REPO}/contents/${SUBSCRIBERS_PATH}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: `Subscribe: ${cleanEmail}`,
          content: Buffer.from(JSON.stringify(data, null, 2)).toString('base64'),
          sha: ghData.sha,
        }),
      }
    );
    
    if (!updateResponse.ok) {
      console.error('GitHub update failed:', await updateResponse.text());
      return res.status(500).json({ error: 'Failed to save subscription' });
    }
    
    // Send confirmation email via Resend
    const resend = new Resend(RESEND_API_KEY);
    const confirmUrl = `https://getzero.dev/api/confirm?token=${confirmToken}`;
    
    await resend.emails.send({
      from: 'ZERO Intelligence <intelligence@getzero.dev>',
      to: cleanEmail,
      subject: 'Confirm your subscription — ZERO Intelligence Brief',
      html: `
        <div style="font-family: monospace; background: #0a0a0a; color: #e8e4df; padding: 40px 24px;">
          <pre style="color: #c8ff00; font-size: 12px;">
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 ZERO INTELLIGENCE BRIEF
━━━━━━━━━━━━━━━━━━━━━━━━━━━━</pre>
          <p style="margin: 24px 0;">You requested to subscribe to ZERO Intelligence Brief.</p>
          <p style="margin: 24px 0;">Click to confirm:</p>
          <p style="margin: 24px 0;">
            <a href="${confirmUrl}" style="color: #c8ff00; text-decoration: none; font-weight: bold;">
              → CONFIRM SUBSCRIPTION
            </a>
          </p>
          <p style="margin: 24px 0; font-size: 12px; color: #6b6660;">
            If you didn't request this, ignore this email.
          </p>
          <div style="margin-top: 40px; padding-top: 24px; border-top: 1px solid #1a1a1a; font-size: 11px; color: #6b6660;">
            ZERO Intelligence<br>
            intelligence@getzero.dev
          </div>
        </div>
      `,
      text: `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 ZERO INTELLIGENCE BRIEF
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

You requested to subscribe to ZERO Intelligence Brief.

Confirm your subscription:
${confirmUrl}

If you didn't request this, ignore this email.

ZERO Intelligence
intelligence@getzero.dev
      `,
    });
    
    return res.status(200).json({ 
      message: 'Check your email for confirmation link',
      status: 'pending',
    });
    
  } catch (error) {
    console.error('Subscribe error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
