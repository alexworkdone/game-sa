import type { IRandom } from '@sa/core'
import { BALANCE } from '../config/balance.js'
import type { Arena } from '../entities/Arena.js'
import type { Turret } from '../entities/Turret.js'
import type { BulletPool } from './BulletPool.js'
import type { TurretField, TurretFieldListener } from './TurretField.js'
import { WaveGenerator } from './WaveGenerator.js'

export type RunPhase = 'fighting' | 'interlude'

export interface RunDirectorListener {
  onWaveStart(index: number, turretCount: number): void
  onWaveCleared(index: number): void
  onTurretTelegraph(turret: Turret): void
  onTurretFire(turret: Turret): void
}

export interface RunDirectorDependencies {
  readonly arena: Arena
  readonly bullets: BulletPool
  readonly turrets: TurretField
  readonly random: IRandom
  readonly listener: RunDirectorListener
}

export class RunDirector implements TurretFieldListener {
  private readonly arena: Arena
  private readonly bullets: BulletPool
  private readonly turrets: TurretField
  private readonly random: IRandom
  private readonly listener: RunDirectorListener
  private readonly generator: WaveGenerator

  private phase: RunPhase = 'fighting'
  private interludeTimer = 0

  waveIndex = 0

  constructor(dependencies: RunDirectorDependencies) {
    this.arena = dependencies.arena
    this.bullets = dependencies.bullets
    this.turrets = dependencies.turrets
    this.random = dependencies.random
    this.listener = dependencies.listener
    this.generator = new WaveGenerator(dependencies.random)
    this.turrets.setListener(this)
  }

  get currentPhase(): RunPhase {
    return this.phase
  }

  get interludeRatio(): number {
    if (this.phase !== 'interlude') return 0
    return 1 - this.interludeTimer / BALANCE.waves.interWavePause
  }

  start(): void {
    this.waveIndex = 0
    this.phase = 'fighting'
    this.interludeTimer = 0
    this.deployCurrentWave()
  }

  private deployCurrentWave(): void {
    const spec = this.generator.generate(this.waveIndex)
    this.turrets.deploy(spec, this.arena)
    this.listener.onWaveStart(this.waveIndex, spec.turrets.length)
  }

  update(dt: number): void {
    if (this.phase === 'interlude') {
      this.interludeTimer -= dt
      if (this.interludeTimer <= 0) {
        this.waveIndex += 1
        this.phase = 'fighting'
        this.deployCurrentWave()
      }
      return
    }

    this.turrets.update(dt)
    if (this.turrets.aliveCount === 0) {
      this.phase = 'interlude'
      this.interludeTimer = BALANCE.waves.interWavePause
      this.listener.onWaveCleared(this.waveIndex)
    }
  }

  onTelegraph(turret: Turret): void {
    this.listener.onTurretTelegraph(turret)
  }

  onFire(turret: Turret): void {
    const toCenterX = this.arena.centerX - turret.x
    const toCenterY = this.arena.centerY - turret.y
    const baseAngle = Math.atan2(toCenterY, toCenterX)
    const angle = baseAngle + this.random.float(-1, 1) * BALANCE.bullet.aimJitter
    const speed = this.turrets.bulletSpeed
    const muzzle = BALANCE.turret.radius * 0.9

    this.bullets.spawn(
      turret.x + Math.cos(angle) * muzzle,
      turret.y + Math.sin(angle) * muzzle,
      Math.cos(angle) * speed,
      Math.sin(angle) * speed,
    )
    this.listener.onTurretFire(turret)
  }
}
