import type { IRandom } from '@sa/core'
import { clamp, lerp } from '@sa/core'
import { BALANCE } from '../config/balance.js'
import type { Field } from '../entities/Field.js'
import type { BulletPool } from './BulletPool.js'

export interface Telegraph {
  readonly lane: number
  readonly ratio: number
}

export interface SpawnListener {
  onTelegraph(lane: number): void
  onSpawn(lane: number): void
}

export interface SpawnDirectorDependencies {
  readonly field: Field
  readonly bullets: BulletPool
  readonly random: IRandom
  readonly listener: SpawnListener
}

interface PendingSpawn {
  lane: number
  timer: number
  speed: number
}

export class SpawnDirector {
  private readonly field: Field
  private readonly bullets: BulletPool
  private readonly random: IRandom
  private readonly listener: SpawnListener

  private readonly pending: PendingSpawn[] = []
  private arrivals: number[] = []

  private elapsed = 0
  private nextSpawn = 0
  private lastLane = -1

  constructor(dependencies: SpawnDirectorDependencies) {
    this.field = dependencies.field
    this.bullets = dependencies.bullets
    this.random = dependencies.random
    this.listener = dependencies.listener
  }

  get difficulty(): number {
    return clamp(this.elapsed / BALANCE.ramp.seconds, 0, 1)
  }

  get telegraphs(): readonly Telegraph[] {
    return this.pending.map((spawn) => ({
      lane: spawn.lane,
      ratio: clamp(1 - spawn.timer / BALANCE.spawn.telegraph, 0, 1),
    }))
  }

  get currentSpeed(): number {
    return lerp(BALANCE.ramp.speedStart, BALANCE.ramp.speedEnd, this.difficulty)
  }

  private get travelTime(): number {
    const distance = this.field.outerRadius - this.field.paddleOrbit
    return distance / this.currentSpeed
  }

  start(): void {
    this.elapsed = 0
    this.nextSpawn = BALANCE.spawn.firstDelay
    this.pending.length = 0
    this.arrivals = []
    this.lastLane = -1
  }

  update(dt: number): void {
    this.elapsed += dt
    this.arrivals = this.arrivals.filter((time) => time > this.elapsed - 1)

    this.nextSpawn -= dt
    if (this.nextSpawn <= 0) {
      this.schedule()
      const interval = lerp(
        BALANCE.spawn.intervalStart,
        BALANCE.spawn.intervalEnd,
        this.difficulty,
      )
      this.nextSpawn = interval * this.random.float(0.88, 1.12)
    }

    for (let i = this.pending.length - 1; i >= 0; i--) {
      const spawn = this.pending[i] as PendingSpawn
      spawn.timer -= dt
      if (spawn.timer > 0) continue
      this.pending.splice(i, 1)
      this.fire(spawn)
    }
  }

  private pickLane(exclude: number): number {
    const count = this.field.laneCount
    if (this.lastLane >= 0 && this.lastLane !== exclude) {
      if (this.random.bool(BALANCE.spawn.repeatLaneChance)) return this.lastLane
    }
    let lane = this.random.int(0, count)
    if (lane === exclude) lane = (lane + 1 + this.random.int(0, count - 1)) % count
    return lane
  }

  private schedule(): void {
    const doubleChance = lerp(
      BALANCE.spawn.doubleChanceStart,
      BALANCE.spawn.doubleChanceEnd,
      this.difficulty,
    )
    const count = this.random.bool(doubleChance) ? 2 : 1

    let previousLane = -1
    for (let i = 0; i < count; i++) {
      const lane = this.pickLane(previousLane)
      previousLane = lane
      this.lastLane = lane
      this.enqueue(lane)
    }
  }

  private get arrivalGap(): number {
    return lerp(
      BALANCE.spawn.minArrivalGapStart,
      BALANCE.spawn.minArrivalGapEnd,
      this.difficulty,
    )
  }

  private enqueue(lane: number): void {
    const speed = this.currentSpeed
    const gap = this.arrivalGap
    let delay = BALANCE.spawn.telegraph
    let arrivesAt = this.elapsed + delay + this.travelTime

    for (let guard = 0; guard < 12; guard++) {
      const conflict = this.arrivals.some((time) => Math.abs(time - arrivesAt) < gap)
      if (!conflict) break
      delay += gap
      arrivesAt += gap
    }

    this.arrivals.push(arrivesAt)
    this.pending.push({ lane, timer: delay, speed })
    this.listener.onTelegraph(lane)
  }

  private fire(spawn: PendingSpawn): void {
    const origin = this.field.lanePoint(spawn.lane, this.field.outerRadius)
    const angle = this.field.laneAngle(spawn.lane)
    this.bullets.spawn(
      spawn.lane,
      origin.x,
      origin.y,
      -Math.cos(angle) * spawn.speed,
      -Math.sin(angle) * spawn.speed,
    )
    this.listener.onSpawn(spawn.lane)
  }
}
