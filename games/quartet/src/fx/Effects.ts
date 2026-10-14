import type { IDisposable } from '@sa/core'

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  size: number
  color: string
  gravity: number
  drag: number
  shape: 'dot' | 'confetti' | 'spark'
  spin: number
  angle: number
  target: { x: number; y: number } | null
  delay: number
}

export interface Point {
  readonly x: number
  readonly y: number
}

export class Effects implements IDisposable {
  readonly element: HTMLCanvasElement

  private readonly context: CanvasRenderingContext2D | null
  private particles: Particle[] = []
  private frame = 0
  private last = 0
  private ratio = 1
  private enabled = true
  private readonly arrivals: { at: number; callback: () => void }[] = []

  constructor() {
    this.element = document.createElement('canvas')
    this.element.className = 'fx-layer'
    this.context = this.element.getContext('2d')
    window.addEventListener('resize', this.resize)
    this.resize()
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled
    if (!enabled) this.particles = []
  }

  burst(origin: Point, colors: readonly string[], count = 26, power = 1): void {
    if (!this.enabled) return
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2
      const speed = (120 + Math.random() * 260) * power
      this.particles.push(
        this.make(origin, colors, {
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 60,
          life: 0.6 + Math.random() * 0.5,
          size: 2 + Math.random() * 3.5,
          gravity: 380,
          drag: 2.2,
          shape: Math.random() < 0.3 ? 'spark' : 'dot',
        }),
      )
    }
    this.start()
  }

  confetti(colors: readonly string[], count = 120): void {
    if (!this.enabled) return
    const width = window.innerWidth
    for (let i = 0; i < count; i++) {
      const fromLeft = i % 2 === 0
      const origin = { x: fromLeft ? -10 : width + 10, y: window.innerHeight * (0.45 + Math.random() * 0.25) }
      const angle = fromLeft ? -Math.PI / 3 - Math.random() * 0.5 : (-Math.PI * 2) / 3 + Math.random() * 0.5
      const speed = 520 + Math.random() * 420
      this.particles.push(
        this.make(origin, colors, {
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 2.2 + Math.random() * 1.2,
          size: 5 + Math.random() * 5,
          gravity: 520,
          drag: 1.3,
          shape: 'confetti',
        }),
      )
    }
    this.start()
  }

  fly(from: Point, to: Point, color: string, count: number, onArrive?: () => void): void {
    if (!this.enabled) {
      onArrive?.()
      return
    }
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2
      const speed = 160 + Math.random() * 200
      this.particles.push(
        this.make(from, [color], {
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 1.6,
          size: 3 + Math.random() * 2.5,
          gravity: 0,
          drag: 3,
          shape: 'dot',
          target: to,
          delay: i * 0.025,
        }),
      )
    }
    if (onArrive) this.arrivals.push({ at: performance.now() + 750 + count * 25, callback: onArrive })
    this.start()
  }

  private make(origin: Point, colors: readonly string[], init: Partial<Particle>): Particle {
    return {
      x: origin.x,
      y: origin.y,
      vx: 0,
      vy: 0,
      life: 1,
      maxLife: init.life ?? 1,
      size: 3,
      color: colors[Math.floor(Math.random() * colors.length)] ?? '#fff',
      gravity: 0,
      drag: 0,
      shape: 'dot',
      spin: (Math.random() - 0.5) * 14,
      angle: Math.random() * Math.PI,
      target: null,
      delay: 0,
      ...init,
    }
  }

  private readonly resize = (): void => {
    this.ratio = Math.min(2, window.devicePixelRatio || 1)
    this.element.width = Math.round(window.innerWidth * this.ratio)
    this.element.height = Math.round(window.innerHeight * this.ratio)
  }

  private start(): void {
    if (this.frame) return
    this.last = performance.now()
    this.frame = requestAnimationFrame(this.tick)
  }

  private readonly tick = (now: number): void => {
    const dt = Math.min(0.05, (now - this.last) / 1000)
    this.last = now
    this.step(dt)
    this.draw()
    for (let i = this.arrivals.length - 1; i >= 0; i--) {
      const arrival = this.arrivals[i]
      if (arrival && now >= arrival.at) {
        this.arrivals.splice(i, 1)
        arrival.callback()
      }
    }
    if (this.particles.length > 0 || this.arrivals.length > 0) {
      this.frame = requestAnimationFrame(this.tick)
    } else {
      this.frame = 0
      this.context?.clearRect(0, 0, this.element.width, this.element.height)
    }
  }

  private step(dt: number): void {
    for (const p of this.particles) {
      if (p.delay > 0) {
        p.delay -= dt
        continue
      }
      p.life -= dt / p.maxLife
      if (p.target) {
        const age = 1 - p.life
        const pull = Math.min(1, Math.max(0, (age - 0.18) * 2.4))
        const dx = p.target.x - p.x
        const dy = p.target.y - p.y
        p.vx = p.vx * (1 - pull) + dx * 9 * pull
        p.vy = p.vy * (1 - pull) + dy * 9 * pull
        if (Math.hypot(dx, dy) < 10 && pull > 0.5) p.life = 0
      }
      p.vx -= p.vx * p.drag * dt
      p.vy -= p.vy * p.drag * dt
      p.vy += p.gravity * dt
      p.x += p.vx * dt
      p.y += p.vy * dt
      p.angle += p.spin * dt
    }
    this.particles = this.particles.filter((p) => p.life > 0)
  }

  private draw(): void {
    const ctx = this.context
    if (!ctx) return
    ctx.setTransform(this.ratio, 0, 0, this.ratio, 0, 0)
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight)
    for (const p of this.particles) {
      if (p.delay > 0) continue
      const alpha = Math.min(1, p.life * 2.2)
      ctx.globalAlpha = alpha
      ctx.fillStyle = p.color
      if (p.shape === 'confetti') {
        ctx.save()
        ctx.translate(p.x, p.y)
        ctx.rotate(p.angle)
        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2)
        ctx.restore()
      } else if (p.shape === 'spark') {
        ctx.save()
        ctx.translate(p.x, p.y)
        ctx.rotate(Math.atan2(p.vy, p.vx))
        ctx.fillRect(-p.size * 1.8, -p.size / 4, p.size * 3.6, p.size / 2)
        ctx.restore()
      } else {
        ctx.shadowColor = p.color
        ctx.shadowBlur = 8
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fill()
        ctx.shadowBlur = 0
      }
    }
    ctx.globalAlpha = 1
  }

  dispose(): void {
    cancelAnimationFrame(this.frame)
    window.removeEventListener('resize', this.resize)
  }
}
