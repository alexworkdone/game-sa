import type { IRenderer } from '../render/IRenderer.js'

export interface IScene<TContext = unknown> {
  readonly name: string
  enter(context: TContext, params?: unknown): void
  exit(): void
  update(dt: number): void
  render(renderer: IRenderer, alpha: number): void
  resize?(width: number, height: number): void
  pause?(): void
  resume?(): void
}

export interface ISceneTransition {
  readonly duration: number
  render(renderer: IRenderer, progress: number, phase: 'out' | 'in'): void
}
