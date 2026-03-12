import type { VercelRequest, VercelResponse } from '@vercel/node';
import crypto from 'crypto';

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

// Generate token from email (same method as send script)
function generateToken(email: string): string {
  return crypto.createHash('sha256').update(email).digest('hex');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { token } = req.query;
  
  if (!token || typeof token !== 'string') {
    return res.status(400).send('Invalid unsubscribe link');
  }
  
  try {
    // Fetch current subscribers
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
      return res.status(500).send('Failed to fetch subscriber list');
    }
    
    const ghData = await ghResponse.json();
    const content = Buffer.from(ghData.content, 'base64').toString('utf-8');
    const data: SubscribersData = JSON.parse(content);
    
    // Find subscriber by token (check all emails)
    const subscriber = data.subscribers.find(s => generateToken(s.email) === token);
    
    if (!subscriber) {
      return res.status(404).send('Unsubscribe link invalid');
    }
    
    if (subscriber.unsubscribed) {
      return res.redirect(307, '/brief?unsubscribed=already');
    }
    
    // Mark as unsubscribed
    subscriber.unsubscribed = true;
    subscriber.unsubscribed_at = new Date().toISOString();
    
    data.stats.unsubscribed = data.subscribers.filter(s => s.unsubscribed).length;
    data.stats.confirmed = data.subscribers.filter(s => s.confirmed && !s.unsubscribed).length;
    data.stats.last_updated = new Date().toISOString();
    
    // Save back to GitHub
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
          message: `Unsubscribe: ${subscriber.email}`,
          content: Buffer.from(JSON.stringify(data, null, 2)).toString('base64'),
          sha: ghData.sha,
        }),
      }
    );
    
    if (!updateResponse.ok) {
      return res.status(500).send('Failed to save unsubscribe');
    }
    
    // Redirect to confirmation page
    return res.redirect(307, '/brief?unsubscribed=true');
    
  } catch (error) {
    console.error('Unsubscribe error:', error);
    return res.status(500).send('Internal server error');
  }
}
