import type { IDisposable } from '../types.js'
import type { IRenderer } from '../render/IRenderer.js'
import type { IScene, ISceneTransition } from './IScene.js'

interface PendingChange {
  readonly scene: IScene<unknown>
  readonly params?: unknown
}

export class SceneManager<TContext> implements IDisposable {
  private readonly scenes = new Map<string, IScene<TContext>>()
  private readonly context: TContext

  private transition: ISceneTransition | null
  private active: IScene<TContext> | null = null
  private pending: PendingChange | null = null
  private phase: 'idle' | 'out' | 'in' = 'idle'
  private phaseTime = 0

  constructor(context: TContext, transition: ISceneTransition | null = null) {
    this.context = context
    this.transition = transition
  }

  get current(): IScene<TContext> | null {
    return this.active
  }

  get isTransitioning(): boolean {
    return this.phase !== 'idle'
  }

  setTransition(transition: ISceneTransition | null): void {
    this.transition = transition
  }

  register(...scenes: IScene<TContext>[]): this {
    for (const scene of scenes) this.scenes.set(scene.name, scene)
    return this
  }

  resolve(name: string): IScene<TContext> {
    const scene = this.scenes.get(name)
    if (!scene) throw new Error(`SceneManager: scene "${name}" is not registered`)
    return scene
  }

  change(target: string | IScene<TContext>, params?: unknown): void {
    const scene = typeof target === 'string' ? this.resolve(target) : target
    if (!this.transition || !this.active) {
      this.swap(scene, params)
      return
    }
    this.pending = params === undefined ? { scene } : { scene, params }
    this.phase = 'out'
    this.phaseTime = 0
  }

  private swap(scene: IScene<TContext>, params?: unknown): void {
    this.active?.exit()
    this.active = scene
    scene.enter(this.context, params)
  }

  update(dt: number): void {
    if (this.phase !== 'idle' && this.transition) {
      this.phaseTime += dt
      const half = this.transition.duration / 2
      if (this.phase === 'out' && this.phaseTime >= half) {
        if (this.pending) this.swap(this.pending.scene as IScene<TContext>, this.pending.params)
        this.pending = null
        this.phase = 'in'
        this.phaseTime = 0
      } else if (this.phase === 'in' && this.phaseTime >= half) {
        this.phase = 'idle'
        this.phaseTime = 0
      }
    }
    this.active?.update(dt)
  }

  render(renderer: IRenderer, alpha: number): void {
    this.active?.render(renderer, alpha)
    if (this.phase !== 'idle' && this.transition) {
      const half = this.transition.duration / 2
      const progress = half > 0 ? Math.min(1, this.phaseTime / half) : 1
      this.transition.render(renderer, progress, this.phase)
    }
  }

  resize(width: number, height: number): void {
    this.active?.resize?.(width, height)
  }

  pause(): void {
    this.active?.pause?.()
  }

  resume(): void {
    this.active?.resume?.()
  }

  dispose(): void {
    this.active?.exit()
    this.active = null
    this.scenes.clear()
  }
}
