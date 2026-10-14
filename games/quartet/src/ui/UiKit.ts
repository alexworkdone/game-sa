import type { AppServices } from '../app/AppServices.js'
import type { Effects } from '../fx/Effects.js'
import type { HapticPattern } from '../platform/IHaptics.js'
import type { SfxName } from '../platform/sfx.js'
import type { Navigator } from './Navigator.js'
import type { OverlayHost } from './OverlayHost.js'
import type { Toaster } from './Toaster.js'

export interface UiKit {
  readonly services: AppServices
  readonly nav: Navigator
  readonly overlays: OverlayHost
  readonly toast: Toaster
  readonly fx: Effects
  feedback(sound: SfxName | null, haptic?: HapticPattern | null, pitch?: number): void
}
