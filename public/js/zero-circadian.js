/*
 * ZERO OS — Circadian Display
 * Modulates all ambient effects based on Bangkok time (UTC+7).
 * The page has a daily rhythm. Five phases, nine parameters.
 * One clock controls everything. Every other module listens.
 */
(function() {
  'use strict';

  var BKK_OFFSET_HOURS = 7;

  // Phase definitions (BKK hours)
  // nightwatch wraps midnight: 23→3
  var PARAMS = {
    active: {
      sweepSpeed: 6,
      glowPeak: 0.5,
      glowSpread: 25,
      idleHeartbeat: 3.0,
      flickerMin: 10000,
      flickerMax: 15000,
      noiseOpacity: 0.025,
      textCycleMult: 1.0,
      glitchMin: 25000,
      glitchMax: 40000,
      vignetteOuter: 0.6,
      vignetteEdge: 85,
      tickerSpeed: 45,
    },
    evening: {
      sweepSpeed: 8,
      glowPeak: 0.35,
      glowSpread: 18,
      idleHeartbeat: 3.5,
      flickerMin: 15000,
      flickerMax: 25000,
      noiseOpacity: 0.018,
      textCycleMult: 1.3,
      glitchMin: 35000,
      glitchMax: 55000,
      vignetteOuter: 0.65,
      vignetteEdge: 82,
      tickerSpeed: 35,
    },
    nightwatch: {
      sweepSpeed: 14,
      glowPeak: 0.15,
      glowSpread: 10,
      idleHeartbeat: 5.0,
      flickerMin: 45000,
      flickerMax: 90000,
      noiseOpacity: 0.008,
      textCycleMult: 2.0,
      glitchMin: 60000,
      glitchMax: 120000,
      vignetteOuter: 0.75,
      vignetteEdge: 78,
      tickerSpeed: 20,
    },
    deep_night: {
      sweepSpeed: 20,
      glowPeak: 0.08,
      glowSpread: 5,
      idleHeartbeat: 7.0,
      flickerMin: 120000,
      flickerMax: 180000,
      noiseOpacity: 0.004,
      textCycleMult: 3.0,
      glitchMin: 120000,
      glitchMax: 300000,
      vignetteOuter: 0.85,
      vignetteEdge: 75,
      tickerSpeed: 12,
    },
    dawn: {
      sweepSpeed: 10,
      glowPeak: 0.3,
      glowSpread: 15,
      idleHeartbeat: 5.0,
      flickerMin: 20000,
      flickerMax: 35000,
      noiseOpacity: 0.015,
      textCycleMult: 1.5,
      glitchMin: 40000,
      glitchMax: 70000,
      vignetteOuter: 0.5,
      vignetteEdge: 83,
      tickerSpeed: 30,
    },
  };

  var NEXT_PHASE = {
    deep_night: 'dawn',
    dawn: 'active',
    active: 'evening',
    evening: 'nightwatch',
    nightwatch: 'deep_night'
  };

  var PHASE_BOUNDARIES = {
    dawn: 6,
    active: 9,
    evening: 18,
    nightwatch: 23,
    deep_night: 3
  };

  function getBKKTime() {
    var now = new Date();
    var utc = now.getTime() + now.getTimezoneOffset() * 60000;
    var bkk = new Date(utc + BKK_OFFSET_HOURS * 3600000);
    return {
      hours: bkk.getHours(),
      minutes: bkk.getMinutes(),
      decimal: bkk.getHours() + bkk.getMinutes() / 60
    };
  }

  function getCurrentPhase(bkkHour) {
    if (bkkHour >= 3 && bkkHour < 6) return 'deep_night';
    if (bkkHour >= 6 && bkkHour < 9) return 'dawn';
    if (bkkHour >= 9 && bkkHour < 18) return 'active';
    if (bkkHour >= 18 && bkkHour < 23) return 'evening';
    return 'nightwatch'; // 23-3
  }

  // Smooth interpolation between phases during 30-min transition zones
  function getBlendedParams(bkkDecimal) {
    var phase = getCurrentPhase(Math.floor(bkkDecimal));
    var params = PARAMS[phase];
    var nextPhase = NEXT_PHASE[phase];
    var boundary = PHASE_BOUNDARIES[nextPhase];

    // Distance to next phase boundary
    var distToBoundary;
    if (phase === 'nightwatch' && bkkDecimal >= 23) {
      distToBoundary = (24 - bkkDecimal) + PHASE_BOUNDARIES.deep_night;
    } else if (phase === 'nightwatch' && bkkDecimal < 3) {
      distToBoundary = PHASE_BOUNDARIES.deep_night - bkkDecimal;
    } else {
      distToBoundary = boundary - bkkDecimal;
    }

    // If within 0.5 hours (30 min) of next phase, blend
    if (distToBoundary > 0 && distToBoundary <= 0.5) {
      var blend = 1.0 - (distToBoundary / 0.5);
      var nextParams = PARAMS[nextPhase];
      var blended = {};
      for (var key in params) {
        if (params.hasOwnProperty(key)) {
          blended[key] = params[key] + (nextParams[key] - params[key]) * blend;
        }
      }
      blended._phase = phase;
      blended._nextPhase = nextPhase;
      blended._blend = blend;
      return blended;
    }

    var result = {};
    for (var k in params) {
      if (params.hasOwnProperty(k)) result[k] = params[k];
    }
    result._phase = phase;
    result._blend = 0;
    return result;
  }

  function applyParams(params) {
    var root = document.documentElement;

    // Scanline sweep speed
    root.style.setProperty('--z-sweep-speed', params.sweepSpeed.toFixed(1) + 's');

    // Phosphor glow
    root.style.setProperty('--z-glow-peak', params.glowPeak.toFixed(3));
    root.style.setProperty('--z-glow-spread', params.glowSpread.toFixed(0) + 'px');

    // Idle heartbeat base
    root.style.setProperty('--z-idle-heartbeat', params.idleHeartbeat.toFixed(1) + 's');

    // Flicker interval
    root.style.setProperty('--z-flicker-interval',
      ((params.flickerMin + params.flickerMax) / 2000).toFixed(1) + 's');

    // Noise opacity
    var noise = document.querySelector('.crt-noise');
    if (noise) noise.style.opacity = params.noiseOpacity.toFixed(4);

    // Vignette
    var vignette = document.querySelector('.crt-vignette');
    if (vignette) {
      vignette.style.background = 'radial-gradient(ellipse at center, ' +
        'transparent 50%, ' +
        'rgba(0,0,0,' + (params.vignetteOuter - 0.15).toFixed(2) + ') ' + params.vignetteEdge.toFixed(0) + '%, ' +
        'rgba(0,0,0,' + params.vignetteOuter.toFixed(2) + ') 100%)';
    }

    // Phase class on body
    document.body.dataset.circadianPhase = params._phase;
    ['active', 'evening', 'nightwatch', 'deep-night', 'dawn'].forEach(function(p) {
      document.body.classList.remove('circadian-' + p);
    });
    document.body.classList.add('circadian-' + params._phase.replace('_', '-'));

    // Expose for other modules
    window.__circadianParams = {
      textCycleMult: params.textCycleMult,
      tickerSpeed: params.tickerSpeed,
      glitchMin: params.glitchMin,
      glitchMax: params.glitchMax,
      flickerMin: params.flickerMin,
      flickerMax: params.flickerMax,
      idleHeartbeat: params.idleHeartbeat,
      phase: params._phase,
      glowPeak: params.glowPeak,
      glowSpread: params.glowSpread,
    };

    document.dispatchEvent(new CustomEvent('zero-circadian-update', {
      detail: window.__circadianParams
    }));
  }

  // Dynamic glow animation keyframes
  function updateGlowAnimation(params) {
    var styleId = 'zero-circadian-glow';
    var style = document.getElementById(styleId);
    if (!style) {
      style = document.createElement('style');
      style.id = styleId;
      document.head.appendChild(style);
    }

    var glowDim = (params.glowPeak * 0.6).toFixed(3);
    var glowFull = params.glowPeak.toFixed(3);
    var glowOuter = (params.glowPeak * 0.15).toFixed(3);
    var spread = params.glowSpread.toFixed(0);
    var spreadOuter = (params.glowSpread * 2.5).toFixed(0);
    var bright = (1 + params.glowPeak * 0.16).toFixed(3);

    style.textContent = [
      '@keyframes glow-breathe {',
      '  0%, 100% {',
      '    text-shadow: 0 0 4px rgba(0,255,65,' + glowDim + ');',
      '    filter: brightness(1);',
      '  }',
      '  50% {',
      '    text-shadow: 0 0 ' + spread + 'px rgba(0,255,65,' + glowFull + '),',
      '                 0 0 ' + spreadOuter + 'px rgba(0,255,65,' + glowOuter + ');',
      '    filter: brightness(' + bright + ');',
      '  }',
      '}',
      '',
      '/* SENTINEL nightwatch dominance */',
      '.circadian-nightwatch .agent-heartbeat[data-agent-index="4"],',
      '.circadian-deep-night .agent-heartbeat[data-agent-index="4"] {',
      '  animation-duration: 2.5s !important;',
      '  text-shadow: 0 0 12px rgba(0,255,65,0.6);',
      '}',
    ].join('\n');
  }

  // BKK clock
  function updateClock() {
    var el = document.querySelector('[data-bkk-clock]');
    if (!el) return;
    var bkk = getBKKTime();
    var h = String(bkk.hours).padStart(2, '0');
    var m = String(bkk.minutes).padStart(2, '0');
    el.textContent = h + ':' + m + ' BKK';
  }

  // Main update
  function update() {
    var bkk = getBKKTime();
    var params = getBlendedParams(bkk.decimal);
    applyParams(params);
    updateGlowAnimation(params);
    updateClock();
  }

  function init() {
    update();
    setInterval(update, 60000);
    document.addEventListener('visibilitychange', function() {
      if (!document.hidden) update();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
