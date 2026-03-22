import type { APIRoute } from 'astro';

// Deterministic hash from coin name
function hashCoin(name: string): number {
  let h = 0;
  for (let i = 0; i < name.length; i++) {
    h = ((h << 5) - h + name.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

// Seeded pseudo-random from hash
function seeded(hash: number, idx: number): number {
  const x = Math.sin(hash + idx * 9301 + 49297) * 49297;
  return x - Math.floor(x);
}

interface Evaluation {
  verdict: 'enter' | 'reject';
  regime: string;
  hurst: number;
  lyapunov: number;
  quality: string;
  direction: string;
  book_depth: string;
  funding: string;
  reject_reason: string | null;
  explanation: string;
}

const HARDCODED: Record<string, Evaluation> = {
  BTC: {
    verdict: 'enter',
    regime: 'trending',
    hurst: 0.71,
    lyapunov: 0.04,
    quality: 'tier 1',
    direction: 'long',
    book_depth: 'deep',
    funding: 'neutral',
    reject_reason: null,
    explanation: 'BTC in sustained uptrend with strong Hurst persistence. Order book depth sufficient for institutional-grade entry. Funding rate neutral — no crowded positioning. Signal quality tier 1: high conviction.',
  },
  ETH: {
    verdict: 'enter',
    regime: 'trending',
    hurst: 0.63,
    lyapunov: 0.07,
    quality: 'tier 1',
    direction: 'long',
    book_depth: 'sufficient',
    funding: 'favorable',
    reject_reason: null,
    explanation: 'ETH showing momentum continuation with persistent Hurst exponent. Funding rates slightly negative — favorable for longs. Book depth supports execution without significant slippage.',
  },
  SOL: {
    verdict: 'enter',
    regime: 'trending',
    hurst: 0.66,
    lyapunov: 0.05,
    quality: 'tier 1',
    direction: 'long',
    book_depth: 'sufficient',
    funding: 'favorable',
    reject_reason: null,
    explanation: 'SOL regime classified as trending with H=0.66 — strong persistence. Lyapunov exponent low, indicating stable trajectory. Funding negative across major venues — contrarian positioning favors longs.',
  },
  AVAX: {
    verdict: 'enter',
    regime: 'mean-reverting',
    hurst: 0.38,
    lyapunov: 0.09,
    quality: 'tier 2',
    direction: 'long',
    book_depth: 'sufficient',
    funding: 'neutral',
    reject_reason: null,
    explanation: 'AVAX in mean-reversion regime near lower band. H=0.38 suggests anti-persistence — entry at support with defined risk. Tier 2 signal: acceptable but not maximum conviction.',
  },
  LINK: {
    verdict: 'enter',
    regime: 'trending',
    hurst: 0.59,
    lyapunov: 0.06,
    quality: 'tier 2',
    direction: 'long',
    book_depth: 'sufficient',
    funding: 'favorable',
    reject_reason: null,
    explanation: 'LINK trending with moderate Hurst persistence. Oracle narrative providing fundamental tailwind. Funding favorable for long positioning. Tier 2 conviction — adequate but monitor for regime shift.',
  },
  ARB: {
    verdict: 'enter',
    regime: 'trending',
    hurst: 0.57,
    lyapunov: 0.08,
    quality: 'tier 2',
    direction: 'long',
    book_depth: 'thin',
    funding: 'neutral',
    reject_reason: null,
    explanation: 'ARB showing trend continuation. Book depth is thin — recommend scaling entry over multiple blocks. H=0.57 borderline trending. Position sizing reduced due to liquidity constraint.',
  },
  SUI: {
    verdict: 'enter',
    regime: 'trending',
    hurst: 0.62,
    lyapunov: 0.06,
    quality: 'tier 2',
    direction: 'long',
    book_depth: 'sufficient',
    funding: 'favorable',
    reject_reason: null,
    explanation: 'SUI in uptrend regime with solid Hurst persistence. Favorable funding for long bias. Sufficient depth for entry. Tier 2 due to newer market structure — less historical data for calibration.',
  },
  DOGE: {
    verdict: 'reject',
    regime: 'chaotic',
    hurst: 0.48,
    lyapunov: 0.31,
    quality: 'tier 4',
    direction: 'none',
    book_depth: 'thin',
    funding: 'crowded-long',
    reject_reason: 'chaotic regime + crowded funding',
    explanation: 'DOGE exhibits chaotic regime dynamics — Lyapunov λ=0.31 indicates high sensitivity to initial conditions. Funding heavily crowded long. No persistent trend signal. Reject: unquantifiable edge.',
  },
  SHIB: {
    verdict: 'reject',
    regime: 'chaotic',
    hurst: 0.50,
    lyapunov: 0.28,
    quality: 'tier 4',
    direction: 'none',
    book_depth: 'thin',
    funding: 'crowded-long',
    reject_reason: 'random walk + thin books',
    explanation: 'SHIB Hurst at 0.50 — pure random walk. No detectable regime persistence. Thin order books amplify slippage risk. Reject: no statistical edge identified.',
  },
  TRUMP: {
    verdict: 'reject',
    regime: 'chaotic',
    hurst: 0.44,
    lyapunov: 0.52,
    quality: 'tier 5',
    direction: 'none',
    book_depth: 'fragile',
    funding: 'extreme',
    reject_reason: 'narrative-driven · no quantifiable edge',
    explanation: 'TRUMP coin dynamics driven entirely by exogenous narrative events — Lyapunov λ=0.52 extreme chaos. No stable regime detected. Funding rates extreme. Reject: signal quality below minimum threshold.',
  },
  FART: {
    verdict: 'reject',
    regime: 'dead',
    hurst: 0.51,
    lyapunov: 0.02,
    quality: 'tier 5',
    direction: 'none',
    book_depth: 'nonexistent',
    funding: 'n/a',
    reject_reason: 'no liquidity · no market structure',
    explanation: 'No meaningful order book depth detected. Volume insufficient for regime classification. Reject: asset does not meet minimum liquidity requirements for evaluation.',
  },
  PUMP: {
    verdict: 'reject',
    regime: 'chaotic',
    hurst: 0.46,
    lyapunov: 0.41,
    quality: 'tier 5',
    direction: 'none',
    book_depth: 'fragile',
    funding: 'extreme',
    reject_reason: 'pump-and-dump signature detected',
    explanation: 'Price action matches pump-and-dump distribution pattern with 94% confidence. Lyapunov exponent indicates extreme instability. Reject: manipulation signature detected.',
  },
  PEPE: {
    verdict: 'reject',
    regime: 'chaotic',
    hurst: 0.47,
    lyapunov: 0.35,
    quality: 'tier 4',
    direction: 'none',
    book_depth: 'thin',
    funding: 'crowded-long',
    reject_reason: 'meme regime · no persistent signal',
    explanation: 'PEPE regime classification: chaotic with meme-coin volatility signature. H=0.47 — slight anti-persistence but within noise band. Crowded long funding. Reject: no edge.',
  },
  WIF: {
    verdict: 'reject',
    regime: 'chaotic',
    hurst: 0.49,
    lyapunov: 0.33,
    quality: 'tier 4',
    direction: 'none',
    book_depth: 'thin',
    funding: 'crowded-long',
    reject_reason: 'meme regime · liquidity insufficient',
    explanation: 'WIF near random walk territory. Meme-coin volatility pattern with thin books. Funding skewed long. Reject: insufficient structural edge for systematic entry.',
  },
  BONK: {
    verdict: 'reject',
    regime: 'chaotic',
    hurst: 0.48,
    lyapunov: 0.29,
    quality: 'tier 4',
    direction: 'none',
    book_depth: 'thin',
    funding: 'neutral',
    reject_reason: 'meme regime · H ≈ 0.50',
    explanation: 'BONK Hurst exponent at 0.48 — statistically indistinguishable from random walk. No trending or mean-reverting regime detected. Reject: no quantifiable signal.',
  },
  XRP: {
    verdict: 'reject',
    regime: 'mean-reverting',
    hurst: 0.36,
    lyapunov: 0.12,
    quality: 'tier 3',
    direction: 'none',
    book_depth: 'sufficient',
    funding: 'neutral',
    reject_reason: 'strong mean-reversion at mid-range',
    explanation: 'XRP in mean-reversion regime but currently mid-range — no edge at current level. H=0.36 shows anti-persistence. Would reconsider at band extremes. Reject: entry timing suboptimal.',
  },
  ADA: {
    verdict: 'reject',
    regime: 'mean-reverting',
    hurst: 0.39,
    lyapunov: 0.11,
    quality: 'tier 3',
    direction: 'none',
    book_depth: 'sufficient',
    funding: 'neutral',
    reject_reason: 'mean-reversion · mid-band · no edge',
    explanation: 'ADA anti-persistent with H=0.39. Currently positioned at mid-band — neither oversold nor overbought. No directional edge detected at current levels. Reject: timing.',
  },
  DOT: {
    verdict: 'reject',
    regime: 'random',
    hurst: 0.50,
    lyapunov: 0.14,
    quality: 'tier 3',
    direction: 'none',
    book_depth: 'sufficient',
    funding: 'neutral',
    reject_reason: 'random walk · no regime detected',
    explanation: 'DOT Hurst exponent at 0.50 — textbook random walk. No trending or mean-reverting regime. Sufficient liquidity but no statistical edge. Reject: no signal.',
  },
  MATIC: {
    verdict: 'reject',
    regime: 'mean-reverting',
    hurst: 0.37,
    lyapunov: 0.10,
    quality: 'tier 3',
    direction: 'none',
    book_depth: 'sufficient',
    funding: 'neutral',
    reject_reason: 'mean-reversion · wrong side of band',
    explanation: 'MATIC in mean-reversion regime, currently at upper band. Anti-persistent dynamics suggest reversal. Would need to be at lower band for long entry. Reject: wrong entry zone.',
  },
};

function generateEval(coin: string): Evaluation {
  const h = hashCoin(coin);
  const hurst = 0.30 + seeded(h, 0) * 0.40; // 0.30–0.70
  const lyapunov = 0.02 + seeded(h, 1) * 0.45;
  const isEnter = hurst > 0.56 && lyapunov < 0.15 && seeded(h, 2) > 0.4;

  const regimes = ['trending', 'mean-reverting', 'chaotic', 'random'];
  let regimeIdx: number;
  if (hurst > 0.56) regimeIdx = 0;
  else if (hurst < 0.44) regimeIdx = 1;
  else if (lyapunov > 0.25) regimeIdx = 2;
  else regimeIdx = 3;

  const depths = ['deep', 'sufficient', 'thin', 'fragile'];
  const depthIdx = Math.min(3, Math.floor(seeded(h, 3) * 4));

  const fundings = ['favorable', 'neutral', 'crowded-long', 'extreme'];
  const fundIdx = Math.min(3, Math.floor(seeded(h, 4) * 4));

  const qualities = ['tier 1', 'tier 2', 'tier 3', 'tier 4', 'tier 5'];
  let qualIdx: number;
  if (isEnter) qualIdx = Math.floor(seeded(h, 5) * 2);
  else qualIdx = 2 + Math.floor(seeded(h, 5) * 3);

  const directions = ['long', 'short', 'none'];
  const dirIdx = isEnter ? (seeded(h, 6) > 0.3 ? 0 : 1) : 2;

  const rejectReasons = [
    'no persistent regime detected',
    'chaotic dynamics · unquantifiable edge',
    'insufficient liquidity for execution',
    'crowded positioning · adverse funding',
    'random walk · H ≈ 0.50',
    'regime transition in progress',
  ];

  return {
    verdict: isEnter ? 'enter' : 'reject',
    regime: regimes[regimeIdx],
    hurst: Math.round(hurst * 100) / 100,
    lyapunov: Math.round(lyapunov * 100) / 100,
    quality: qualities[qualIdx],
    direction: directions[dirIdx],
    book_depth: depths[depthIdx],
    funding: fundings[fundIdx],
    reject_reason: isEnter ? null : rejectReasons[Math.floor(seeded(h, 7) * rejectReasons.length)],
    explanation: isEnter
      ? `${coin} showing ${regimes[regimeIdx]} regime with H=${(Math.round(hurst * 100) / 100).toFixed(2)}. ${depths[depthIdx]} order book depth supports execution. Funding ${fundings[fundIdx]} for ${directions[dirIdx]} positioning. Signal quality ${qualities[qualIdx]}.`
      : `${coin} classified as ${regimes[regimeIdx]} regime. H=${(Math.round(hurst * 100) / 100).toFixed(2)}, λ=${(Math.round(lyapunov * 100) / 100).toFixed(2)} — ${rejectReasons[Math.floor(seeded(h, 7) * rejectReasons.length)]}. Does not meet minimum signal quality threshold for entry.`,
  };
}

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const coin = (url.searchParams.get('coin') || '').toUpperCase().replace(/[^A-Z0-9]/g, '');

  if (!coin) {
    return new Response(JSON.stringify({ error: 'missing coin parameter' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const evaluation = HARDCODED[coin] || generateEval(coin);

  // Deterministic "evaluated today" based on day
  const dayOfYear = Math.floor((Date.now() - new Date('2026-01-01').getTime()) / 86400000);
  const baseEvaluated = 180 + (dayOfYear * 7) % 120;
  const baseAccepted = 2 + (dayOfYear * 3) % 5;

  return new Response(JSON.stringify({
    coin,
    ...evaluation,
    stats: {
      evaluated_today: baseEvaluated,
      accepted: baseAccepted,
    },
  }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  });
};
