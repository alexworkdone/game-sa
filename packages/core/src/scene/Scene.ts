import type { IRenderer } from '../render/IRenderer.js'
import type { IScene } from './IScene.js'

export abstract class Scene<TContext> implements IScene<TContext> {
  abstract readonly name: string

  protected context!: TContext

  enter(context: TContext, params?: unknown): void {
    this.context = context
    this.onEnter(params)
  }

  exit(): void {
    this.onExit()
  }

  protected onEnter(_params?: unknown): void {
    /* override */
  }

  protected onExit(): void {
    /* override */
  }

  resize(_width: number, _height: number): void {
    /* override */
  }

  pause(): void {
    /* override */
  }

  resume(): void {
    /* override */
  }

  abstract update(dt: number): void

  abstract render(renderer: IRenderer, alpha: number): void
}
