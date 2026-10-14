import type { IHaptics } from './IHaptics.js'

export class NullHaptics implements IHaptics {
  enabled = false

  play(): void {}
}
