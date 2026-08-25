export class HitStop {
  private remaining = 0
  private timeScale = 0

  freeze(duration: number, timeScale = 0): void {
    if (duration <= this.remaining) return
    this.remaining = duration
    this.timeScale = timeScale
  }

  get active(): boolean {
    return this.remaining > 0
  }

  scale(dt: number): number {
    if (this.remaining <= 0) return dt
    this.remaining = Math.max(0, this.remaining - dt)
    return dt * this.timeScale
  }

  reset(): void {
    this.remaining = 0
  }
}
