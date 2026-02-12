/*
 * ZERO OS — Living Text Engine
 * Pre-authored text that rewrites itself based on system state.
 * Character-level phosphor dissolve + typewriter retype.
 * CHRONICLE authors all variants. No runtime LLM calls.
 */
(function() {
  'use strict';

  const RESPECT_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Timing constants
  const DISSOLVE_RATE = 25;      // ms per character (right to left)
  const CURSOR_BLINKS = 2;       // blinks between dissolve and retype
  const CURSOR_BLINK_MS = 530;   // ms per blink cycle
  const TYPE_RATE = 30;          // ms per character (left to right)
  const CHAR_SETTLE_MS = 80;     // ms before arriving char settles
  const DISSOLVE_STAGES = {
    dissolving: 60,  // ms at dim stage
    ghost: 40,       // ms at ghost stage
  };

  // Track active zones
  const activeZones = new Map();
  let currentState = null;
  let isPageVisible = true;
  let globalAnimating = false; // Only one zone at a time

  // Deep get: resolve "x.followers" from nested object
  function getPath(obj, path) {
    return path.split('.').reduce((o, k) => (o && o[k] !== undefined) ? o[k] : null, obj);
  }

  // Relative time
  function timeAgo(iso) {
    const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
    if (diff < 1) return 'just now';
    if (diff < 60) return diff + 'm ago';
    if (diff < 1440) return Math.floor(diff / 60) + 'h ago';
    return Math.floor(diff / 1440) + 'd ago';
  }

  // Resolve {path.to.value} and ${path} template tokens
  function resolveTemplate(text, state) {
    if (!state) return text;

    // Handle ${path} (currency)
    text = text.replace(/\$\{([^}]+)\}/g, function(_, path) {
      var val = getPath(state, path);
      return val !== null ? '$' + Number(val).toLocaleString() : '$—';
    });

    // Handle {path|format}
    text = text.replace(/\{([^}|]+)\|([^}]+)\}/g, function(_, path, format) {
      var val = getPath(state, path);
      if (val === null) return '—';
      if (format === 'timeago') return timeAgo(val);
      return String(val);
    });

    // Handle {path} (plain)
    text = text.replace(/\{([^}]+)\}/g, function(_, path) {
      var val = getPath(state, path);
      return val !== null ? String(val) : '—';
    });

    return text;
  }

  // Evaluate conditions against current state
  function conditionsMet(conditions, state) {
    if (!conditions || conditions.default) return true;
    if (!state) return false;

    for (var key in conditions) {
      if (!conditions.hasOwnProperty(key)) continue;
      var value = conditions[key];
      if (key === 'default') continue;

      if (key === 'min_followers' && (getPath(state, 'x.followers') || 0) < value) return false;
      if (key === 'min_revenue' && (getPath(state, 'revenue.total_earned') || 0) < value) return false;
      if (key === 'max_revenue' && (getPath(state, 'revenue.total_earned') || 0) > value) return false;
      if (key === 'min_day' && (state.day || 0) < value) return false;
      if (key === 'min_entities' && (getPath(state, 'intelligence.entities_tracked') || 0) < value) return false;
      if (key === 'min_signals_today' && (getPath(state, 'intelligence.signals_today') || 0) < value) return false;
      if (key === 'min_posts' && (getPath(state, 'x.posts_shipped') || 0) < value) return false;
      if (key === 'min_subscribers' && (getPath(state, 'content.newsletter_subscribers') || 0) < value) return false;
      if (key === 'min_content' && (getPath(state, 'content.pieces_published') || 0) < value) return false;
      if (key === 'min_dispatches' && (getPath(state, 'content.dispatches_sent') || 0) < value) return false;
      if (key === 'min_predictions' && (getPath(state, 'intelligence.predictions_active') || 0) < value) return false;
      if (key === 'min_entries_today' && (getPath(state, 'journal.entries_today') || 0) < value) return false;

      if (key === 'agent_active') {
        var agent = getPath(state, 'agents.' + value);
        if (!agent || agent.activity === 'idle') return false;
      }
      if (key === 'activity') {
        var agentName = conditions.agent_active;
        if (agentName) {
          var agentObj = getPath(state, 'agents.' + agentName);
          if (!agentObj || agentObj.activity !== value) return false;
        }
      }
      if (key === 'time_range') {
        var hour = new Date().getHours();
        if (hour < value[0] || hour > value[1]) return false;
      }
    }
    return true;
  }

  // Select next variant
  function selectVariant(variantSet, currentText, state) {
    var eligible = variantSet.variants.filter(function(v) {
      var resolved = resolveTemplate(v.text, state);
      return conditionsMet(v.conditions, state) && resolved !== currentText;
    });

    if (eligible.length === 0) return null;

    // Weighted random selection
    var weighted = eligible.map(function(v) {
      return {
        variant: v,
        weight: v.conditions && v.conditions.milestone ? 2.0 :
                v.conditions && v.conditions.default ? 0.5 : 1.0
      };
    });

    var totalWeight = weighted.reduce(function(sum, w) { return sum + w.weight; }, 0);
    var random = Math.random() * totalWeight;

    for (var i = 0; i < weighted.length; i++) {
      random -= weighted[i].weight;
      if (random <= 0) return resolveTemplate(weighted[i].variant.text, state);
    }
    return resolveTemplate(eligible[0].text, state);
  }

  // ==========================================
  // CHARACTER-LEVEL ANIMATIONS
  // ==========================================

  // Dissolve text right to left
  function dissolveText(element) {
    return new Promise(function(resolve) {
      if (RESPECT_MOTION) {
        element.textContent = '';
        resolve();
        return;
      }

      var text = element.textContent;
      if (!text) { resolve(); return; }

      // Wrap each character in a span
      element.innerHTML = '';
      var chars = [];
      for (var c = 0; c < text.length; c++) {
        var span = document.createElement('span');
        span.className = 'lt-char';
        span.textContent = text[c];
        element.appendChild(span);
        chars.push(span);
      }

      // Dissolve right to left
      var idx = chars.length - 1;
      function dissolveNext() {
        if (idx < 0) {
          element.innerHTML = '';
          resolve();
          return;
        }
        var ch = chars[idx];
        ch.classList.add('dissolving');
        setTimeout(function() {
          ch.classList.remove('dissolving');
          ch.classList.add('ghost');
          setTimeout(function() {
            ch.classList.add('gone');
            idx--;
            dissolveNext();
          }, DISSOLVE_STAGES.ghost);
        }, DISSOLVE_STAGES.dissolving);
      }

      setTimeout(dissolveNext, 50);
    });
  }

  // Show blinking cursor
  function showCursor(element, blinks) {
    return new Promise(function(resolve) {
      if (RESPECT_MOTION) { resolve(); return; }

      var cursor = document.createElement('span');
      cursor.className = 'lt-cursor';
      cursor.textContent = '\u2588'; // █
      element.appendChild(cursor);

      setTimeout(function() {
        cursor.remove();
        resolve();
      }, blinks * CURSOR_BLINK_MS * 2);
    });
  }

  // Type new text left to right
  function typeText(element, newText) {
    return new Promise(function(resolve) {
      if (RESPECT_MOTION) {
        element.textContent = newText;
        resolve();
        return;
      }

      element.innerHTML = '';
      var chars = [];

      var cursor = document.createElement('span');
      cursor.className = 'lt-cursor';
      cursor.textContent = '\u2588';

      var i = 0;
      function typeNext() {
        if (i >= newText.length) {
          cursor.remove();
          chars.forEach(function(c) {
            c.classList.remove('arriving');
            c.classList.add('settled');
          });
          setTimeout(resolve, 100);
          return;
        }

        if (i > 0) {
          chars[i - 1].classList.remove('arriving');
          chars[i - 1].classList.add('settled');
        }

        var span = document.createElement('span');
        span.className = 'lt-char arriving';
        span.textContent = newText[i];
        element.insertBefore(span, cursor);
        chars.push(span);

        i++;
        setTimeout(typeNext, TYPE_RATE);
      }

      element.appendChild(cursor);
      setTimeout(typeNext, TYPE_RATE);
    });
  }

  // Full transition: dissolve → cursor → retype
  function transitionText(element, newText) {
    var zone = element.closest('.living-zone');
    if (zone) zone.classList.add('active');
    globalAnimating = true;

    return dissolveText(element).then(function() {
      return showCursor(element, CURSOR_BLINKS);
    }).then(function() {
      return typeText(element, newText);
    }).then(function() {
      globalAnimating = false;
      if (zone) {
        setTimeout(function() { zone.classList.remove('active'); }, 1000);
      }
    });
  }

  // ==========================================
  // ZONE MANAGEMENT
  // ==========================================

  function initZone(element) {
    var zoneId = element.dataset.livingZone;
    if (!zoneId || activeZones.has(zoneId)) return;

    var variantSet = null;
    try {
      if (element.dataset.variants) {
        variantSet = { variants: JSON.parse(element.dataset.variants) };
      }
    } catch(e) {
      variantSet = null;
    }

    var textEl = element.querySelector('.living-text') || element;

    var zone = {
      element: textEl,
      zoneId: zoneId,
      variantSet: variantSet,
      currentText: textEl.textContent.trim(),
      interval: parseInt(element.dataset.cycleInterval, 10) || 45,
      timer: null,
      isAnimating: false,
    };

    activeZones.set(zoneId, zone);
  }

  function startZoneCycle(zone) {
    if (zone.timer) clearInterval(zone.timer);

    zone.timer = setInterval(function() {
      if (!isPageVisible) return;
      if (zone.isAnimating) return;
      if (globalAnimating) return; // Only one zone at a time

      // Get variant set from state if not inline
      var variants = zone.variantSet ||
        (currentState && currentState.living_text && currentState.living_text[zone.zoneId]);

      if (!variants) return;

      var newText = selectVariant(variants, zone.currentText, currentState);
      if (!newText || newText === zone.currentText) return;

      zone.isAnimating = true;
      transitionText(zone.element, newText).then(function() {
        zone.currentText = newText;
        zone.isAnimating = false;
      });
    }, zone.interval * 1000);
  }

  // Coordinate zones — stagger by 8s so they don't overlap
  function coordinateZones() {
    var zones = Array.from(activeZones.values());
    if (zones.length === 0) return;

    zones.forEach(function(zone, i) {
      clearInterval(zone.timer);
      setTimeout(function() {
        startZoneCycle(zone);
      }, i * 8000);
    });
  }

  // ==========================================
  // INIT
  // ==========================================

  function init() {
    document.querySelectorAll('[data-living-zone]').forEach(initZone);
    coordinateZones();

    // Listen for state updates from live data feed
    document.addEventListener('zero-state-updated', function(e) {
      currentState = e.detail;
    });

    if (window.__zeroState) {
      currentState = window.__zeroState;
    }

    document.addEventListener('visibilitychange', function() {
      isPageVisible = !document.hidden;
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
