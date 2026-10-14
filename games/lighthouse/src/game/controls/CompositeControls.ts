import type { IControls } from './IControls.js'

export class CompositeControls implements IControls {
  private readonly sources: readonly IControls[]

  constructor(sources: readonly IControls[]) {
    this.sources = sources
  }

  get moveX(): number {
    return Math.sign(this.sources.reduce((sum, source) => sum + source.moveX, 0))
  }

  get moveY(): number {
    return Math.sign(this.sources.reduce((sum, source) => sum + source.moveY, 0))
  }

  get fireHeld(): boolean {
    return this.sources.some((source) => source.fireHeld)
  }

  get firePressed(): boolean {
    return this.sources.some((source) => source.firePressed)
  }

  get reloadPressed(): boolean {
    return this.sources.some((source) => source.reloadPressed)
  }

  get pausePressed(): boolean {
    return this.sources.some((source) => source.pausePressed)
  }

  endStep(): void {
    for (const source of this.sources) source.endStep()
  }

  dispose(): void {
    for (const source of this.sources) source.dispose()
  }
}
