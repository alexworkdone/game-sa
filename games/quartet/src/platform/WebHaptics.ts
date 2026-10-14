import type { HapticPattern, IHaptics } from './IHaptics.js'

const PATTERNS: Readonly<Record<HapticPattern, number | number[]>> = {
  tap: 8,
  select: 12,
  success: [14, 40, 22],
  error: [30, 50, 30],
  heavy: [20, 30, 60],
}

export class WebHaptics implements IHaptics {
  enabled = true

  private readonly supported =
    typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function'

  play(pattern: HapticPattern): void {
    if (!this.enabled || !this.supported) return
    try {
      navigator.vibrate(PATTERNS[pattern])
    } catch {
      this.enabled = false
    }
  }
}
