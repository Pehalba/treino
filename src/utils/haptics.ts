export function haptic(pattern: number | number[] = 20): void {
  if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return
  try {
    navigator.vibrate(pattern)
  } catch {
    /* ignore */
  }
}

export function hapticSuccess(): void {
  haptic([18, 40, 28])
}

export function hapticRecord(): void {
  haptic([12, 30, 18, 30, 40])
}

export function hapticAlert(): void {
  haptic([40, 60, 80])
}
