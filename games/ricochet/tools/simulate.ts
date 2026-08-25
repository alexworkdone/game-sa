import { SeededRandom } from '@sa/core'
import { BALANCE } from '../src/game/config/balance.js'
import { Field } from '../src/game/entities/Field.js'
import { PlayerCore } from '../src/game/entities/PlayerCore.js'
import { Paddle } from '../src/game/entities/Paddle.js'
import type { Bullet } from '../src/game/entities/Bullet.js'
import { BulletPool } from '../src/game/systems/BulletPool.js'
import { ChargeSystem } from '../src/game/systems/ChargeSystem.js'
import { PulseSystem } from '../src/game/systems/PulseSystem.js'
import { ScoreTracker } from '../src/game/systems/ScoreTracker.js'
import { CombatSystem } from '../src/game/systems/CombatSystem.js'
import type { CombatListener } from '../src/game/systems/CombatSystem.js'
import { SpawnDirector } from '../src/game/systems/SpawnDirector.js'
import type { SpawnListener } from '../src/game/systems/SpawnDirector.js'

const STEP = 1 / 60
const MAX_SECONDS = 900

export interface SimResult {
  readonly seconds: number
  readonly score: number
  readonly catches: number
  readonly misses: number
  readonly saves: number
  readonly bestCombo: number
}

class BotRun implements CombatListener, SpawnListener {
  private readonly field = new Field()
  private readonly core = new PlayerCore()
  private readonly paddle = new Paddle()
  private readonly bullets = new BulletPool()
  private readonly charge = new ChargeSystem()
  private readonly pulses = new PulseSystem()
  private readonly score = new ScoreTracker()
  private readonly combat: CombatSystem
  private readonly director: SpawnDirector

  private readonly reaction: number
  private readonly mistakeChance: number
  private decisionTimer = 0
  private elapsed = 0

  catches = 0
  misses = 0
  saves = 0

  constructor(seed: string, skill: number) {
    this.reaction = 0.12 + (1 - skill) * 0.4
    this.mistakeChance = (1 - skill) * 0.22
    this.field.resize(960, 540)
    this.paddle.reset(this.field)
    this.combat = new CombatSystem({
      field: this.field,
      core: this.core,
      paddle: this.paddle,
      bullets: this.bullets,
      charge: this.charge,
      listener: this,
    })
    this.director = new SpawnDirector({
      field: this.field,
      bullets: this.bullets,
      random: new SeededRandom(seed),
      listener: this,
    })
  }

  private steer(dt: number): void {
    this.decisionTimer -= dt
    if (this.decisionTimer > 0) return
    this.decisionTimer = this.reaction

    let target: Bullet | null = null
    let bestDistance = Number.POSITIVE_INFINITY
    for (const bullet of this.bullets.items) {
      if (!bullet.active) continue
      const distance = this.field.distanceFromPivot(bullet.x, bullet.y)
      if (distance >= bestDistance) continue
      bestDistance = distance
      target = bullet
    }
    if (!target) return

    let lane = target.lane
    if (Math.random() < this.mistakeChance) {
      lane = (lane + (Math.random() < 0.5 ? -1 : 1) + this.field.laneCount) % this.field.laneCount
    }
    this.paddle.setLane(lane, this.field)
  }

  run(): SimResult {
    this.director.start()
    while (this.core.alive && this.elapsed < MAX_SECONDS) {
      this.elapsed += STEP
      this.steer(STEP)
      this.paddle.update(STEP, this.field)
      this.core.update(STEP)
      this.score.update(STEP)
      this.pulses.update(STEP, () => this.charge.add())
      this.director.update(STEP)
      this.combat.update(STEP)
    }
    return {
      seconds: Math.round(this.elapsed * 10) / 10,
      score: this.score.score,
      catches: this.catches,
      misses: this.misses,
      saves: this.saves,
      bestCombo: this.score.bestCombo,
    }
  }

  onAbsorb(bullet: Bullet, distance: number): void {
    this.catches += 1
    this.score.registerCatch()
    this.pulses.spawn(bullet.lane, distance)
  }

  onShieldSave(): void {
    this.saves += 1
    this.score.registerMiss()
  }

  onCoreHit(): void {
    this.misses += 1
    this.score.registerMiss()
  }

  onTelegraph(): void {
    /* ignored */
  }

  onSpawn(): void {
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
const profiles = [
  { label: 'новачок ', skill: 0.4 },
  { label: 'середній', skill: 0.72 },
  { label: 'вправний', skill: 0.95 },
]

console.log(`RICOCHET — симуляція, ${runs} забігів на профіль`)
console.log(
  `доріжок: ${BALANCE.field.laneCount}, телеграф: ${BALANCE.spawn.telegraph} c, ` +
    `рампа: ${BALANCE.ramp.seconds} c\n`,
)
console.log('профіль    сек(мед)  сек(сер)  очки(мед)  спіймано  заряд-щит  промахів  комбо')

for (const { label, skill } of profiles) {
  const results: SimResult[] = []
  for (let i = 0; i < runs; i++) results.push(new BotRun(`sim-${i}`, skill).run())

  console.log(
    `${label}  ${median(results.map((r) => r.seconds))
      .toFixed(1)
      .padStart(8)}  ${average(results.map((r) => r.seconds))
      .toFixed(1)
      .padStart(8)}  ${median(results.map((r) => r.score))
      .toFixed(0)
      .padStart(9)}  ${average(results.map((r) => r.catches))
      .toFixed(1)
      .padStart(8)}  ${average(results.map((r) => r.saves))
      .toFixed(2)
      .padStart(9)}  ${average(results.map((r) => r.misses))
      .toFixed(2)
      .padStart(8)}  ${average(results.map((r) => r.bestCombo))
      .toFixed(1)
      .padStart(5)}`,
  )
}
