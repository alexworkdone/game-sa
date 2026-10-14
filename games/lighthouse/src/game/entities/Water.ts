export interface WaterSetup {
  readonly startY: number
  readonly targetY: number
  readonly riseTime: number
  readonly delay: number
}

export class Water {
  level = 0
  time = 0
  frozen = 0
  boost = 1

  private rate = 0
  private delay = 0

  reset(setup: WaterSetup): void {
    this.level = setup.startY
    this.rate = (setup.startY - setup.targetY) / setup.riseTime
    this.delay = setup.delay
    this.time = 0
    this.frozen = 0
    this.boost = 1
  }

  get startsIn(): number {
    return Math.max(0, this.delay)
  }

  get rising(): boolean {
    return this.delay <= 0 && this.frozen <= 0
  }

  update(dt: number, minLevel: number): void {
    this.time += dt
    if (this.delay > 0) {
      this.delay -= dt
      return
    }
    if (this.frozen > 0) {
      this.frozen = Math.max(0, this.frozen - dt)
      return
    }
    this.level = Math.max(minLevel, this.level - this.rate * this.boost * dt)
  }

  freeze(seconds: number): void {
    this.frozen = Math.max(this.frozen, seconds)
  }

  covers(y: number): boolean {
    return y > this.level
  }
}
