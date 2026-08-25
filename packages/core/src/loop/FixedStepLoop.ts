import type { ILoop, LoopHandlers } from './ILoop.js'

export interface FixedStepLoopOptions {
  readonly handlers: LoopHandlers
  readonly step?: number
  readonly maxFrameTime?: number
  readonly maxStepsPerFrame?: number
}

export class FixedStepLoop implements ILoop {
  readonly step: number

  private readonly handlers: LoopHandlers
  private readonly maxFrameTime: number
  private readonly maxStepsPerFrame: number

  private frameHandle = 0
  private lastTime = 0
  private accumulator = 0
  private frameCount = 0
  private fpsTimer = 0

  running = false
  fps = 0

  constructor(options: FixedStepLoopOptions) {
    this.handlers = options.handlers
    this.step = options.step ?? 1 / 60
    this.maxFrameTime = options.maxFrameTime ?? 0.25
    this.maxStepsPerFrame = options.maxStepsPerFrame ?? 5
  }

  start(): void {
    if (this.running) return
    this.running = true
    this.lastTime = performance.now()
    this.accumulator = 0
    this.frameHandle = requestAnimationFrame(this.tick)
  }

  stop(): void {
    if (!this.running) return
    this.running = false
    cancelAnimationFrame(this.frameHandle)
    this.frameHandle = 0
  }

  private readonly tick = (now: number): void => {
    if (!this.running) return
    this.frameHandle = requestAnimationFrame(this.tick)

    const elapsed = Math.min((now - this.lastTime) / 1000, this.maxFrameTime)
    this.lastTime = now
    this.accumulator += elapsed

    let steps = 0
    while (this.accumulator >= this.step && steps < this.maxStepsPerFrame) {
      this.handlers.update(this.step)
      this.accumulator -= this.step
      steps++
    }
    if (steps === this.maxStepsPerFrame) this.accumulator = 0

    this.handlers.render(this.accumulator / this.step)

    this.frameCount++
    this.fpsTimer += elapsed
    if (this.fpsTimer >= 1) {
      this.fps = Math.round(this.frameCount / this.fpsTimer)
      this.frameCount = 0
      this.fpsTimer = 0
    }
  }

  dispose(): void {
    this.stop()
  }
}
