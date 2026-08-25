import { SeededRandom } from '@sa/core'
import { BALANCE } from '../src/game/config/balance.js'
import { Arena } from '../src/game/entities/Arena.js'
import { PlayerCore } from '../src/game/entities/PlayerCore.js'
import { Shield } from '../src/game/entities/Shield.js'
import type { Bullet } from '../src/game/entities/Bullet.js'
import type { Turret } from '../src/game/entities/Turret.js'
import { BulletPool } from '../src/game/systems/BulletPool.js'
import { TurretField } from '../src/game/systems/TurretField.js'
import { ScoreTracker } from '../src/game/systems/ScoreTracker.js'
import { CombatSystem } from '../src/game/systems/CombatSystem.js'
import type { CombatListener } from '../src/game/systems/CombatSystem.js'
import { RunDirector } from '../src/game/systems/RunDirector.js'
import type { RunDirectorListener } from '../src/game/systems/RunDirector.js'

const STEP = 1 / 60
const MAX_SECONDS = 600

export interface SimResult {
  readonly seed: string
  readonly seconds: number
  readonly wave: number
  readonly score: number
  readonly deflects: number
  readonly kills: number
  readonly coreHits: number
  readonly bestChain: number
}

export type BotMode = 'block' | 'aim'

class BotRun implements CombatListener, RunDirectorListener {
  private readonly arena = new Arena()
  private readonly core = new PlayerCore()
  private readonly shield = new Shield()
  private readonly bullets = new BulletPool()
  private readonly turrets = new TurretField()
  private readonly score = new ScoreTracker()
  private readonly combat: CombatSystem
  private readonly director: RunDirector

  private readonly aimError: number
  private readonly reactionTime: number
  private currentTarget: Bullet | null = null
  private currentOffset = 0
  private elapsed = 0

  deflects = 0
  kills = 0
  coreHits = 0

  constructor(
    private readonly seed: string,
    skill: number,
    private readonly mode: BotMode = 'block',
  ) {
    this.aimError = (1 - skill) * 0.5
    this.reactionTime = (1 - skill) * 0.55
    this.arena.resize(960, 540)
    this.combat = new CombatSystem({
      arena: this.arena,
      core: this.core,
      shield: this.shield,
      bullets: this.bullets,
      turrets: this.turrets,
      listener: this,
    })
    this.director = new RunDirector({
      arena: this.arena,
      bullets: this.bullets,
      turrets: this.turrets,
      random: new SeededRandom(seed),
      listener: this,
    })
  }

  private steer(): void {
    let target: Bullet | null = null
    let bestDistance = Number.POSITIVE_INFINITY
    for (const bullet of this.bullets.items) {
      if (!bullet.active || bullet.faction !== 'hostile') continue
      if (bullet.life < this.reactionTime) continue
      const distance = this.arena.distanceFromCenter(bullet.x, bullet.y)
      if (distance >= bestDistance) continue
      bestDistance = distance
      target = bullet
    }
    if (!target) return
    if (target !== this.currentTarget) {
      this.currentTarget = target
      this.currentOffset = (Math.random() * 2 - 1) * this.aimError
    }
    const crossing = this.arena.angleTo(target.x, target.y)
    const desired = this.mode === 'aim' ? this.bestAimAngle(target, crossing) : crossing
    this.shield.setTargetAngle(desired + this.currentOffset)
  }

  private bestAimAngle(bullet: Bullet, crossing: number): number {
    const speed = Math.hypot(bullet.vx, bullet.vy) || 1
    const vx = bullet.vx / speed
    const vy = bullet.vy / speed
    const orbit = this.arena.shieldOrbit
    const window = 0.38
    const samples = 15

    let bestAngle = crossing
    let bestError = Number.POSITIVE_INFINITY

    for (let i = 0; i < samples; i++) {
      const angle = crossing - window + (2 * window * i) / (samples - 1)
      const nx = Math.cos(angle)
      const ny = Math.sin(angle)
      const dot = vx * nx + vy * ny
      if (dot >= 0) continue
      const outX = vx - 2 * dot * nx
      const outY = vy - 2 * dot * ny
      const contactX = this.arena.centerX + nx * orbit
      const contactY = this.arena.centerY + ny * orbit

      for (const turret of this.turrets.items) {
        if (!turret.alive) continue
        const toX = turret.x - contactX
        const toY = turret.y - contactY
        const length = Math.hypot(toX, toY) || 1
        const alignment = (outX * toX + outY * toY) / length
        const error = 1 - alignment
        if (error < bestError) {
          bestError = error
          bestAngle = angle
        }
      }
    }

    return bestError < 0.06 ? bestAngle : crossing
  }

