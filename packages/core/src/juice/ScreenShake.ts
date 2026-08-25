import type { IUpdatable } from '../types.js'
import type { IRenderer } from '../render/IRenderer.js'

export interface ScreenShakeOptions {
  readonly maxOffset?: number
  readonly maxAngle?: number
  readonly decay?: number
}

export class ScreenShake implements IUpdatable {
  private readonly maxOffset: number
  private readonly maxAngle: number
  private readonly decay: number

  private trauma = 0

  offsetX = 0
  offsetY = 0
  angle = 0

  constructor(options: ScreenShakeOptions = {}) {
    this.maxOffset = options.maxOffset ?? 18
    this.maxAngle = options.maxAngle ?? 0.035
    this.decay = options.decay ?? 3.2
  }

  add(amount: number): void {
    this.trauma = Math.min(1, this.trauma + amount)
  }

  get intensity(): number {
    return this.trauma
  }

  update(dt: number): void {
    if (this.trauma <= 0) {
      this.offsetX = 0
      this.offsetY = 0
      this.angle = 0
      return
    }
    this.trauma = Math.max(0, this.trauma - this.decay * dt)
    const power = this.trauma * this.trauma
    this.offsetX = (Math.random() * 2 - 1) * this.maxOffset * power
    this.offsetY = (Math.random() * 2 - 1) * this.maxOffset * power
    this.angle = (Math.random() * 2 - 1) * this.maxAngle * power
  }

  apply(renderer: IRenderer): void {
    if (this.trauma <= 0) return
    renderer.translate(this.offsetX, this.offsetY)
    renderer.rotate(this.angle)
  }

  reset(): void {
    this.trauma = 0
    this.offsetX = 0
    this.offsetY = 0
    this.angle = 0
  }
}
