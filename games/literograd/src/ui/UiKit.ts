import type { AppServices } from '../app/AppServices.js'
import type { CityActions } from './CityActions.js'
import type { Navigator } from './Navigator.js'
import type { OverlayHost } from './OverlayHost.js'
import type { Toaster } from './Toaster.js'

export interface UiKit {
  readonly services: AppServices
  readonly nav: Navigator
  readonly overlays: OverlayHost
  readonly toast: Toaster
  readonly actions: CityActions
  readonly debug: boolean
}
