import { approach } from '@sa/core'
import { BALANCE } from '../config/balance.js'
import { ringDelta } from '../level/Ring.js'
import type { TileMap } from '../level/TileMap.js'
import type { Cell } from '../level/TileMap.js'

export type HeroState = 'ground' | 'climb' | 'fall' | 'swim' | 'dead'

export interface HeroIntent {
  readonly moveX: number
  readonly moveY: number
}

export interface HeroTerrain {
  iceAt(c: number, r: number): boolean
  floeAt(x: number): boolean
  floeBlocks(x: number): boolean
}

const FLOE_GRAB = 6

const PLAIN_TERRAIN: HeroTerrain = { iceAt: () => false, floeAt: () => false, floeBlocks: () => false }

export class Hero {
  readonly width = BALANCE.hero.width
  readonly height = BALANCE.hero.height

  x = 0
  y = 0
  vy = 0
  state: HeroState = 'ground'
  facing: 1 | -1 = 1
  hp: number = BALANCE.hero.baseHp
  maxHp: number = BALANCE.hero.baseHp
  invulnerable = 0
  speedScale = 1
  boost = 1
  waterWalk = false
  onWater = false
  moving = false
  walkPhase = 0
  climbPhase = 0
  swimPhase = 0
  splashed = false
  deadTime = 0
  inWater = false
  underwater = false
  air = 10
  maxAir = 10
  drownTimer = 0
  recoil = 0
  terrain: HeroTerrain = PLAIN_TERRAIN
  flow = 0
  swimDrag = 1
  slide = 0

  private ladderCol = -1
  private fallCol = -1
  private waterLevel = Number.POSITIVE_INFINITY

  get alive(): boolean {
    return this.state !== 'dead'
  }

  get centerY(): number {
    return this.y - this.height / 2
  }

  get headY(): number {
    return this.y - this.height + BALANCE.hero.headroom
  }

  spawn(map: TileMap, cell: Cell): void {
    this.x = map.centerX(cell.c)
    this.y = map.feetY(cell.r)
    this.vy = 0
    this.state = 'ground'
    this.invulnerable = 0
    this.moving = false
    this.deadTime = 0
    this.inWater = false
    this.underwater = false
    this.waterLevel = Number.POSITIVE_INFINITY
    this.air = this.maxAir
    this.drownTimer = 0
    this.recoil = 0
    this.ladderCol = -1
    this.slide = 0
  }

  bodyCell(map: TileMap): Cell {
    return { c: map.colAt(this.x), r: map.rowAt(this.y - 1) }
  }

  hurt(amount: number): boolean {
    if (!this.alive || this.invulnerable > 0) return false
    this.hp = Math.max(0, this.hp - amount)
    this.invulnerable = BALANCE.hero.invulnerable
    if (this.hp === 0) this.die()
    return true
  }

  heal(amount: number): void {
    this.hp += amount
  }

  die(): void {
    this.state = 'dead'
    this.deadTime = 0
    this.moving = false
  }

  update(dt: number, intent: HeroIntent, map: TileMap, waterLevel: number): void {
    this.invulnerable = Math.max(0, this.invulnerable - dt)
    this.recoil = Math.max(0, this.recoil - dt * 6)
    this.splashed = false
    this.waterLevel = waterLevel
    if (this.state === 'dead') {
      this.deadTime += dt
      return
    }
    if (intent.moveX !== 0) this.facing = intent.moveX > 0 ? 1 : -1
    const scale = this.speedScale * this.boost
    if (this.state === 'ground') this.updateGround(dt, intent, map, scale)
    else if (this.state === 'climb') this.updateClimb(dt, intent, map, scale)
    else if (this.state === 'swim') this.updateSwim(dt, intent, map)
    else this.updateFall(dt, intent, map)
    if (this.state !== 'ground') this.onWater = false
    this.sense()
  }

  private sense(): void {
    const level = this.waterLevel
    this.inWater = this.y > level + 4
    this.underwater = this.headY > level
  }

  private isSupported(map: TileMap): boolean {
    const c = map.colAt(this.x)
    return map.isSupport(c, map.rowAt(this.y + 0.5)) || map.isLadder(c, map.rowAt(this.y - 0.5))
  }

