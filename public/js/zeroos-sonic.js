/**
 * ZERO OS — Sonic + Haptic Layer (vanilla JS build)
 * Pure Web Audio API. No audio files. No dependencies.
 */
;(function() {
  'use strict'

  let ctx = null
  function getCtx() {
    if (!ctx) {
      try { ctx = new (window.AudioContext || window.webkitAudioContext)() } catch(e) { return null }
    }
    if (ctx.state === 'suspended') ctx.resume()
    return ctx
  }

  function soundOk() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false
    if (localStorage.getItem('zeroos_sound') === 'off') return false
    return true
  }

  function hapticOk() {
    return 'vibrate' in navigator &&
      !window.matchMedia('(prefers-reduced-motion: reduce)').matches &&
      localStorage.getItem('zeroos_haptic') !== 'off'
  }

  const Sound = {
    pulse: function(count) {
      const c = getCtx()
      if (!c || !soundOk()) return
      for (let i = 0; i < (count || 1); i++) {
        const osc = c.createOscillator()
        const gain = c.createGain()
        osc.type = 'sine'
        osc.frequency.value = 220
        const s = c.currentTime + (i * 0.12)
        gain.gain.setValueAtTime(0.15, s)
        gain.gain.exponentialRampToValueAtTime(0.001, s + 0.08)
        osc.connect(gain); gain.connect(c.destination)
        osc.start(s); osc.stop(s + 0.08)
      }
    },
    boot: function() {
      const c = getCtx()
      if (!c || !soundOk()) return
      var o1 = c.createOscillator(), g1 = c.createGain()
      o1.type = 'sine'; o1.frequency.value = 110
      g1.gain.setValueAtTime(0.2, c.currentTime)
      g1.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.15)
      o1.connect(g1); g1.connect(c.destination)
      o1.start(); o1.stop(c.currentTime + 0.15)

      var o2 = c.createOscillator(), g2 = c.createGain()
      o2.type = 'sine'; o2.frequency.value = 440
      g2.gain.setValueAtTime(0.05, c.currentTime + 0.05)
      g2.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.3)
      o2.connect(g2); g2.connect(c.destination)
      o2.start(c.currentTime + 0.05); o2.stop(c.currentTime + 0.3)
    },
    tap: function() {
      const c = getCtx()
      if (!c || !soundOk()) return
      var osc = c.createOscillator(), gain = c.createGain()
      osc.type = 'sine'; osc.frequency.value = 1000
      gain.gain.setValueAtTime(0.03, c.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.02)
      osc.connect(gain); gain.connect(c.destination)
      osc.start(); osc.stop(c.currentTime + 0.02)
    },
    alert: function() {
      const c = getCtx()
      if (!c || !soundOk()) return
      ;[220, 277, 330].forEach(function(freq, i) {
        var osc = c.createOscillator(), gain = c.createGain()
        osc.type = 'sine'; osc.frequency.value = freq
        var s = c.currentTime + (i * 0.15)
        gain.gain.setValueAtTime(0.15, s)
        gain.gain.exponentialRampToValueAtTime(0.001, s + 0.1)
        osc.connect(gain); gain.connect(c.destination)
        osc.start(s); osc.stop(s + 0.1)
      })
    }
  }

  const Haptics = {
    entry: function() { hapticOk() && navigator.vibrate(50) },
    profit: function() { hapticOk() && navigator.vibrate([50, 30, 50]) },
    loss: function() { hapticOk() && navigator.vibrate(150) },
    alert: function() { hapticOk() && navigator.vibrate([200, 100, 200, 100, 200]) },
    boot: function() { hapticOk() && navigator.vibrate(100) },
    tap: function() { hapticOk() && navigator.vibrate(10) },
    nav: function() { hapticOk() && navigator.vibrate(15) }
  }

  // Boot sound on first interaction (AudioContext requires user gesture)
  let booted = false
  function onFirstInteraction() {
    if (booted) return
    booted = true
    Sound.boot()
    Haptics.boot()
    document.removeEventListener('click', onFirstInteraction)
    document.removeEventListener('touchstart', onFirstInteraction)
  }
  document.addEventListener('click', onFirstInteraction, { once: false })
  document.addEventListener('touchstart', onFirstInteraction, { once: false })

  // Nav tap sounds
  document.addEventListener('click', function(e) {
    var link = e.target.closest('.nav-tab, .footer-bar a')
    if (link) {
      Sound.tap()
      Haptics.nav()
    }
  })

  // Expose globally for use by other scripts (evaluator, etc.)
  window.ZeroSound = Sound
  window.ZeroHaptics = Haptics
})()
