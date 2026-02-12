/* ============================================
   ZERO OS — CRT DYNAMIC EFFECTS
   Vanilla JS. No dependencies. No frameworks.
   
   Effects:
   1. Boot sequence typewriter
   2. MEM TEST progress bar fill
   3. Number counter animation
   4. Ticker scroll
   5. Random signal glitch
   
   Usage: 
   <script src="zero-crt-dynamics.js" defer></script>
   ============================================ */

(function () {
  'use strict';

  /* ----------------------------------------
     CONFIG
     ---------------------------------------- */
  const CONFIG = {
    boot: {
      charDelay: 18,       // ms per character
      lineDelay: 120,      // ms pause between lines
      okDelay: 200,        // ms before OK appears
      enabled: true,       // set false to skip boot animation
      sessionKey: 'zero-booted' // only play once per session
    },
    counter: {
      duration: 800,       // ms to count from 0 to target
      stagger: 80,         // ms between each counter starting
    },
    ticker: {
      speed: 40,           // px per second
      gap: 80,             // px between ticker items
    },
    glitch: {
      minInterval: 28000,  // ms minimum between glitches
      maxInterval: 52000,  // ms maximum between glitches
    },
    memBar: {
      fillDuration: 500,   // ms to fill the progress bar
    }
  };


  /* ----------------------------------------
     1. BOOT SEQUENCE TYPEWRITER
     
     Markup expected:
     <div class="boot-sequence" data-boot>
       <div class="boot-line" data-text="BIOS POST ............ " data-ok="OK"></div>
       <div class="boot-line" data-text="MEM TEST: 96GB " data-ok="OK" data-membar></div>
       <div class="boot-line" data-text="GPU: M3 ULTRA 76-CORE " data-ok="OK"></div>
     </div>
     
     Lines type out character by character.
     OK appears in green after each line completes.
     Only plays once per session.
     ---------------------------------------- */

  function initBootSequence() {
    if (!CONFIG.boot.enabled) return;

    const container = document.querySelector('[data-boot]');
    if (!container) return;

    // Only play once per session
    if (sessionStorage.getItem(CONFIG.boot.sessionKey)) {
      // Show everything instantly
      container.querySelectorAll('.boot-line').forEach(line => {
        line.style.opacity = '1';
        line.style.visibility = 'visible';
      });
      return;
    }

    const lines = container.querySelectorAll('.boot-line');

    // Hide all lines initially
    lines.forEach(line => {
      line.dataset.originalHtml = line.innerHTML;
      line.innerHTML = '';
      line.style.opacity = '1';
      line.style.visibility = 'visible';
      line.style.minHeight = '1.4em';
    });

    let lineIndex = 0;

    function typeLine(line, callback) {
      const text = line.dataset.text || '';
      const okText = line.dataset.ok || '';
      const hasMembar = line.hasAttribute('data-membar');
      let charIndex = 0;

      line.innerHTML = '';

      const textSpan = document.createElement('span');
      line.appendChild(textSpan);

      function typeChar() {
        if (charIndex < text.length) {
          textSpan.textContent += text[charIndex];
          charIndex++;
          setTimeout(typeChar, CONFIG.boot.charDelay);
        } else {
          // Text done — show membar if applicable, then OK
          if (hasMembar) {
            const barWrap = document.createElement('span');
            barWrap.className = 'membar-animated';
            barWrap.innerHTML = '<span class="membar-fill"></span>';
            line.appendChild(barWrap);

            // Trigger fill animation
            requestAnimationFrame(() => {
              const fill = barWrap.querySelector('.membar-fill');
              if (fill) {
                fill.style.width = '100%';
              }
            });

            setTimeout(() => showOk(line, okText, callback), CONFIG.memBar.fillDuration + CONFIG.boot.okDelay);
          } else {
            setTimeout(() => showOk(line, okText, callback), CONFIG.boot.okDelay);
          }
        }
      }

      typeChar();
    }

    function showOk(line, okText, callback) {
      if (okText) {
        const okSpan = document.createElement('span');
        okSpan.className = 'boot-ok';
        okSpan.textContent = ' ' + okText;
        okSpan.style.color = 'var(--z-green, #00ff41)';
        line.appendChild(okSpan);
      }
      setTimeout(callback, CONFIG.boot.lineDelay);
    }

    function nextLine() {
      if (lineIndex < lines.length) {
        typeLine(lines[lineIndex], () => {
          lineIndex++;
          nextLine();
        });
      } else {
        // Boot complete — show rest of page
        sessionStorage.setItem(CONFIG.boot.sessionKey, '1');
        container.dispatchEvent(new CustomEvent('boot-complete'));
      }
    }

    nextLine();
  }


  /* ----------------------------------------
     2. MEM BAR CSS (injected)
     The progress bar that fills during boot.
     ---------------------------------------- */

  function injectMembarStyles() {
    if (document.getElementById('zero-membar-styles')) return;
    const style = document.createElement('style');
    style.id = 'zero-membar-styles';
    style.textContent = `
      .membar-animated {
        display: inline-block;
        width: 120px;
        height: 0.9em;
        background: rgba(0, 255, 65, 0.08);
        border: 1px solid rgba(0, 255, 65, 0.2);
        vertical-align: middle;
        margin: 0 6px;
        position: relative;
        overflow: hidden;
      }
      .membar-fill {
        display: block;
        height: 100%;
        width: 0%;
        background: var(--z-green, #00ff41);
        transition: width ${CONFIG.memBar.fillDuration}ms ease-out;
        box-shadow: 0 0 6px var(--z-green-dim, rgba(0, 255, 65, 0.3));
      }
      @media (prefers-reduced-motion: reduce) {
        .membar-fill { transition: none; width: 100% !important; }
      }
    `;
    document.head.appendChild(style);
  }


  /* ----------------------------------------
     3. NUMBER COUNTER ANIMATION
     
     Markup expected:
     <span class="counter-animate" data-target="364">0</span>
     
     Counts from 0 to data-target on scroll
     into view. Monospace digits ticking.
     ---------------------------------------- */

  function initCounters() {
    const counters = document.querySelectorAll('.counter-animate');
    if (!counters.length) return;

    const observed = new Set();

    function animateCounter(el) {
      const target = parseInt(el.dataset.target, 10);
      if (isNaN(target)) return;

      const prefix = el.dataset.prefix || '';
      const suffix = el.dataset.suffix || '';
      const duration = CONFIG.counter.duration;
      const start = performance.now();

      function tick(now) {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);

        // Ease out cubic
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = Math.round(eased * target);

        el.textContent = prefix + current.toLocaleString() + suffix;

        if (progress < 1) {
          requestAnimationFrame(tick);
        } else {
          el.textContent = prefix + target.toLocaleString() + suffix;
        }
      }

      requestAnimationFrame(tick);
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry, i) => {
        if (entry.isIntersecting && !observed.has(entry.target)) {
          observed.add(entry.target);
          // Stagger start times
          const index = Array.from(counters).indexOf(entry.target);
          setTimeout(() => {
            animateCounter(entry.target);
          }, index * CONFIG.counter.stagger);
        }
      });
    }, { threshold: 0.3 });

    counters.forEach(c => observer.observe(c));
  }


  /* ----------------------------------------
     4. TICKER SCROLL
     
     Markup expected:
     <div class="ticker-track" data-ticker>
       <span class="ticker-item">posts · 118</span>
       <span class="ticker-sep">│</span>
       <span class="ticker-item">8.4/10 quality</span>
       <span class="ticker-sep">│</span>
       ...
     </div>
     
     Auto-scrolls continuously. Duplicates
     content for seamless loop.
     ---------------------------------------- */

  function initTicker() {
    const track = document.querySelector('[data-ticker]');
    if (!track) return;

    // Duplicate content for seamless loop
    const clone = track.innerHTML;
    track.innerHTML = clone + clone;

    const speed = CONFIG.ticker.speed;
    let pos = 0;
    let halfWidth = track.scrollWidth / 2;
    let lastTime = performance.now();
    let running = true;

    function tick(now) {
      if (!running) return;
      const dt = (now - lastTime) / 1000;
      lastTime = now;
      pos -= speed * dt;

      // Reset when first copy scrolls out
      if (Math.abs(pos) >= halfWidth) {
        pos += halfWidth;
      }

      track.style.transform = `translateX(${pos}px)`;
      requestAnimationFrame(tick);
    }

    // Pause on hover
    track.addEventListener('mouseenter', () => { running = false; });
    track.addEventListener('mouseleave', () => {
      running = true;
      lastTime = performance.now();
      requestAnimationFrame(tick);
    });

    // Recalculate on resize
    window.addEventListener('resize', () => {
      halfWidth = track.scrollWidth / 2;
    });

    requestAnimationFrame(tick);
  }

  // Inject ticker styles
  function injectTickerStyles() {
    if (document.getElementById('zero-ticker-styles')) return;
    const style = document.createElement('style');
    style.id = 'zero-ticker-styles';
    style.textContent = `
      [data-ticker] {
        display: flex;
        white-space: nowrap;
        will-change: transform;
        gap: 0;
      }
      .ticker-item {
        padding: 0 12px;
      }
      .ticker-sep {
        opacity: 0.3;
        padding: 0 4px;
      }
      [data-ticker-wrapper] {
        overflow: hidden;
        width: 100%;
      }
    `;
    document.head.appendChild(style);
  }


  /* ----------------------------------------
     5. RANDOM SIGNAL GLITCH
     
     Every 28-52 seconds, the page shifts
     2-3px horizontally for exactly 2 frames.
     Applied to class="signal-glitch-target"
     or defaults to document.body.
     ---------------------------------------- */

  function initSignalGlitch() {
    // Respect motion preferences
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const target = document.querySelector('.signal-glitch-target') || document.body;

    function glitch() {
      const shift = (Math.random() > 0.5 ? 1 : -1) * (2 + Math.random() * 2);

      target.style.transform = `translateX(${shift}px)`;

      // Hold for 2 frames (~33ms) then snap back
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          target.style.transform = '';
        });
      });

      // Schedule next glitch
      const next = CONFIG.glitch.minInterval +
        Math.random() * (CONFIG.glitch.maxInterval - CONFIG.glitch.minInterval);
      setTimeout(glitch, next);
    }

    // First glitch after a random initial delay
    const initial = 5000 + Math.random() * 15000;
    setTimeout(glitch, initial);
  }


  /* ----------------------------------------
     6. INIT SEQUENCE TYPEWRITER FOR > MOUNT LINES
     
     Markup expected:
     <div class="init-sequence" data-init-sequence>
       <div class="init-line" data-text="> MOUNT /cluster/memory" data-result="OK"></div>
       <div class="init-line" data-text="> LOAD SPECIFICATIONS (62)" data-result="OK"></div>
       ...
     </div>
     
     Each line appears with a pause, then
     the result pops green. Fast — 200ms/line.
     Triggers after boot sequence completes,
     or immediately if boot already played.
     ---------------------------------------- */

  function initInitSequence() {
    const container = document.querySelector('[data-init-sequence]');
    if (!container) return;

    const lines = container.querySelectorAll('.init-line');

    // If boot already played this session, show instantly
    if (sessionStorage.getItem(CONFIG.boot.sessionKey)) {
      lines.forEach(line => {
        line.style.opacity = '1';
        line.style.visibility = 'visible';
      });
      return;
    }

    // Hide lines
    lines.forEach(line => {
      line.style.opacity = '0';
      line.style.visibility = 'hidden';
    });

    function revealLines() {
      let delay = 0;
      lines.forEach((line, i) => {
        delay += 200;
        setTimeout(() => {
          line.style.opacity = '1';
          line.style.visibility = 'visible';

          // Flash the result text
          const result = line.dataset.result;
          if (result) {
            const resultSpan = line.querySelector('.init-result');
            if (resultSpan) {
              resultSpan.style.opacity = '0';
              setTimeout(() => {
                resultSpan.style.opacity = '1';
                resultSpan.style.transition = 'opacity 0.1s';
              }, 100);
            }
          }
        }, delay);
      });
    }

    // Listen for boot-complete event
    const bootContainer = document.querySelector('[data-boot]');
    if (bootContainer) {
      bootContainer.addEventListener('boot-complete', revealLines);
    } else {
      // No boot sequence — just reveal with delays
      revealLines();
    }
  }


  /* ----------------------------------------
     7. AGENT BOOT STAGGER
     
     Markup expected:
     <div data-agent-boot>
       <div class="agent-boot-line" data-delay="0">001 SERAPHIM .... [■ LIVE]</div>
       <div class="agent-boot-line" data-delay="150">002 CHRONICLE ... [■ LIVE]</div>
       ...
     </div>
     
     Each agent line appears sequentially
     after the init sequence completes.
     ---------------------------------------- */

  function initAgentBoot() {
    const container = document.querySelector('[data-agent-boot]');
    if (!container) return;

    const lines = container.querySelectorAll('.agent-boot-line');

    if (sessionStorage.getItem(CONFIG.boot.sessionKey)) {
      lines.forEach(l => { l.style.opacity = '1'; l.style.visibility = 'visible'; });
      return;
    }

    lines.forEach(l => { l.style.opacity = '0'; l.style.visibility = 'hidden'; });

    function revealAgents() {
      lines.forEach((line, i) => {
        const delay = parseInt(line.dataset.delay, 10) || (i * 200);
        setTimeout(() => {
          line.style.opacity = '1';
          line.style.visibility = 'visible';
          line.style.transition = 'opacity 0.15s';
        }, delay);
      });
    }

    // Chain after init sequence or boot
    const initContainer = document.querySelector('[data-init-sequence]');
    const bootContainer = document.querySelector('[data-boot]');

    if (bootContainer) {
      // Wait for boot + init sequence estimated time
      bootContainer.addEventListener('boot-complete', () => {
        const initLines = document.querySelectorAll('.init-line').length;
        const initTime = initLines * 200 + 300;
        setTimeout(revealAgents, initTime);
      });
    } else {
      revealAgents();
    }
  }


  /* ----------------------------------------
     INIT EVERYTHING
     ---------------------------------------- */

  function init() {
    injectMembarStyles();
    injectTickerStyles();
    initBootSequence();
    initInitSequence();
    initAgentBoot();
    initCounters();
    initTicker();
    initSignalGlitch();
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
