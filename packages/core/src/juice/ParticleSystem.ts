import type { IUpdatable } from '../types.js'
import type { IRenderer } from '../render/IRenderer.js'

export type ParticleShape = 'circle' | 'square' | 'spark'

export interface EmitOptions {
  readonly x: number
  readonly y: number
  readonly count?: number
  readonly angle?: number
  readonly spread?: number
  readonly speedMin?: number
  readonly speedMax?: number
  readonly lifeMin?: number
  readonly lifeMax?: number
  readonly sizeMin?: number
  readonly sizeMax?: number
  readonly colors?: readonly string[]
  readonly drag?: number
  readonly gravity?: number
  readonly shape?: ParticleShape
  readonly glow?: boolean
}

interface Particle {
  active: boolean
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  size: number
  color: string
  drag: number
  gravity: number
  shape: ParticleShape
  glow: boolean
}

export class ParticleSystem implements IUpdatable {
  private readonly pool: Particle[]
  private cursor = 0

  constructor(capacity = 512) {
    this.pool = Array.from({ length: capacity }, () => ({
      active: false,
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      life: 0,
      maxLife: 1,
      size: 1,
      color: '#fff',
      drag: 0,
      gravity: 0,
      shape: 'circle' as ParticleShape,
      glow: false,
    }))
  }

  get capacity(): number {
    return this.pool.length
  }

  emit(options: EmitOptions): void {
    const count = options.count ?? 8
    const colors = options.colors ?? ['#ffffff']
    const baseAngle = options.angle ?? 0
    const spread = options.spread ?? Math.PI * 2
    const speedMin = options.speedMin ?? 60
    const speedMax = options.speedMax ?? 220
    const lifeMin = options.lifeMin ?? 0.25
    const lifeMax = options.lifeMax ?? 0.6
    const sizeMin = options.sizeMin ?? 2
    const sizeMax = options.sizeMax ?? 5

    for (let i = 0; i < count; i++) {
      const particle = this.pool[this.cursor] as Particle
      this.cursor = (this.cursor + 1) % this.pool.length

      const angle = baseAngle + (Math.random() - 0.5) * spread
      const speed = speedMin + Math.random() * (speedMax - speedMin)
      particle.active = true
      particle.x = options.x
      particle.y = options.y
      particle.vx = Math.cos(angle) * speed
      particle.vy = Math.sin(angle) * speed
      particle.maxLife = lifeMin + Math.random() * (lifeMax - lifeMin)
      particle.life = particle.maxLife
      particle.size = sizeMin + Math.random() * (sizeMax - sizeMin)
      particle.color = colors[Math.floor(Math.random() * colors.length)] as string
      particle.drag = options.drag ?? 2.5
      particle.gravity = options.gravity ?? 0
      particle.shape = options.shape ?? 'circle'
      particle.glow = options.glow ?? false
    }
  }

  update(dt: number): void {
    for (const particle of this.pool) {
      if (!particle.active) continue
      particle.life -= dt
      if (particle.life <= 0) {
        particle.active = false
        continue
      }
      const damping = Math.max(0, 1 - particle.drag * dt)
      particle.vx *= damping
      particle.vy = particle.vy * damping + particle.gravity * dt
      particle.x += particle.vx * dt
      particle.y += particle.vy * dt
    }
  }

  render(renderer: IRenderer): void {
    for (const particle of this.pool) {
      if (!particle.active) continue
      const t = particle.life / particle.maxLife
      const size = particle.size * t
      const style = {
        fill: particle.color,
        alpha: t,
        ...(particle.glow ? { glow: particle.color, glowSize: size * 3 } : {}),
      }
      if (particle.shape === 'square') {
        renderer.rect(particle.x - size, particle.y - size, size * 2, size * 2, style)
      } else if (particle.shape === 'spark') {
        const length = size * 3
        const speed = Math.hypot(particle.vx, particle.vy) || 1
        renderer.line(
          particle.x,
          particle.y,
          particle.x - (particle.vx / speed) * length,
          particle.y - (particle.vy / speed) * length,
          Math.max(1, size * 0.8),
          { stroke: particle.color, alpha: t },
        )
      } else {
        renderer.circle(particle.x, particle.y, size, style)
      }
    }
  }

  get activeCount(): number {
    let count = 0
    for (const particle of this.pool) if (particle.active) count++
    return count
  }

  clear(): void {
    for (const particle of this.pool) particle.active = false
  }
}
