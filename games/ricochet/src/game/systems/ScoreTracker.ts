import { clamp } from '@sa/core'
import { BALANCE } from '../config/balance.js'

export interface KillReward {
  readonly points: number
  readonly multiplier: number
}

export class ScoreTracker {
  score = 0
  combo = 0
  bestChain = 0

  private comboTimer = 0

  get comboActive(): boolean {
    return this.comboTimer > 0
  }

  get comboRatio(): number {
    return clamp(this.comboTimer / BALANCE.score.comboWindow, 0, 1)
  }

  registerKill(chainIndex: number): KillReward {
    this.combo += 1
    this.comboTimer = BALANCE.score.comboWindow
    this.bestChain = Math.max(this.bestChain, chainIndex + 1)

    const multiplier = clamp(
      1 + chainIndex * BALANCE.score.chainStep + Math.floor(this.combo / 3),
      1,
      BALANCE.score.maxChainMultiplier,
    )
    const points = BALANCE.score.turretKill * multiplier
    this.score += points
    return { points, multiplier }
  }

  registerWaveClear(waveIndex: number): number {
    const points = BALANCE.score.waveClearBonus + waveIndex * 50
    this.score += points
    return points
  }

  update(dt: number): void {
    if (this.comboTimer <= 0) return
    this.comboTimer = Math.max(0, this.comboTimer - dt)
    if (this.comboTimer === 0) this.combo = 0
  }

  reset(): void {
    this.score = 0
    this.combo = 0
    this.bestChain = 0
    this.comboTimer = 0
  }
}
