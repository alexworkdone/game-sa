import { Signal } from '../types.js'
import type { IDisposable } from '../types.js'
import { ScaledViewport } from '../viewport/ScaledViewport.js'
import type { IViewport, ViewportMode } from '../viewport/IViewport.js'
import { Canvas2DRenderer } from '../render/Canvas2DRenderer.js'
import type { IRenderer } from '../render/IRenderer.js'
import { PointerKeyboardInput } from '../input/PointerKeyboardInput.js'
import type { IInput } from '../input/IInput.js'
import { WebStorage } from '../storage/WebStorage.js'
import type { IStorage } from '../storage/IStorage.js'
import { WebAudioEngine } from '../audio/WebAudioEngine.js'
import type { IAudio } from '../audio/IAudio.js'
import { NullPortal } from '../portal/NullPortal.js'
import { GuardedPortal } from '../portal/GuardedPortal.js'
import type { IPortal } from '../portal/IPortal.js'
import { Analytics } from '../analytics/Analytics.js'
import { ConsoleSink } from '../analytics/ConsoleSink.js'
import { CoreEvent } from '../analytics/IAnalytics.js'
import type { IAnalytics } from '../analytics/IAnalytics.js'
import { JuiceKit } from '../juice/JuiceKit.js'
import { FixedStepLoop } from '../loop/FixedStepLoop.js'
import type { ILoop } from '../loop/ILoop.js'
import { SceneManager } from '../scene/SceneManager.js'
import { FadeTransition } from '../scene/FadeTransition.js'
import type { IScene, ISceneTransition } from '../scene/IScene.js'
import type { GameContext } from './GameContext.js'

export interface GameFactories {
  createViewport?(canvas: HTMLCanvasElement): IViewport
  createRenderer?(viewport: IViewport): IRenderer
  createInput?(viewport: IViewport): IInput
  createStorage?(namespace: string): IStorage
  createAudio?(storage: IStorage): IAudio
  createPortal?(): IPortal
  createAnalytics?(): IAnalytics
  createJuice?(): JuiceKit
}

export interface GameOptions {
  readonly canvas: HTMLCanvasElement
  readonly namespace: string
  readonly designWidth: number
  readonly designHeight: number
  readonly initialScene: string
  createScenes(context: GameContext): IScene<GameContext>[]
  readonly viewportMode?: ViewportMode
  readonly backgroundColor?: string
  readonly step?: number
  readonly transition?: ISceneTransition | null
  readonly factories?: GameFactories
  readonly debug?: boolean
}

export class Game implements IDisposable {
  readonly context: GameContext

  private readonly options: GameOptions
  private readonly backgroundColor: string
  private readonly pauseSignal = new Signal<void>()
  private readonly resumeSignal = new Signal<void>()

  private firstFrameTracked = false
  private started = false

  constructor(options: GameOptions) {
    this.options = options
    this.backgroundColor = options.backgroundColor ?? '#0b0d14'

    const factories = options.factories ?? {}
    const viewport =
      factories.createViewport?.(options.canvas) ??
      new ScaledViewport({
        canvas: options.canvas,
        designWidth: options.designWidth,
        designHeight: options.designHeight,
        mode: options.viewportMode ?? 'expand',
      })
    const renderer =
      factories.createRenderer?.(viewport) ?? new Canvas2DRenderer({ viewport })
    const input =
      factories.createInput?.(viewport) ?? new PointerKeyboardInput({ viewport })
    const storage =
      factories.createStorage?.(options.namespace) ?? new WebStorage(options.namespace)
    const audio = factories.createAudio?.(storage) ?? new WebAudioEngine({ storage })
    const portal =
      factories.createPortal?.() ??
      new GuardedPortal(new NullPortal({ verbose: options.debug ?? false }))
    const analytics =
      factories.createAnalytics?.() ??
      new Analytics({ sinks: options.debug ? [new ConsoleSink()] : [] })
    const juice = factories.createJuice?.() ?? new JuiceKit()

    const loop: ILoop = new FixedStepLoop({
      handlers: {
        update: (step) => this.update(step),
        render: (alpha) => this.render(alpha),
      },
      ...(options.step === undefined ? {} : { step: options.step }),
    })

    const context = {
      viewport,
      renderer,
      input,
      audio,
      storage,
      portal,
      analytics,
      juice,
      loop,
      onPause: this.pauseSignal,
      onResume: this.resumeSignal,
    } as unknown as { scenes: SceneManager<GameContext> } & GameContext

    context.scenes = new SceneManager<GameContext>(
      context,
      options.transition === undefined ? new FadeTransition() : options.transition,
    )
    this.context = context

    viewport.onResize.on((metrics) => context.scenes.resize(metrics.width, metrics.height))
    input.onFirstInteraction.on(() => {
      audio.unlock()
      analytics.track(CoreEvent.FirstInput)
    })
    document.addEventListener('visibilitychange', this.onVisibilityChange)
  }

  async start(): Promise<void> {
    if (this.started) return
    this.started = true
    this.context.analytics.mark('load')
    this.context.analytics.track(CoreEvent.GameLoadStart)

    await this.context.portal.init()

    const scenes = this.options.createScenes(this.context)
    this.context.scenes.register(...scenes)
    this.context.scenes.change(this.options.initialScene)
    this.context.loop.start()
  }

  stop(): void {
    this.context.loop.stop()
  }

  private update(step: number): void {
    const dt = this.context.juice.hitStop.scale(step)
    this.context.scenes.update(dt)
    this.context.juice.update(step)
    this.context.input.update(step)
  }

  private render(alpha: number): void {
    const { renderer, scenes, analytics } = this.context
    renderer.begin()
    renderer.clear(this.backgroundColor)
    scenes.render(renderer, alpha)
    renderer.end()

    if (!this.firstFrameTracked) {
      this.firstFrameTracked = true
      analytics.measure(CoreEvent.GameFirstFrame, 'load')
    }
  }

  private readonly onVisibilityChange = (): void => {
    if (document.hidden) {
      this.context.scenes.pause()
      this.pauseSignal.emit()
    } else {
      this.context.scenes.resume()
      this.resumeSignal.emit()
    }
  }

  dispose(): void {
    document.removeEventListener('visibilitychange', this.onVisibilityChange)
    this.context.loop.dispose()
    this.context.scenes.dispose()
    this.context.input.dispose()
    this.context.audio.dispose()
    this.context.portal.dispose()
    this.context.analytics.dispose()
    this.context.renderer.dispose()
    this.context.viewport.dispose()
    this.pauseSignal.dispose()
    this.resumeSignal.dispose()
  }
}
