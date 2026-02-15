/**
 * PHOSPHOR Phase 4 — Micro-interactions
 * Count-up hero numerals, typewriter headers, scanline sweep on sections.
 * Lightweight: no dependencies, IntersectionObserver-based, respects prefers-reduced-motion.
 */
(function () {
  'use strict';

  // Respect user preference
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  // ─── 1. HERO NUMERAL COUNT-UP ───
  // Animates hero numbers from 0 to target when they scroll into view.
  function countUp(el) {
    const raw = el.textContent.trim();
    // Extract the numeric part (e.g., "103.5" from "103.5/200")
    const suffixEl = el.querySelector('.hero-num__suffix');
    const suffix = suffixEl ? suffixEl.textContent : '';
    const numText = raw.replace(suffix, '').trim();
    const target = parseFloat(numText);

    if (isNaN(target) || target === 0) return;

    const hasDecimal = numText.includes('.');
    const decimals = hasDecimal ? (numText.split('.')[1] || '').length : 0;
    const duration = 1200; // ms
    const start = performance.now();

    el.style.opacity = '1';

    function tick(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = target * eased;

      // Build display string
      const display = hasDecimal ? current.toFixed(decimals) : Math.round(current).toString();

      // Preserve suffix element
      if (suffixEl) {
        el.childNodes[0].textContent = display;
      } else {
        el.textContent = display;
      }

      if (progress < 1) {
        requestAnimationFrame(tick);
      } else {
        // Final value — ensure exact
        if (suffixEl) {
          el.childNodes[0].textContent = numText;
        } else {
          el.textContent = numText;
        }
      }
    }

    requestAnimationFrame(tick);
  }

  // ─── 2. BAR GAUGE FILL ───
  // Bars start empty, fill character by character when visible.
  function fillBar(el) {
    const track = el.querySelector('[class*="bar-gauge__track"]');
    if (!track) return;

    const finalText = track.textContent;
    const filledCount = (finalText.match(/█/g) || []).length;
    const emptyCount = (finalText.match(/░/g) || []).length;
    const total = filledCount + emptyCount;
    if (total === 0) return;

    let current = 0;
    const interval = 40; // ms per character
    track.textContent = '░'.repeat(total);

    const timer = setInterval(function () {
      current++;
      if (current <= filledCount) {
        track.textContent = '█'.repeat(current) + '░'.repeat(total - current);
      } else {
        track.textContent = finalText;
        clearInterval(timer);
      }
    }, interval);
  }

  // ─── 3. SCANLINE SWEEP ───
  // A horizontal phosphor line sweeps across a section when it enters view.
  function scanlineSweep(el) {
    const line = document.createElement('div');
    line.style.cssText =
      'position:absolute;left:0;right:0;height:1px;' +
      'background:linear-gradient(90deg,transparent,var(--phosphor,#c8ff00),transparent);' +
      'opacity:0.4;top:0;pointer-events:none;z-index:10;' +
      'transition:top 0.6s cubic-bezier(0.25,0.46,0.45,0.94),opacity 0.3s ease;';

    // Need relative positioning on parent
    var pos = getComputedStyle(el).position;
    if (pos === 'static') el.style.position = 'relative';
    el.style.overflow = 'hidden';

    el.appendChild(line);

    // Sweep from top to bottom
    requestAnimationFrame(function () {
      line.style.top = el.offsetHeight + 'px';
      line.style.opacity = '0';
    });

    // Remove after animation
    setTimeout(function () {
      if (line.parentNode) line.parentNode.removeChild(line);
    }, 800);
  }

  // ─── 4. STATUS DOT ENTRANCE ───
  // Dots start invisible, fade in with a brief glow flash.
  function dotEntrance(el) {
    var char = el.querySelector('[class*="status-dot__char"]');
    if (!char) return;
    char.style.transition = 'opacity 0.3s ease, text-shadow 0.3s ease';
    char.style.opacity = '0';
    requestAnimationFrame(function () {
      char.style.opacity = '1';
      char.style.textShadow = '0 0 12px currentColor';
      setTimeout(function () {
        char.style.textShadow = '';
      }, 400);
    });
  }

  // ─── INTERSECTION OBSERVER SETUP ───
  var observed = new WeakSet();

  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      var el = entry.target;
      if (observed.has(el)) return;
      observed.add(el);

      // Hero numerals
      if (el.classList.contains('hero-num__value')) {
        countUp(el);
      }
      // Bar gauges
      if (el.classList.contains('bar-gauge')) {
        fillBar(el);
      }
      // Data panels — scanline sweep
      if (el.classList.contains('data-panel')) {
        scanlineSweep(el);
      }
      // Status dots
      if (el.classList.contains('status-dot')) {
        dotEntrance(el);
      }
    });
  }, { threshold: 0.2, rootMargin: '0px 0px -50px 0px' });

  // ─── INIT ───
  function init() {
    // Hero numerals — target the value element
    document.querySelectorAll('.hero-num__value').forEach(function (el) {
      observer.observe(el);
    });
    // Bar gauges — only top-level containers
    document.querySelectorAll('.bar-gauge').forEach(function (el) {
      observer.observe(el);
    });
    // Data panels — only top-level
    document.querySelectorAll('.data-panel').forEach(function (el) {
      if (!el.parentElement || !el.parentElement.classList.contains('data-panel__body')) {
        observer.observe(el);
      }
    });
    // Status dots
    document.querySelectorAll('.status-dot').forEach(function (el) {
      observer.observe(el);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
