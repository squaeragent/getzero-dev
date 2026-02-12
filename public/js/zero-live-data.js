/*
 * ZERO OS — Live Data Feed
 * Polls /api/state.json every 60s
 * Updates any element with data-live="path.to.value"
 * Triggers counter animation on value change
 * Updates ticker, agent status, freshness indicators
 */
(function() {
  'use strict';

  const POLL_INTERVAL = 60000;
  const STATE_URL = '/api/state.json';
  let lastState = null;
  let pollTimer = null;

  // Deep get: resolve "x.followers" from nested object
  function getPath(obj, path) {
    return path.split('.').reduce((o, k) => (o && o[k] !== undefined) ? o[k] : null, obj);
  }

  // Format value for display
  function formatValue(value, format) {
    if (value === null || value === undefined) return '—';
    switch (format) {
      case 'currency':
        return '$' + Number(value).toLocaleString();
      case 'percent':
        return value + '%';
      case 'comma':
        return Number(value).toLocaleString();
      case 'timeago':
        return timeAgo(value);
      default:
        return String(value);
    }
  }

  // Relative time: "2m ago", "1h ago"
  function timeAgo(isoString) {
    const now = new Date();
    const then = new Date(isoString);
    const diffMs = now - then;
    const diffMin = Math.floor(diffMs / 60000);
    const diffHr = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHr / 24);
    if (diffMin < 1) return 'just now';
    if (diffMin < 60) return diffMin + 'm ago';
    if (diffHr < 24) return diffHr + 'h ago';
    return diffDay + 'd ago';
  }

  // Animate number change: old → new with counter tick
  function animateChange(el, oldVal, newVal, format) {
    const old = parseFloat(oldVal);
    const target = parseFloat(newVal);
    if (isNaN(old) || isNaN(target) || old === target) {
      el.textContent = formatValue(newVal, format);
      return;
    }
    el.classList.add('value-changed');
    setTimeout(() => el.classList.remove('value-changed'), 1500);
    const duration = 600;
    const start = performance.now();
    function tick(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(old + (target - old) * eased);
      el.textContent = formatValue(current, format);
      if (progress < 1) requestAnimationFrame(tick);
      else el.textContent = formatValue(target, format);
    }
    requestAnimationFrame(tick);
  }

  // Update all data-live elements
  function updateDOM(state) {
    // Auto-calculate day client-side for zero-staleness
    if (state.operational_since) {
      const start = new Date(state.operational_since + 'T00:00:00+07:00');
      const now = new Date();
      state.day = Math.floor((now - start) / 86400000);
    }

    const elements = document.querySelectorAll('[data-live]');
    elements.forEach(el => {
      const path = el.dataset.live;
      const format = el.dataset.format || null;
      const newVal = getPath(state, path);
      if (newVal === null) return;
      const oldVal = el.dataset.lastValue || el.textContent.trim();
      if (oldVal !== String(newVal) && lastState !== null) {
        animateChange(el, oldVal, newVal, format);
      } else if (lastState === null) {
        // First load — set directly without animation
        el.textContent = formatValue(newVal, format);
      }
      el.dataset.lastValue = String(newVal);
    });

    updateAgentStatus(state);
    updateTicker(state);
    updateFreshness(state);
  }

  // Agent heartbeat speed based on activity
  function updateAgentStatus(state) {
    if (!state.agents) return;
    Object.entries(state.agents).forEach(([name, agent]) => {
      const el = document.querySelector('[data-agent="' + name + '"]');
      if (!el) return;

      const activityEl = el.querySelector('.agent-activity');
      if (activityEl) {
        activityEl.textContent = agent.activity || 'idle';
      }

      const heartbeat = el.querySelector('.agent-heartbeat');
      if (heartbeat) {
        // Circadian-aware idle heartbeat
        const circadianIdle = (window.__circadianParams && window.__circadianParams.idleHeartbeat) || 3.0;
        switch (agent.activity) {
          case 'sweep':
          case 'posting':
          case 'processing':
          case 'scoring':
          case 'building':
            heartbeat.style.animationDuration = '1.2s';
            break;
          case 'monitoring':
          case 'reviewing':
            heartbeat.style.animationDuration = '2s';
            break;
          default:
            heartbeat.style.animationDuration = circadianIdle.toFixed(1) + 's';
        }
      }

      const statusEl = el.querySelector('.agent-status-dot');
      if (statusEl) {
        statusEl.dataset.status = agent.status;
      }
    });
  }

  // Rebuild ticker with fresh data
  function updateTicker(state) {
    const ticker = document.querySelector('[data-live-ticker]');
    if (!ticker) return;

    const items = [];
    if (state.x) {
      items.push('posts · ' + state.x.posts_shipped);
      items.push('followers · ' + state.x.followers);
    }
    if (state.content) {
      items.push(state.content.avg_quality_score + '/10 quality');
    }
    items.push('■ Day ' + state.day);
    items.push(Object.keys(state.agents || {}).length + ' agents live');
    if (state.revenue) {
      items.push('$' + state.revenue.total_earned + ' revenue');
    }
    if (state.intelligence) {
      items.push(state.intelligence.entities_tracked + ' entities tracked');
      if (state.intelligence.last_sweep_at) {
        items.push('last sweep: ' + timeAgo(state.intelligence.last_sweep_at));
      }
      if (state.intelligence.signals_today > 0) {
        items.push(state.intelligence.signals_today + ' signals today');
      }
    }

    const sep = '<span class="ticker-sep">│</span>';
    const html = items.map(i => '<span class="ticker-item">' + i + '</span>').join(sep);
    if (ticker.dataset.lastContent !== html) {
      ticker.innerHTML = html + sep + html;
      ticker.dataset.lastContent = html;
    }
  }

  // Show when data was last updated
  function updateFreshness(state) {
    const el = document.querySelector('[data-live-freshness]');
    if (!el || !state.generated_at) return;
    el.textContent = timeAgo(state.generated_at);
  }

  // Fetch and update
  async function poll() {
    try {
      const res = await fetch(STATE_URL, { cache: 'no-store' });
      if (!res.ok) return;
      const state = await res.json();
      updateDOM(state);
      lastState = state;
      window.__zeroState = state;
      document.dispatchEvent(new CustomEvent('zero-state-updated', { detail: state }));
      document.body.classList.remove('state-error');
    } catch (err) {
      console.warn('[ZERO] State fetch failed:', err.message);
      document.body.classList.add('state-error');
    }
  }

  // Start polling
  function init() {
    poll();
    pollTimer = setInterval(poll, POLL_INTERVAL);
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        clearInterval(pollTimer);
      } else {
        poll();
        pollTimer = setInterval(poll, POLL_INTERVAL);
      }
    });
  }

  // Inject styles for value change animation
  function injectStyles() {
    if (document.getElementById('zero-live-styles')) return;
    const style = document.createElement('style');
    style.id = 'zero-live-styles';
    style.textContent = [
      '@keyframes value-flash {',
      '  0% { color: var(--phosphor, #00ff41); text-shadow: 0 0 8px rgba(0,255,65,0.6); }',
      '  100% { color: inherit; text-shadow: none; }',
      '}',
      '.value-changed { animation: value-flash 1.5s ease-out; }',
      '[data-live] { font-variant-numeric: tabular-nums; }',
      '.state-error [data-live-freshness]::after { content: " ⚠"; opacity: 0.5; }'
    ].join('\n');
    document.head.appendChild(style);
  }

  // Boot
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() { injectStyles(); init(); });
  } else {
    injectStyles();
    init();
  }
})();
