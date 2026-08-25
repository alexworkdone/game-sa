import type { IReadonlySignal } from '../types.js'
import type { IViewport } from '../viewport/IViewport.js'
import type { IRenderer } from '../render/IRenderer.js'
import type { IInput } from '../input/IInput.js'
import type { IAudio } from '../audio/IAudio.js'
import type { IStorage } from '../storage/IStorage.js'
import type { IPortal } from '../portal/IPortal.js'
import type { IAnalytics } from '../analytics/IAnalytics.js'
import type { JuiceKit } from '../juice/JuiceKit.js'
import type { ILoop } from '../loop/ILoop.js'
import type { SceneManager } from '../scene/SceneManager.js'

export interface GameContext {
  readonly viewport: IViewport
  readonly renderer: IRenderer
  readonly input: IInput
  readonly audio: IAudio
  readonly storage: IStorage
  readonly portal: IPortal
  readonly analytics: IAnalytics
  readonly juice: JuiceKit
  readonly loop: ILoop
  readonly scenes: SceneManager<GameContext>
  readonly onPause: IReadonlySignal<void>
  readonly onResume: IReadonlySignal<void>
}
