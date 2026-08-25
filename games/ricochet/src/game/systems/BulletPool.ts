import type { IRenderer } from '@sa/core'
import { BALANCE } from '../config/balance.js'
import { PALETTE } from '../config/palette.js'
import { Bullet } from '../entities/Bullet.js'

export class BulletPool {
  private readonly pool: Bullet[]

  constructor(size: number = BALANCE.bullet.poolSize) {
    this.pool = Array.from({ length: size }, () => new Bullet())
  }

  get items(): readonly Bullet[] {
    return this.pool
  }

  get activeCount(): number {
    let count = 0
    for (const bullet of this.pool) if (bullet.active) count++
    return count
  }

  spawn(lane: number, x: number, y: number, vx: number, vy: number): Bullet | null {
    for (const bullet of this.pool) {
      if (bullet.active) continue
      bullet.launch(lane, x, y, vx, vy)
      return bullet
    }
    return null
  }

  advance(dt: number): void {
    for (const bullet of this.pool) {
      if (bullet.active) bullet.advance(dt)
    }
  }

  clear(): void {
    for (const bullet of this.pool) bullet.active = false
  }

  render(renderer: IRenderer): void {
    for (const bullet of this.pool) {
      if (!bullet.active) continue
      const deflected = bullet.faction === 'deflected'
      const color = deflected ? PALETTE.friendly : PALETTE.hostile
      const radius = bullet.radius * bullet.spawnFade

      renderer.line(bullet.prevX, bullet.prevY, bullet.x, bullet.y, radius * 1.5, {
        stroke: color,
        alpha: 0.32,
      })
      renderer.circle(bullet.x, bullet.y, radius, {
        fill: color,
        glow: color,
        glowSize: deflected ? 20 : 12,
      })
      renderer.circle(bullet.x, bullet.y, radius * 0.4, { fill: PALETTE.ink, alpha: 0.9 })
    }
  }
}
