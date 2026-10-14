import type { IDisposable } from '@sa/core'

interface Star {
  x: number
  y: number
  r: number
  base: number
  speed: number
  phase: number
  drift: number
}

export class Starfield implements IDisposable {
  readonly element: HTMLCanvasElement

  private readonly context: CanvasRenderingContext2D | null
  private stars: Star[] = []
  private frame = 0
  private animated: boolean
  private width = 0
  private height = 0
  private ratio = 1

  constructor(animated: boolean) {
    this.animated = animated
    this.element = document.createElement('canvas')
    this.element.className = 'starfield'
    this.context = this.element.getContext('2d')
    window.addEventListener('resize', this.resize)
    document.addEventListener('visibilitychange', this.onVisibility)
    this.resize()
    this.start()
  }

  setAnimated(animated: boolean): void {
    this.animated = animated
    if (animated) this.start()
    else {
      cancelAnimationFrame(this.frame)
      this.frame = 0
      this.draw(0)
    }
  }

  private readonly resize = (): void => {
    this.ratio = Math.min(2, window.devicePixelRatio || 1)
    this.width = window.innerWidth
    this.height = window.innerHeight
    this.element.width = Math.round(this.width * this.ratio)
    this.element.height = Math.round(this.height * this.ratio)
    const count = Math.round((this.width * this.height) / 5200)
    this.stars = Array.from({ length: count }, () => ({
      x: Math.random() * this.width,
      y: Math.random() * this.height,
      r: Math.random() < 0.08 ? 1.4 + Math.random() * 0.9 : 0.4 + Math.random() * 0.9,
      base: 0.25 + Math.random() * 0.6,
      speed: 0.6 + Math.random() * 2.2,
      phase: Math.random() * Math.PI * 2,
      drift: 2 + Math.random() * 6,
    }))
    this.draw(performance.now())
  }

  private readonly onVisibility = (): void => {
    if (document.hidden) {
      cancelAnimationFrame(this.frame)
      this.frame = 0
    } else {
      this.start()
    }
  }

  private start(): void {
    if (!this.animated || this.frame) return
    this.frame = requestAnimationFrame(this.tick)
  }

  private readonly tick = (now: number): void => {
    this.draw(now)
    this.frame = requestAnimationFrame(this.tick)
  }

  private draw(now: number): void {
    const ctx = this.context
    if (!ctx) return
    const t = now / 1000
    ctx.setTransform(this.ratio, 0, 0, this.ratio, 0, 0)
    ctx.clearRect(0, 0, this.width, this.height)
    ctx.fillStyle = '#ffffff'
    for (const star of this.stars) {
      const twinkle = 0.5 + 0.5 * Math.sin(t * star.speed + star.phase)
      ctx.globalAlpha = star.base * (0.45 + 0.55 * twinkle)
      const y = (star.y + t * star.drift) % this.height
      ctx.beginPath()
      ctx.arc(star.x, y, star.r, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.globalAlpha = 1
  }

  dispose(): void {
    cancelAnimationFrame(this.frame)
    window.removeEventListener('resize', this.resize)
    document.removeEventListener('visibilitychange', this.onVisibility)
  }
}
