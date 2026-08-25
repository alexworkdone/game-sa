import { MemoryStorage, SeededRandom } from '@sa/core'
import { BALANCE } from '../src/game/config/balance.js'
import { Field } from '../src/game/entities/Field.js'
import { Container } from '../src/game/entities/Container.js'
import { Paddle } from '../src/game/entities/Paddle.js'
import type { Bullet } from '../src/game/entities/Bullet.js'
import { BulletPool } from '../src/game/systems/BulletPool.js'
import { PlasmaCollector } from '../src/game/systems/PlasmaCollector.js'
import { PartLedger } from '../src/game/systems/PartLedger.js'
import { PulseSystem } from '../src/game/systems/PulseSystem.js'
import { VeinNetwork } from '../src/game/systems/VeinNetwork.js'
import { CombatSystem } from '../src/game/systems/CombatSystem.js'
import type { CombatListener } from '../src/game/systems/CombatSystem.js'
import { SpawnDirector } from '../src/game/systems/SpawnDirector.js'
import type { SpawnListener } from '../src/game/systems/SpawnDirector.js'

const STEP = 1 / 60
const MAX_SECONDS = 900

export interface SimResult {
  readonly seconds: number
  readonly catches: number
  readonly misses: number
  readonly extracted: boolean
  readonly energy: number
}

class BotRun implements CombatListener, SpawnListener {
  private readonly field = new Field()
  private readonly container = new Container()
  private readonly paddle = new Paddle()
  private readonly bullets = new BulletPool()
  private readonly collector = new PlasmaCollector()
  private readonly veins = new VeinNetwork()
  private readonly pulses = new PulseSystem(this.veins)
  private readonly combat: CombatSystem
  private readonly director: SpawnDirector

  private readonly reaction: number
  private readonly mistakeChance: number
  private decisionTimer = 0
  private elapsed = 0
  private extracted = false
  private readonly ledger: PartLedger

  catches = 0
  misses = 0

  constructor(seed: string, skill: number, startPart: number) {
    const storage = new MemoryStorage()
    storage.set('partsBuilt.v2', startPart)
    if (startPart > 0) storage.set('reservoir.v2', BALANCE.plasma.reservoirCapacity)
    this.ledger = new PartLedger(storage)
    this.reaction = 0.12 + (1 - skill) * 0.4
    this.mistakeChance = (1 - skill) * 0.22
    this.field.resize(960, 540)
    this.veins.rebuild(this.field)
    this.paddle.reset(this.field)
    this.combat = new CombatSystem({
      field: this.field,
      container: this.container,
      paddle: this.paddle,
      bullets: this.bullets,
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
    while (this.container.alive && !this.extracted && this.elapsed < MAX_SECONDS) {
      this.elapsed += STEP
      this.steer(STEP)
      this.paddle.update(STEP, this.field)
      this.container.update(STEP)
      this.pulses.update(STEP, (_lane, energy) => {
        this.collector.add(energy)
        if (this.collector.energy >= BALANCE.plasma.containerCapacity) this.extracted = true
      })
      this.director.update(STEP)
      this.combat.update(STEP)
    }
    return {
      seconds: Math.round(this.elapsed * 10) / 10,
      catches: this.catches,
      misses: this.misses,
      extracted: this.extracted,
      energy: Math.round(this.collector.energy * 10) / 10,
    }
  }

  onAbsorb(bullet: Bullet): void {
    this.catches += 1
    this.pulses.spawn(bullet.lane, bullet.energy)
  }

  onContainerHit(): void {
    this.misses += 1
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
const startPart = Number(process.argv[3] ?? 0)
const profiles = [
  { label: 'новачок ', skill: 0.4 },
  { label: 'середній', skill: 0.72 },
  { label: 'вправний', skill: 0.95 },
]

console.log(`RICOCHET — симуляція, ${runs} забігів на профіль`)
console.log(
  `доріжок: ${BALANCE.field.laneCount}, телеграф: ${BALANCE.spawn.telegraph} c, ` +
    `рампа: ${BALANCE.ramp.seconds} c, ` +
    `деталь #${startPart + 1} = ${Math.round(BALANCE.plasma.baseTarget * Math.pow(BALANCE.plasma.growth, startPart))} ГДж\n`,
)
console.log('профіль    сек(мед)  сек(сер)  ГДж(мед)  спіймано  промахів  вивіз')

for (const { label, skill } of profiles) {
  const results: SimResult[] = []
  for (let i = 0; i < runs; i++) results.push(new BotRun(`sim-${i}`, skill, startPart).run())

  console.log(
    `${label}  ${median(results.map((r) => r.seconds))
      .toFixed(1)
      .padStart(8)}  ${average(results.map((r) => r.seconds))
      .toFixed(1)
      .padStart(8)}  ${median(results.map((r) => r.energy))
      .toFixed(1)
      .padStart(8)}  ${average(results.map((r) => r.catches))
      .toFixed(1)
      .padStart(8)}  ${average(results.map((r) => r.misses))
      .toFixed(2)
      .padStart(8)}  ${(
      results.filter((r) => r.extracted).length / results.length
    )
      .toFixed(2)
      .padStart(7)}`,
  )
}
