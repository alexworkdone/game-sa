import { clamp } from '@sa/core'
import { BALANCE } from '../config/balance.js'

export interface CatchReward {
  readonly points: number
  readonly multiplier: number
}

export class ScoreTracker {
  score = 0
  combo = 0
  bestCombo = 0
  catches = 0

  private comboTimer = 0

  get multiplier(): number {
    return clamp(
      1 + Math.floor(this.combo / 3) * BALANCE.score.comboStep,
      1,
      BALANCE.score.maxMultiplier,
    )
  }

  get comboRatio(): number {
    return clamp(this.comboTimer / BALANCE.score.comboWindow, 0, 1)
  }

  registerCatch(): CatchReward {
    this.combo += 1
    this.catches += 1
    this.bestCombo = Math.max(this.bestCombo, this.combo)
    this.comboTimer = BALANCE.score.comboWindow
    const multiplier = this.multiplier
    const points = BALANCE.score.perCatch * multiplier
    this.score += points
    return { points, multiplier }
  }

  registerMiss(): void {
    this.combo = 0
    this.comboTimer = 0
  }

  update(dt: number): void {
    if (this.comboTimer <= 0) return
    this.comboTimer = Math.max(0, this.comboTimer - dt)
    if (this.comboTimer === 0) this.combo = 0
  }

  reset(): void {
    this.score = 0
    this.combo = 0
    this.bestCombo = 0
    this.catches = 0
    this.comboTimer = 0
  }
}
