export type HapticPattern = 'tap' | 'select' | 'success' | 'error' | 'heavy'

export interface IHaptics {
  enabled: boolean
  play(pattern: HapticPattern): void
}