  run(): SimResult {
    this.director.start()
    while (this.core.alive && this.elapsed < MAX_SECONDS) {
      this.elapsed += STEP
      this.steer()
      this.shield.update(STEP)
      this.core.update(STEP)
      this.score.update(STEP)
      this.director.update(STEP)
      this.combat.update(STEP)
    }
    return {
      seed: this.seed,
      seconds: Math.round(this.elapsed * 10) / 10,
      wave: this.director.waveIndex + 1,
      score: this.score.score,
      deflects: this.deflects,
      kills: this.kills,
      coreHits: this.coreHits,
      bestChain: this.score.bestChain,
    }
  }

  onDeflect(_bullet: Bullet, _offset: number): void {
    this.deflects += 1
  }

  onWallBounce(): void {
    /* ignored */
  }

  onTurretDestroyed(_turret: Turret, _bullet: Bullet, chainIndex: number): void {
    this.kills += 1
    this.score.registerKill(chainIndex)
  }

  onBulletIntercepted(): void {
    /* ignored */
  }

  onCoreHit(): void {
    this.coreHits += 1
  }

  onWaveStart(): void {
    /* ignored */
  }

  onWaveCleared(index: number): void {
    if (!this.core.alive) return
    this.score.registerWaveClear(index)
    if ((index + 1) % BALANCE.waves.healEveryWaves === 0) this.core.heal()
  }

  onTurretTelegraph(): void {
    /* ignored */
  }

  onTurretFire(): void {
    /* ignored */
  }
}

const average = (values: number[]): number =>
  values.length === 0 ? 0 : values.reduce((sum, v) => sum + v, 0) / values.length

const median = (values: number[]): number => {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 0
    ? ((sorted[middle - 1] as number) + (sorted[middle] as number)) / 2
    : (sorted[middle] as number)
}

const runs = Number(process.argv[2] ?? 40)
const profiles: Array<{ label: string; skill: number; mode: BotMode }> = [
  { label: 'новачок  (блок)', skill: 0.45, mode: 'block' },
  { label: 'середній (блок)', skill: 0.72, mode: 'block' },
  { label: 'вправний (блок)', skill: 0.92, mode: 'block' },
  { label: 'новачок  (ціль)', skill: 0.45, mode: 'aim' },
  { label: 'середній (ціль)', skill: 0.72, mode: 'aim' },
  { label: 'вправний (ціль)', skill: 0.92, mode: 'aim' },
]

console.log(`RICOCHET — симуляція балансу, ${runs} забігів на профіль\n`)
console.log('профіль          сек(мед)  сек(сер)  хвиля  очки(мед)  дефлектів  вбивств')

for (const { label, skill, mode } of profiles) {
  const results: SimResult[] = []
  for (let i = 0; i < runs; i++) {
    results.push(new BotRun(`sim-${i}`, skill, mode).run())
  }
  const seconds = results.map((r) => r.seconds)
  const waves = results.map((r) => r.wave)
  const scores = results.map((r) => r.score)
  const deflects = results.map((r) => r.deflects)
  const kills = results.map((r) => r.kills)

  console.log(
    `${label}  ${median(seconds).toFixed(1).padStart(7)}  ${average(seconds)
      .toFixed(1)
      .padStart(8)}  ${average(waves).toFixed(1).padStart(5)}  ${median(scores)
      .toFixed(0)
      .padStart(9)}  ${average(deflects).toFixed(1).padStart(9)}  ${average(kills)
      .toFixed(1)
      .padStart(7)}`,
  )
}
