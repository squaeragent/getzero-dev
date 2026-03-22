/**
 * ZERO OS — Sonic Identity
 * Pure Web Audio API synthesis. No audio files.
 * 220Hz sine wave core pulse with event variations.
 */

let ctx: AudioContext | null = null

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (!ctx) ctx = new AudioContext()
  return ctx
}

function soundEnabled(): boolean {
  if (typeof window === 'undefined') return false
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false
  if (localStorage.getItem('zeroos_sound') === 'off') return false
  return true
}

export const Sound = {
  /** Core pulse: 220Hz, 80ms, fast decay */
  pulse: (count: number = 1) => {
    const c = getCtx()
    if (!c || !soundEnabled()) return
    for (let i = 0; i < count; i++) {
      const osc = c.createOscillator()
      const gain = c.createGain()
      osc.type = 'sine'
      osc.frequency.value = 220
      const start = c.currentTime + (i * 0.12)
      gain.gain.setValueAtTime(0.15, start)
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.08)
      osc.connect(gain)
      gain.connect(c.destination)
      osc.start(start)
      osc.stop(start + 0.08)
    }
  },

  /** Trade entered: one pulse */
  entry: () => Sound.pulse(1),

  /** Trade closed profit: two quick pulses */
  profit: () => Sound.pulse(2),

  /** Trade closed loss: one pulse, lower pitch */
  loss: () => {
    const c = getCtx()
    if (!c || !soundEnabled()) return
    const osc = c.createOscillator()
    const gain = c.createGain()
    osc.type = 'sine'
    osc.frequency.value = 165
    gain.gain.setValueAtTime(0.15, c.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.12)
    osc.connect(gain)
    gain.connect(c.destination)
    osc.start()
    osc.stop(c.currentTime + 0.12)
  },

  /** Immune alert: three rising pulses */
  alert: () => {
    const c = getCtx()
    if (!c || !soundEnabled()) return
    ;[220, 277, 330].forEach((freq, i) => {
      const osc = c.createOscillator()
      const gain = c.createGain()
      osc.type = 'sine'
      osc.frequency.value = freq
      const start = c.currentTime + (i * 0.15)
      gain.gain.setValueAtTime(0.15, start)
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.1)
      osc.connect(gain)
      gain.connect(c.destination)
      osc.start(start)
      osc.stop(start + 0.1)
    })
  },

  /** Boot complete: low thud + brief high resonance */
  boot: () => {
    const c = getCtx()
    if (!c || !soundEnabled()) return
    const osc1 = c.createOscillator()
    const gain1 = c.createGain()
    osc1.type = 'sine'
    osc1.frequency.value = 110
    gain1.gain.setValueAtTime(0.2, c.currentTime)
    gain1.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.15)
    osc1.connect(gain1)
    gain1.connect(c.destination)
    osc1.start()
    osc1.stop(c.currentTime + 0.15)

    const osc2 = c.createOscillator()
    const gain2 = c.createGain()
    osc2.type = 'sine'
    osc2.frequency.value = 440
    gain2.gain.setValueAtTime(0.05, c.currentTime + 0.05)
    gain2.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.3)
    osc2.connect(gain2)
    gain2.connect(c.destination)
    osc2.start(c.currentTime + 0.05)
    osc2.stop(c.currentTime + 0.3)
  },

  /** UI tap: barely perceptible click */
  tap: () => {
    const c = getCtx()
    if (!c || !soundEnabled()) return
    const osc = c.createOscillator()
    const gain = c.createGain()
    osc.type = 'sine'
    osc.frequency.value = 1000
    gain.gain.setValueAtTime(0.03, c.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.02)
    osc.connect(gain)
    gain.connect(c.destination)
    osc.start()
    osc.stop(c.currentTime + 0.02)
  },
}
