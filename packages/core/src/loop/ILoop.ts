import type { IDisposable } from '../types.js'

export interface LoopHandlers {
  update(step: number): void
  render(alpha: number): void
}

export interface ILoop extends IDisposable {
  readonly running: boolean
  readonly fps: number
  readonly step: number
  start(): void
  stop(): void
}