  private updateGround(dt: number, intent: HeroIntent, map: TileMap, scale: number): void {
    if (intent.moveY !== 0 && this.tryGrabLadder(map, intent.moveY)) {
      this.updateClimb(dt, intent, map, scale)
      return
    }
    if (intent.moveY < 0 && this.inWater) {
      this.startSwim(-BALANCE.hero.swimSpeed)
      return
    }
    if (this.onWater && intent.moveY > 0 && !this.terrain.floeAt(this.x)) {
      this.y += BALANCE.hero.surfaceDepth + 2
      this.startSwim(BALANCE.hero.swimSpeed)
      return
    }
    const target = intent.moveX * BALANCE.hero.speed * scale
    const icy = !this.onWater && this.terrain.iceAt(map.colAt(this.x), map.rowAt(this.y + 0.5))
    this.slide = icy ? approach(this.slide, target, BALANCE.ice.accel * dt) : target
    this.moving = intent.moveX !== 0 || Math.abs(this.slide) > 6
    if (this.slide !== 0) {
      const before = this.x
      this.x += this.slide * dt
      this.walkPhase += (dt * Math.abs(this.slide)) / 9
      this.resolveWalls(map)
      if (Math.abs(this.x - before) < Math.abs(this.slide * dt) * 0.5) this.slide = 0
      this.x = map.wrapX(this.x)
      if (this.onWater && intent.moveX !== 0 && this.tryClimbOut(map, intent.moveX)) {
        this.onWater = false
        return
      }
    }
    if (this.isSupported(map)) {
      this.onWater = false
      this.settleOnTop(map)
      return
    }
    if (this.walksOnWater() && Math.abs(this.y - this.waterLevel) <= BALANCE.hero.surfaceDepth + 2) {
      this.y = this.waterLevel
      this.onWater = true
      return
    }
    this.onWater = false
    this.leaveGround(map)
  }

  private walksOnWater(): boolean {
    return this.waterWalk || this.terrain.floeAt(this.x)
  }

  private settleOnTop(map: TileMap): void {
    const row = map.rowAt(this.y + 0.5)
    const top = row * map.tile
    const sunk = this.y - top
    if (sunk > 0.5 && sunk <= BALANCE.hero.stepUp && map.isSupport(map.colAt(this.x), row)) this.y = top
  }

  private leaveGround(map: TileMap): void {
    if (this.inWater) this.startSwim(0)
    else this.startFall(map)
  }

  private resolveWalls(map: TileMap): void {
    const half = this.width / 2
    const row = map.rowAt(this.centerY)
    const leftCol = map.colAt(this.x - half)
    if (map.isSolid(leftCol, row)) this.x = (leftCol + 1) * map.tile + half
    const rightCol = map.colAt(this.x + half)
    if (map.isSolid(rightCol, row)) this.x = rightCol * map.tile - half - 0.01
  }

  private tryGrabLadder(map: TileMap, direction: number): boolean {
    const col = map.colAt(this.x)
    const row = direction < 0 ? map.rowAt(this.y - 0.5) : map.rowAt(this.y + 0.5)
    for (const c of [col, col - 1, col + 1]) {
      if (Math.abs(map.centerX(c) - this.x) > BALANCE.hero.ladderSnap) continue
      if (!map.isLadder(c, row)) continue
      this.state = 'climb'
      this.ladderCol = c
      return true
    }
    return false
  }

  private updateClimb(dt: number, intent: HeroIntent, map: TileMap, scale: number): void {
    const c = this.ladderCol
    this.x = approach(this.x, map.centerX(c), 420 * dt)
    if (intent.moveX !== 0 && intent.moveY === 0) {
      if (this.tryExitSideways(map, intent.moveX)) return
      if (this.inWater) {
        this.startSwim(0)
        return
      }
      if (this.tryJumpOff(map, intent.moveX)) return
    }
    if (intent.moveY === 0) {
      this.moving = false
      return
    }
    this.moving = true
    const speed = BALANCE.hero.climbSpeed * scale
    this.climbPhase += (dt * speed) / 10
    const y = this.y + intent.moveY * speed * dt
    if (intent.moveY < 0) {
      const row = map.rowAt(y - 0.01)
      if (!map.isLadder(c, row)) {
        this.y = (row + 1) * map.tile
        this.state = 'ground'
        return
      }
      this.y = y
      return
    }
    const below = map.rowAt(y)
    if (map.isSolid(c, below)) {
      this.y = below * map.tile
      this.state = 'ground'
      return
    }
    this.y = y
    if (!map.isLadder(c, map.rowAt(y - 0.01))) this.leaveGround(map)
  }

  private tryExitSideways(map: TileMap, direction: number): boolean {
    const k = Math.round(this.y / map.tile)
    if (Math.abs(this.y - k * map.tile) > BALANCE.hero.exitSnap) return false
    const side = this.ladderCol + direction
    if (map.isSolid(side, k - 1) || !map.isSupport(side, k)) return false
    this.y = k * map.tile
    this.state = 'ground'
    return true
  }

  private tryJumpOff(map: TileMap, direction: number): boolean {
    const side = map.wrapCol(this.ladderCol + direction)
    for (let r = map.rowAt(this.y - this.height + BALANCE.hero.plankSlack); r <= map.rowAt(this.y - 1); r++) {
      if (map.isSolid(side, r)) return false
    }
    this.state = 'fall'
    this.fallCol = side
    this.vy = -BALANCE.hero.ladderHop
    this.moving = false
    return true
  }

  private startSwim(vy: number): void {
    this.state = 'swim'
    this.vy = vy
  }

