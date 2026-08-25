import type { IRandom } from '@sa/core'
import { TAU, clamp } from '@sa/core'
import { BALANCE } from '../config/balance.js'

export interface TurretSpec {
  readonly angle: number
  readonly firstDelay: number
  readonly cooldown: number
  readonly burstSize: number
}

export interface WaveSpec {
  readonly index: number
  readonly bulletSpeed: number
  readonly turrets: readonly TurretSpec[]
}

export class WaveGenerator {
  private readonly random: IRandom

  constructor(random: IRandom) {
    this.random = random
  }

  turretCount(index: number): number {
    const raw = BALANCE.waves.baseTurrets + index * BALANCE.waves.turretsPerWave
    return clamp(Math.round(raw), BALANCE.waves.baseTurrets, BALANCE.waves.maxTurrets)
  }

  generate(index: number): WaveSpec {
    const count = this.turretCount(index)
    const cooldown = Math.max(
      BALANCE.waves.minCooldown,
      BALANCE.waves.baseCooldown - index * BALANCE.waves.cooldownPerWave,
    )
    const bulletSpeed = Math.min(
      BALANCE.waves.maxSpeed,
      BALANCE.bullet.hostileSpeed + index * BALANCE.waves.speedPerWave,
    )
    const burstChance = Math.min(
      BALANCE.waves.maxBurstChance,
      BALANCE.waves.burstChanceStart + index * BALANCE.waves.burstChancePerWave,
    )

    const spacing = TAU / count
    const baseAngle = this.random.float(0, TAU)
    const turrets: TurretSpec[] = []

    for (let i = 0; i < count; i++) {
      const jitter = this.random.float(-spacing * 0.28, spacing * 0.28)
      turrets.push({
        angle: baseAngle + i * spacing + jitter,
        firstDelay:
          BALANCE.waves.firstShotDelay + this.random.float(0, cooldown * 0.85) + i * 0.08,
        cooldown: cooldown * this.random.float(0.9, 1.12),
        burstSize: this.random.bool(burstChance) ? this.random.int(1, 3) : 0,
      })
    }

    return { index, bulletSpeed, turrets }
  }
}
