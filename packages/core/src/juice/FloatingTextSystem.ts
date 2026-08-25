import type { IUpdatable } from '../types.js'
import type { IRenderer } from '../render/IRenderer.js'
import { Ease } from '../math/index.js'

export interface FloatingTextOptions {
  readonly x: number
  readonly y: number
  readonly value: string
  readonly color?: string
  readonly size?: number
  readonly rise?: number
  readonly life?: number
  readonly weight?: string | number
  readonly alpha?: number
}

interface FloatingText {
  active: boolean
  x: number
  y: number
  value: string
  color: string
  size: number
  rise: number
  life: number
  maxLife: number
  weight: string | number
  alpha: number
}

export class FloatingTextSystem implements IUpdatable {
  private readonly pool: FloatingText[]
  private cursor = 0

  constructor(capacity = 32) {
    this.pool = Array.from({ length: capacity }, () => ({
      active: false,
      x: 0,
      y: 0,
      value: '',
      color: '#fff',
      size: 24,
      rise: 48,
      life: 0,
      maxLife: 1,
      weight: 700 as string | number,
      alpha: 1,
    }))
  }

  spawn(options: FloatingTextOptions): void {
    const item = this.pool[this.cursor] as FloatingText
    this.cursor = (this.cursor + 1) % this.pool.length
    item.active = true
    item.x = options.x
    item.y = options.y
    item.value = options.value
    item.color = options.color ?? '#ffffff'
    item.size = options.size ?? 24
    item.rise = options.rise ?? 48
    item.maxLife = options.life ?? 0.8
    item.life = item.maxLife
    item.weight = options.weight ?? 700
    item.alpha = options.alpha ?? 1
  }

  update(dt: number): void {
    for (const item of this.pool) {
      if (!item.active) continue
      item.life -= dt
      if (item.life <= 0) item.active = false
    }
  }

  render(renderer: IRenderer): void {
    for (const item of this.pool) {
      if (!item.active) continue
      const progress = 1 - item.life / item.maxLife
      const offset = Ease.outCubic(progress) * item.rise
      const alpha = (progress < 0.7 ? 1 : 1 - (progress - 0.7) / 0.3) * item.alpha
      const scale = 1 + Ease.outBack(Math.min(1, progress * 4)) * 0.15
      renderer.text(item.value, item.x, item.y - offset, {
        fill: item.color,
        size: item.size * scale,
        weight: item.weight,
        align: 'center',
        baseline: 'middle',
        alpha,
      })
    }
  }

  clear(): void {
    for (const item of this.pool) item.active = false
  }
}