  private updateSwim(dt: number, intent: HeroIntent, map: TileMap): void {
    if (intent.moveY !== 0 && this.tryGrabLadder(map, intent.moveY)) {
      this.vy = 0
      return
    }
    const speed = BALANCE.hero.swimSpeed * this.speedScale * this.boost * this.swimDrag
    this.moving = intent.moveX !== 0 || intent.moveY !== 0
    this.swimPhase += dt * (this.moving ? 9 : 3)
    let targetVy = intent.moveY !== 0 ? intent.moveY * speed : -BALANCE.hero.buoyancy
    if (this.waterWalk && intent.moveY <= 0) targetVy = -speed * 1.6
    this.vy = approach(this.vy, targetVy, BALANCE.hero.swimAccel * dt)
    this.sweepX(map, (intent.moveX * speed + this.flow) * dt)
    if (intent.moveX !== 0 && this.tryClimbOut(map, intent.moveX)) return
    const floe = this.terrain.floeAt(this.x)
    if (floe && this.y <= this.waterLevel + BALANCE.hero.surfaceDepth + FLOE_GRAB) {
      this.y = this.waterLevel
      this.vy = 0
      this.onWater = true
      this.state = 'ground'
      return
    }
    const surface = this.terrain.floeBlocks(this.x)
      ? this.waterLevel + this.height - BALANCE.hero.headroom + 2
      : this.waterLevel + BALANCE.hero.surfaceDepth
    let next = this.y + this.vy * dt
    if (next < surface) {
      next = surface
      if (this.vy < 0) this.vy = 0
    }
    this.sweepY(map, next - this.y)
    if (this.waterWalk && this.state === 'swim' && this.y <= surface + 0.5) {
      this.y = this.waterLevel
      this.vy = 0
      this.onWater = true
      this.state = 'ground'
    }
  }

  private sweepX(map: TileMap, dx: number): void {
    if (dx === 0) return
    const half = this.width / 2
    this.x += dx
    const col = map.colAt(dx > 0 ? this.x + half : this.x - half)
    for (let r = map.rowAt(this.y - this.height + 1); r <= map.rowAt(this.y - 1); r++) {
      if (!map.isSolid(col, r)) continue
      this.x = dx > 0 ? col * map.tile - half - 0.01 : (col + 1) * map.tile + half + 0.01
      break
    }
    this.x = map.wrapX(this.x)
  }

  private sweepY(map: TileMap, dy: number): void {
    if (dy === 0) return
    const half = this.width / 2 - 1
    this.y += dy
    const left = map.colAt(this.x - half)
    const right = map.colAt(this.x + half)
    const row = dy > 0 ? map.rowAt(this.y - 0.01) : map.rowAt(this.y - this.height)
    let blocked = false
    for (let c = left; c <= right; c++) if (map.isSolid(c, row)) blocked = true
    if (!blocked) return
    this.vy = 0
    if (dy < 0) {
      this.y = (row + 1) * map.tile + this.height
      return
    }
    this.y = row * map.tile
    if (this.isSupported(map)) this.state = 'ground'
  }

  private tryClimbOut(map: TileMap, direction: number): boolean {
    const half = this.width / 2
    const c = map.colAt(this.x + direction * (half + 4))
    for (let k = map.rowAt(this.y - BALANCE.hero.stepUp); k <= map.rowAt(this.y + 2); k++) {
      const top = k * map.tile
      if (top > this.y + 2 || top < this.y - BALANCE.hero.stepUp) continue
      if (!map.isSupport(c, k) || map.isSolid(c, k - 1)) continue
      this.y = top
      this.x = map.wrapX(c * map.tile + (direction > 0 ? half + 1 : map.tile - half - 1))
      this.vy = 0
      this.state = 'ground'
      return true
    }
    return false
  }

  private startFall(map: TileMap): void {
    this.state = 'fall'
    this.vy = 0
    this.fallCol = map.colAt(this.x)
    this.moving = false
  }

  private updateFall(dt: number, intent: HeroIntent, map: TileMap): void {
    const tile = map.tile
    this.vy = Math.min(BALANCE.hero.maxFall, this.vy + BALANCE.hero.gravity * dt)
    const drift = ringDelta(this.x, map.centerX(this.fallCol), map.width)
    this.x = map.wrapX(this.x + Math.sign(drift) * Math.min(Math.abs(drift), BALANCE.hero.fallDrift * dt))
    const previous = this.y
    const next = previous + this.vy * dt
    if (intent.moveY !== 0 && map.isLadder(this.fallCol, map.rowAt(next - 0.5))) {
      this.y = next
      this.vy = 0
      this.state = 'climb'
      this.ladderCol = this.fallCol
      return
    }
    const crossesWater = this.walksOnWater() && previous <= this.waterLevel + 1 && next >= this.waterLevel
    const first = Math.floor(previous / tile) + 1
    const last = Math.floor((crossesWater ? this.waterLevel : next) / tile)
    for (let k = first; k <= last; k++) {
      if (!map.isSupport(this.fallCol, k)) continue
      this.y = k * tile
      this.vy = 0
      this.state = 'ground'
      return
    }
    if (crossesWater) {
      this.y = this.waterLevel
      this.vy = 0
      this.onWater = true
      this.state = 'ground'
      return
    }
    this.y = Math.min(next, map.height - tile)
    if (this.y > this.waterLevel + BALANCE.hero.surfaceDepth) {
      this.vy *= 0.25
      this.state = 'swim'
      this.splashed = true
    }
  }
}
