/*
 * ZERO OS — Living Interactions
 * Counters, glitch text, typewriter reveal, copy-to-clipboard.
 * <4KB. No dependencies. Respects prefers-reduced-motion.
 */
(function(){
'use strict';
var REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ═══ 1. VIEWPORT-AWARE NUMBER COUNTERS ═══
function initCounters(){
  var els = document.querySelectorAll('[data-count-to]');
  if(!els.length) return;
  var io = new IntersectionObserver(function(entries){
    entries.forEach(function(e){
      if(!e.isIntersecting) return;
      io.unobserve(e.target);
      animateCount(e.target);
    });
  },{threshold:0.3});
  els.forEach(function(el){io.observe(el);});
}

function animateCount(el){
  var target = parseFloat(el.getAttribute('data-count-to'));
  var isCurrency = el.hasAttribute('data-count-currency');
  var prefix = isCurrency ? '$' : '';
  var isFloat = target % 1 !== 0;
  if(REDUCED){
    el.textContent = prefix + formatNum(target, isFloat);
    return;
  }
  var start = 0, duration = 1500, t0 = null;
  function step(ts){
    if(!t0) t0 = ts;
    var p = Math.min((ts - t0) / duration, 1);
    // ease-out cubic
    var ease = 1 - Math.pow(1 - p, 3);
    var val = start + (target - start) * ease;
    el.textContent = prefix + formatNum(val, isFloat);
    if(p < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

function formatNum(n, isFloat){
  if(isFloat) return n.toFixed(1);
  return Math.round(n).toLocaleString();
}

// ═══ 2. CHARACTER GLITCH ═══
var glitchEls = [];
var glitchActive = false;
var GLITCH_CHARS = '!@#$%^&*<>{}[]|/\\~`';

function initGlitch(){
  glitchEls = Array.from(document.querySelectorAll('.glitch-text'));
  if(!glitchEls.length || REDUCED) return;
  scheduleGlitch();
}

function scheduleGlitch(){
  var delay = 4000 + Math.random() * 4000;
  setTimeout(doGlitch, delay);
}

function doGlitch(){
  if(glitchActive || !document.hasFocus()){
    scheduleGlitch();
    return;
  }
  var el = glitchEls[Math.floor(Math.random() * glitchEls.length)];
  var text = el.textContent;
  if(!text || text.length < 2){scheduleGlitch();return;}
  var idx = Math.floor(Math.random() * text.length);
  if(text[idx] === ' '){scheduleGlitch();return;}
  var orig = text[idx];
  var replacement = GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)];
  glitchActive = true;
  el.textContent = text.substring(0, idx) + replacement + text.substring(idx + 1);
  setTimeout(function(){
    el.textContent = text.substring(0, idx) + orig + text.substring(idx + 1);
    glitchActive = false;
    scheduleGlitch();
  }, 80);
}

// ═══ 3. TYPEWRITER REVEAL ═══
function initTypewriter(){
  if(sessionStorage.getItem('zero-tw-done')){return;}
  var els = document.querySelectorAll('.typewriter');
  if(!els.length) return;
  if(REDUCED){
    sessionStorage.setItem('zero-tw-done','1');
    return;
  }
  var io = new IntersectionObserver(function(entries){
    entries.forEach(function(e){
      if(!e.isIntersecting) return;
      io.unobserve(e.target);
      revealTypewriter(e.target);
    });
  },{threshold:0.2});
  els.forEach(function(el){
    el.setAttribute('data-tw-text', el.textContent);
    el.textContent = '';
    el.setAttribute('data-tw-ready','');
    io.observe(el);
  });
  sessionStorage.setItem('zero-tw-done','1');
}

function revealTypewriter(el){
  var text = el.getAttribute('data-tw-text') || '';
  var i = 0;
  function next(){
    if(i >= text.length) return;
    el.textContent += text[i];
    i++;
    setTimeout(next, 30);
  }
  next();
}

// ═══ 4. CLICK-TO-COPY ═══
function initCopy(){
  document.addEventListener('click', function(e){
    var el = e.target.closest('[data-copy]');
    if(!el) return;
    var val = el.getAttribute('data-copy');
    if(!val) return;
    navigator.clipboard.writeText(val).then(function(){
      el.classList.add('copied');
      setTimeout(function(){el.classList.remove('copied');}, 1500);
    });
  });
}

// ═══ 5. STAGGERED ENTRANCE ═══
function initStagger(){
  var els = document.querySelectorAll('.stagger-in');
  if(!els.length) return;
  if(REDUCED){
    els.forEach(function(el){el.classList.add('stagger-visible');});
    return;
  }
  var io = new IntersectionObserver(function(entries){
    entries.forEach(function(e){
      if(!e.isIntersecting) return;
      io.unobserve(e.target);
      e.target.classList.add('stagger-visible');
    });
  },{threshold:0.05, rootMargin:'200px 0px'});
  els.forEach(function(el){
    el.classList.add('stagger-ready');
    io.observe(el);
  });
  // Fallback: reveal all after 2s in case observer doesn't fire
  setTimeout(function(){
    els.forEach(function(el){
      if(!el.classList.contains('stagger-visible')){
        el.classList.add('stagger-visible');
      }
    });
  }, 2000);
}

// ═══ INIT ═══
function init(){
  initCounters();
  initGlitch();
  initTypewriter();
  initCopy();
  initStagger();
}

if(document.readyState === 'loading'){
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
})();
