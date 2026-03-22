/**
 * ZERO OS — Haptic Identity
 * Vibration API patterns paired with sonic events.
 * Respects user preferences. Silent degradation.
 */

function hapticEnabled(): boolean {
  if (typeof window === 'undefined') return false
  if (typeof navigator === 'undefined') return false
  if (!('vibrate' in navigator)) return false
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false
  if (localStorage.getItem('zeroos_haptic') === 'off') return false
  return true
}

export const Haptics = {
  /** Trade entered: 1 short buzz */
  entry: () => hapticEnabled() && navigator.vibrate(50),

  /** Profit close: 2 quick buzzes */
  profit: () => hapticEnabled() && navigator.vibrate([50, 30, 50]),

  /** Loss close: 1 long buzz */
  loss: () => hapticEnabled() && navigator.vibrate(150),

  /** Immune alert: 3 long buzzes */
  alert: () => hapticEnabled() && navigator.vibrate([200, 100, 200, 100, 200]),

  /** Boot complete: 1 medium buzz */
  boot: () => hapticEnabled() && navigator.vibrate(100),

  /** UI tap: micro buzz */
  tap: () => hapticEnabled() && navigator.vibrate(10),

  /** Nav click: micro buzz */
  nav: () => hapticEnabled() && navigator.vibrate(15),
}
