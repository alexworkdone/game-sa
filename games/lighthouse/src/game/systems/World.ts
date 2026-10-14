import { angleDelta } from '@sa/core'
import type { IRandom } from '@sa/core'
import { BALANCE, isGuardianFloor, waterRiseTime } from '../config/balance.js'
import type { CarrierLoot, Enemy, EnemyWorld } from '../entities/Enemy.js'
import type { IEnemyFactory } from '../entities/EnemyFactory.js'
import { ExitDoor } from '../entities/ExitDoor.js'
import { Gun } from '../entities/Gun.js'
import { Hero } from '../entities/Hero.js'
import type { HeroIntent } from '../entities/Hero.js'
import { Pickup, isPowerUpKind } from '../entities/Pickup.js'
import type { PickupKind } from '../entities/Pickup.js'
import { NO_EFFECTS, ProjectilePool } from '../entities/Projectile.js'
import type { Projectile, ProjectileEffects, ProjectileLook } from '../entities/Projectile.js'
import { COUNTER_DROP_WEIGHT, FEATURE_COUNTERS, POWER_UP_WEIGHTS } from '../config/powerups.js'
import type { FloorFeature, TimedPowerUp } from '../config/powerups.js'
import { Water } from '../entities/Water.js'
import { boxesOverlap, pointInBox } from '../entities/Box.js'
import { ringDelta } from '../level/Ring.js'
import type { LevelBlueprint } from '../level/LevelBlueprint.js'
import { NavGrid } from '../level/NavGrid.js'
import type { Cell, TileMap } from '../level/TileMap.js'
import type { IControls } from '../controls/IControls.js'
import type { PerkEffects } from '../config/perks.js'
import type { DeathCause } from '../config/epitaphs.js'
import { tierTheme } from '../config/tiers.js'
import { pickVariant } from '../config/variants.js'
import type { FloorVariant } from '../config/variants.js'
import { EnemyDirector } from './EnemyDirector.js'
import { createHazards } from './hazards/createHazards.js'
import type { HazardHost, IHazard } from './hazards/IHazard.js'
import type { HeroStats } from './HeroStats.js'
import { PowerUps } from './PowerUps.js'

const PHASING_LOOKS: ReadonlySet<ProjectileLook> = new Set(['flare', 'ink'])

export type HurtCause = Exclude<DeathCause, 'quit'>

export interface WorldListener {
  onShot(x: number, y: number, direction: 1 | -1): void
  onDryFire(): void
  onReloadStart(): void
  onReloaded(): void
  onFlareImpact(x: number, y: number): void
  onEnemyHit(enemy: Enemy, x: number, y: number): void
  onEnemyKilled(enemy: Enemy): void
  onEnemySpawned(enemy: Enemy): void
  onSpineFired(x: number, y: number): void
  onHeroHurt(cause: HurtCause): void
  onShieldBlock(): void
  onPickup(kind: PickupKind, x: number, y: number, value: number): void
  onDoorOpened(): void
  onFloorCleared(): void
  onHeroDied(): void
  onDrowning(x: number, y: number): void
  onAirLow(secondsLeft: number): void
  onHeroSplash(x: number, y: number): void
  onKeysSubmerged(count: number): void
  onExplosion(x: number, y: number): void
  onPowerUpExpired(kind: TimedPowerUp): void
  onDoorHeld(): void
  onSecondWind(): void
  onGuardianDefeated(enemy: Enemy): void
  onLightningWarn(x: number): void
  onLightningStrike(x: number): void
  onShock(x: number, y: number, hit: boolean): void
  onShellRevealed(x: number, y: number): void
}

export interface InkCloud {
  readonly x: number
  readonly y: number
  age: number
}

export interface ShockWave {
  readonly x: number
  readonly y: number
  readonly radius: number
  age: number
}

export interface FloorTally {
  readonly kills: number
  readonly keys: number
  readonly powerUps: number
  readonly underwaterKeys: number
}

export interface WorldSetup {
  readonly blueprint: LevelBlueprint
  readonly stats: HeroStats
  readonly hp: number
  readonly random: IRandom
  readonly enemyFactory: IEnemyFactory
  readonly listener: WorldListener
  readonly tier: number
  readonly modifiers: PerkEffects
  readonly secondWinds: number
}

const CHASE_REFRESH = 0.25
const PICKUP_RADIUS = 18
const KEY_RADIUS = 22
const SHOCK_FADE = 0.45
const MAGNETIC: ReadonlySet<PickupKind> = new Set(['pearl', 'shell', 'heart'])
const NEIGHBOURS: readonly (readonly [number, number])[] = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
]

export class World implements EnemyWorld, HazardHost {
  readonly floor: number
  readonly tier: number
  readonly variant: FloorVariant | null
  readonly features: readonly FloorFeature[]
  readonly hazards: IHazard[]
  readonly inkClouds: InkCloud[] = []
  readonly shocks: ShockWave[] = []
  readonly blueprint: LevelBlueprint
  readonly map: TileMap
  readonly nav: NavGrid
  readonly chaseField: Int16Array
  readonly hero = new Hero()
  readonly gun: Gun
  readonly powerUps: PowerUps
  readonly modifiers: PerkEffects
  readonly water = new Water()
  readonly door = new ExitDoor()
  readonly projectiles = new ProjectilePool(160)
  readonly enemies: Enemy[] = []
  readonly pickups: Pickup[] = []
  readonly random: IRandom
  readonly keysTotal: number
  readonly guardian: Enemy | null

  keysLeft: number
  kills = 0
  keysUnderwater = 0
  pearlsCollected = 0
  pearlsPicked = 0
  hurtCount = 0
  private keysPicked = 0
  private powerUpsPicked = 0
  private underwaterKeys = 0
  time = 0
  cleared = false
  deathReported = false

  private submergeReported = false
  private heldReported = false
  secondWinds: number
  private pearlCarry = 0

  private readonly stats: HeroStats
  readonly listener: WorldListener
  private readonly factory: IEnemyFactory
  private shellPlanned: boolean
  private readonly director: EnemyDirector
  private chaseTimer = 0

  constructor(setup: WorldSetup) {
    const { blueprint } = setup
    this.floor = blueprint.floor
    this.tier = setup.tier
    this.blueprint = blueprint
    this.map = blueprint.map
    this.nav = new NavGrid(this.map, { drops: false })
    this.chaseField = this.nav.createField()
    this.stats = setup.stats
    this.listener = setup.listener
    this.random = setup.random
    this.factory = setup.enemyFactory
    this.director = new EnemyDirector(this.factory, this.random.fork('director'), this.floor, setup.tier)
    this.gun = new Gun(setup.stats.gun)
    this.modifiers = setup.modifiers
    this.powerUps = new PowerUps(setup.modifiers.powerDuration)
    this.secondWinds = setup.secondWinds

    this.hero.maxHp = setup.stats.maxHp
    this.hero.hp = setup.hp
    this.hero.speedScale = setup.stats.speedScale
    this.hero.maxAir = setup.stats.maxAir
    this.hero.spawn(this.map, blueprint.heroSpawn)
    this.door.place(this.map, blueprint.exit)

    const topTier = blueprint.tierRows[blueprint.tierRows.length - 1] as number
    this.water.reset({
      startY: this.map.height,
      targetY: topTier * this.map.tile - this.hero.height / 2,
      riseTime: waterRiseTime(this.floor) * setup.stats.waterTimeScale,
      delay: BALANCE.water.startDelay + setup.modifiers.tideDelay,
    })

    for (const cell of blueprint.keys) {
      this.pickups.push(new Pickup('key', this.map.centerX(cell.c), this.map.feetY(cell.r)))
    }
    for (const cell of blueprint.pearls) {
      this.pickups.push(new Pickup('pearl', this.map.centerX(cell.c), this.map.feetY(cell.r)))
    }
    for (const spawn of blueprint.powerUps) {
      this.pickups.push(new Pickup(spawn.kind, this.map.centerX(spawn.c), this.map.feetY(spawn.r)))
    }
    const guardianFloor = isGuardianFloor(this.floor)
    this.variant = pickVariant(this.floor, guardianFloor, this.random.fork('variant'))
    this.guardian = guardianFloor ? this.factory.create('guardian', this.floor, setup.tier) : null
    if (this.guardian) {
      this.guardian.x = this.door.x
      this.guardian.y = this.door.y
      this.enemies.push(this.guardian)
    }
    for (const spawn of blueprint.enemies) {
      const enemy = this.factory.create(spawn.kind, this.floor, this.tier)
      enemy.place(this.map, spawn.c, spawn.r)
      this.enemies.push(enemy)
    }
    if (this.variant === 'keyCrab') this.handKeyToCrab()
    this.keysTotal = blueprint.keys.length
    this.keysLeft = this.keysTotal
    this.shellPlanned = this.floor >= BALANCE.shell.fromFloor && this.random.fork('shell').bool(BALANCE.shell.chance)
    const hazard = tierTheme(this.tier).hazard
    this.features = [...(hazard === 'none' ? [] : [hazard]), ...(this.variant === 'dark' ? (['dark'] as const) : [])]
    this.hazards = createHazards(this, hazard)
    this.placeCounters()
  }

  private placeCounters(): void {
    const map = this.map
    const random = this.random.fork('counters')
    const taken = (c: number, r: number): boolean =>
      this.pickups.some((pickup) => map.colAt(pickup.x) === c && map.rowAt(pickup.y - 1) === r) ||
      (map.colAt(this.hero.x) === c && map.rowAt(this.hero.y - 1) === r)
    const cells: Cell[] = []
    for (const row of this.blueprint.tierRows.slice(1, 4)) {
      for (let c = 0; c < map.cols; c++) {
        const r = row - 1
        if (map.canStand(c, r) && !map.isLadder(c, r) && !taken(c, r)) cells.push({ c, r })
      }
    }
    for (const feature of this.features) {
      if (cells.length === 0) return
      const cell = cells.splice(random.int(0, cells.length), 1)[0] as Cell
      this.pickups.push(new Pickup(FEATURE_COUNTERS[feature], map.centerX(cell.c), map.feetY(cell.r)))
    }
  }

  get tierRows(): readonly number[] {
    return this.blueprint.tierRows
  }

  get waterLevel(): number {
    return this.water.level
  }

  get active(): boolean {
    return this.hero.alive && !this.cleared
  }

  private handKeyToCrab(): void {
    const index = this.pickups.findIndex((pickup) => pickup.kind === 'key')
    const key = this.pickups[index]
    if (!key) return
    this.pickups.splice(index, 1)
    const crab = this.factory.createCarrier('key', this.floor, 1)
    crab.place(this.map, this.map.colAt(key.x), this.map.rowAt(key.y - 1))
    this.enemies.push(crab)
  }

  update(dt: number, controls: IControls): void {
    this.time += dt
    for (const kind of this.powerUps.update(dt)) this.listener.onPowerUpExpired(kind)
    if (this.powerUps.active('hourglass')) this.water.freeze(0.05)
    this.water.update(dt, this.map.tile)
    this.door.update(dt)

    const hero = this.hero
    hero.flow = 0
    hero.swimDrag = 1
    for (const hazard of this.hazards) hazard.update(dt, this)
    this.updateInk(dt)
    this.updateShell()
    const intent: HeroIntent = this.cleared
      ? { moveX: 0, moveY: 0 }
      : { moveX: controls.moveX, moveY: controls.moveY }
    const striding = this.powerUps.active('strider')
    hero.boost = striding ? BALANCE.pickups.striderBoost : 1
    hero.waterWalk = striding
    hero.update(dt, intent, this.map, this.water.level)
    if (hero.splashed) this.listener.onHeroSplash(hero.x, this.water.level)

    this.updateGun(dt, controls)
    this.updateChaseField(dt)
    this.updateEnemies(dt)
    this.updateProjectiles(dt)
    this.removeDeadEnemies()
    this.updateContacts()
    this.updatePickups(dt)
    this.updateSubmergedKeys()
    this.updateBreath(dt)
    this.updateExit()

    if (!hero.alive && !this.deathReported) {
      this.deathReported = true
      this.listener.onHeroDied()
    }
  }

  private updateGun(dt: number, controls: IControls): void {
    if (this.gun.update(dt)) this.listener.onReloaded()
    const hero = this.hero
    if (!hero.alive || this.cleared) return
    if (controls.reloadPressed && this.gun.startReload()) this.listener.onReloadStart()
    if (!controls.fireHeld) return
    const wasReloading = this.gun.reloading
    const result = this.gun.tryFire(this.powerUps.active('hotgun'))
    if (result === 'fired') {
      this.launchFlares()
      if (!wasReloading && this.gun.reloading) this.listener.onReloadStart()
    } else if (result === 'empty') {
      if (controls.firePressed) this.listener.onDryFire()
      if (this.gun.reloading) this.listener.onReloadStart()
    } else if (controls.firePressed && this.gun.reloading) {
      this.listener.onDryFire()
    }
  }

  private launchFlares(): void {
    const hero = this.hero
    const gun = this.gun.stats
    const weapon = BALANCE.weapon
    const powers = this.powerUps
    const effects: ProjectileEffects = {
      homing: powers.active('homing'),
      blast: powers.active('blast'),
      frost: powers.active('frost'),
      harpoon: powers.active('harpoon'),
    }
    const y = hero.y - weapon.muzzleY
    const directions: (1 | -1)[] = powers.active('twin') ? [hero.facing, hero.facing === 1 ? -1 : 1] : [hero.facing]
    const angles = powers.active('fan') ? [0, -weapon.fanAngle, weapon.fanAngle] : [0]
    const spacing = weapon.volleySpacing
    for (const direction of directions) {
      const x = hero.x + direction * 13
      for (const angle of angles) {
        for (let i = 0; i < gun.volley; i++) {
          this.projectiles.spawn({
            owner: 'hero',
            x: x - direction * Math.abs(i - (gun.volley - 1) / 2) * spacing,
            y: y + (i - (gun.volley - 1) / 2) * spacing,
            vx: Math.cos(angle) * weapon.flareSpeed * direction,
            vy: Math.sin(angle) * weapon.flareSpeed,
            damage: gun.damage + (effects.harpoon ? weapon.harpoonDamage : 0),
            pierce: effects.harpoon ? Number.POSITIVE_INFINITY : 0,
            range: weapon.flareRange * (effects.harpoon ? weapon.harpoonRange : 1),
            effects,
            look: 'flare',
          })
        }
      }
    }
    hero.recoil = 1
    this.listener.onShot(hero.x + hero.facing * 13, y, hero.facing)
  }

  fireSpine(x: number, y: number, direction: 1 | -1): void {
    this.projectiles.spawn({
      owner: 'enemy',
      x,
      y,
      vx: direction * BALANCE.urchin.spineSpeed,
      vy: 0,
      damage: 1,
      pierce: 0,
      range: BALANCE.urchin.rangeCells * this.map.tile * 1.4,
      effects: NO_EFFECTS,
      look: 'spine',
    })
    this.listener.onSpineFired(x, y)
  }

  fireInk(x: number, y: number, angle: number): void {
    const speed = BALANCE.guardian.inkSpeed
    this.projectiles.spawn({
      owner: 'enemy',
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      damage: 1,
      pierce: 0,
      range: BALANCE.guardian.inkRange,
      effects: NO_EFFECTS,
      look: 'ink',
    })
    this.listener.onSpineFired(x, y)
  }

  shock(x: number, y: number, radius: number): void {
    const hero = this.hero
    const hit =
      hero.alive && hero.inWater && Math.hypot(ringDelta(x, hero.x, this.map.width), hero.centerY - y) < radius
    this.shocks.push({ x, y, radius, age: 0 })
    this.listener.onShock(x, y, hit)
    if (hit) this.damageHero('jelly')
  }

  spillInk(x: number, y: number): void {
    this.inkClouds.push({ x, y, age: 0 })
  }

  hurtHero(cause: HurtCause): void {
    this.damageHero(cause)
  }

  hurtEnemy(enemy: Enemy, amount: number): void {
    if (!enemy.damage(amount)) return
    this.listener.onEnemyHit(enemy, enemy.x, enemy.centerY)
    if (!enemy.alive) this.killEnemy(enemy)
  }

  private updateInk(dt: number): void {
    const life = BALANCE.octopusInk.cloudTime
    for (const cloud of this.inkClouds) cloud.age += dt
    for (let i = this.inkClouds.length - 1; i >= 0; i--) {
      if ((this.inkClouds[i] as InkCloud).age > life) this.inkClouds.splice(i, 1)
    }
    for (const wave of this.shocks) wave.age += dt
    for (let i = this.shocks.length - 1; i >= 0; i--) {
      if ((this.shocks[i] as ShockWave).age > SHOCK_FADE) this.shocks.splice(i, 1)
    }
  }

  private updateShell(): void {
    if (!this.shellPlanned || !this.active) return
    if (this.water.level > this.map.height * (1 - BALANCE.shell.waterShare)) return
    this.shellPlanned = false
    const spot = this.planShellSpot()
    if (!spot) return
    const config = BALANCE.shell
    const value = (config.pearlsBase + config.pearlsPerFloor * this.floor) * this.tier
    const crab = this.factory.createCarrier('shell', this.floor, value)
    crab.place(this.map, spot.c, spot.r)
    crab.startEmerging(BALANCE.director.emergeTime * 1.6)
    this.enemies.push(crab)
    this.listener.onShellRevealed(crab.x, crab.centerY)
  }

  private planShellSpot(): Cell | null {
    const map = this.map
    const hero = this.hero
    const config = BALANCE.shell
    const swimSpeed = BALANCE.hero.swimSpeed * hero.speedScale
    const oneWay = (hero.maxAir * config.airShare - config.fightTime) / 2
    const budget = Math.floor((oneWay * swimSpeed) / map.tile)
    const surfaceRow = map.rowAt(this.water.level)
    const distance = new Int16Array(map.cols * map.rows).fill(-1)
    const queue: number[] = []
    for (let c = 0; c < map.cols; c++) {
      if (map.isSolid(c, surfaceRow) || map.isSolid(c, surfaceRow - 1)) continue
      const index = map.index(c, surfaceRow)
      distance[index] = 0
      queue.push(index)
    }
    for (let head = 0; head < queue.length; head++) {
      const index = queue[head] as number
      const { c, r } = map.cellOf(index)
      const step = (distance[index] as number) + 1
      if (step > budget) continue
      for (const [dc, dr] of NEIGHBOURS) {
        const nr = r + dr
        if (nr < surfaceRow || nr >= map.rows || map.isSolid(c + dc, nr)) continue
        const next = map.index(c + dc, nr)
        if ((distance[next] as number) >= 0) continue
        distance[next] = step
        queue.push(next)
      }
    }
    let best: Cell | null = null
    let bestScore = -1
    for (let index = 0; index < distance.length; index++) {
      const steps = distance[index] as number
      if (steps < 0) continue
      const { c, r } = map.cellOf(index)
      if (r <= surfaceRow + 1 || !map.canStand(c, r) || map.isLadder(c, r)) continue
      const score = r * 1000 + steps
      if (score <= bestScore) continue
      best = { c, r }
      bestScore = score
    }
    return best
  }

  private updateChaseField(dt: number): void {
    this.chaseTimer -= dt
    if (this.chaseTimer > 0) return
    this.chaseTimer = CHASE_REFRESH
    if (!this.enemies.some((enemy) => enemy.kind === 'octopus')) return
    this.nav.distanceField(this.chaseGoal(), this.chaseField)
  }

  private chaseGoal(): Cell {
    const map = this.map
    const { c, r } = this.hero.bodyCell(map)
    let row = r
    while (row < map.rows - 2 && !map.isLadder(c, row) && !map.isSupport(c, row + 1)) row++
    return { c, r: row }
  }

  private updateEnemies(dt: number): void {
    for (const enemy of this.enemies) enemy.update(dt, this)
    if (this.cleared || !this.hero.alive) return
    const spawned = this.director.update(dt, {
      map: this.map,
      tierRows: this.blueprint.tierRows,
      waterLevel: this.water.level,
      heroX: this.hero.x,
      heroY: this.hero.y,
      aliveEnemies: this.enemies.length,
    })
    if (spawned) {
      this.enemies.push(spawned)
      this.listener.onEnemySpawned(spawned)
    }
  }

  private updateProjectiles(dt: number): void {
    for (const projectile of this.projectiles.items) {
      if (!projectile.active) continue
      projectile.age += dt
      if (projectile.effects.homing) this.steer(projectile, dt)
      const stepX = projectile.vx * dt
      const stepY = projectile.vy * dt
      projectile.x = this.map.wrapX(projectile.x + stepX)
      projectile.y += stepY
      projectile.travelled += Math.hypot(stepX, stepY)
      const row = this.map.rowAt(projectile.y)
      if (row < 0 || row >= this.map.rows) {
        projectile.active = false
        continue
      }
      if (!PHASING_LOOKS.has(projectile.look) && this.map.isSolid(this.map.colAt(projectile.x), row)) {
        projectile.active = false
        const ix = projectile.x - stepX * 0.5
        const iy = projectile.y - stepY * 0.5
        this.listener.onFlareImpact(ix, iy)
        if (projectile.effects.blast) this.explode(ix, iy, projectile.damage, null)
        continue
      }
      if (projectile.travelled > projectile.range) {
        projectile.active = false
        continue
      }
      if (projectile.owner === 'hero') this.hitEnemies(projectile)
      else this.hitHero(projectile)
    }
  }

  private hitEnemies(projectile: Projectile): void {
    for (const enemy of this.enemies) {
      if (!enemy.alive || !enemy.canBeHit || projectile.hits.has(enemy.id)) continue
      if (!pointInBox(projectile.x, projectile.y, enemy, this.map.width, 4)) continue
      projectile.hits.add(enemy.id)
      enemy.damage(projectile.damage)
      enemy.x = this.map.wrapX(enemy.x + Math.sign(projectile.vx) * 3)
      if (projectile.effects.frost && enemy.alive) enemy.freeze(BALANCE.weapon.frostTime)
      this.listener.onEnemyHit(enemy, projectile.x, projectile.y)
      if (!enemy.alive) this.killEnemy(enemy)
      if (projectile.effects.blast) this.explode(projectile.x, projectile.y, projectile.damage, enemy)
      if (projectile.pierce > 0) {
        projectile.pierce--
        continue
      }
      projectile.active = false
      return
    }
  }

  private steer(projectile: Projectile, dt: number): void {
    const speed = Math.hypot(projectile.vx, projectile.vy) || 1
    let target: Enemy | null = null
    let best: number = BALANCE.weapon.homingRadius
    for (const enemy of this.enemies) {
      if (!enemy.alive || !enemy.canBeHit || projectile.hits.has(enemy.id)) continue
      const dx = ringDelta(projectile.x, enemy.x, this.map.width)
      const dy = enemy.centerY - projectile.y
      const distance = Math.hypot(dx, dy)
      if (distance >= best || dx * projectile.vx + dy * projectile.vy < -0.2 * distance * speed) continue
      target = enemy
      best = distance
    }
    if (!target) return
    const desired = Math.atan2(target.centerY - projectile.y, ringDelta(projectile.x, target.x, this.map.width))
    const current = Math.atan2(projectile.vy, projectile.vx)
    const turn = BALANCE.weapon.homingTurn * dt
    const angle = current + Math.max(-turn, Math.min(turn, angleDelta(current, desired)))
    projectile.vx = Math.cos(angle) * speed
    projectile.vy = Math.sin(angle) * speed
  }

  private explode(x: number, y: number, damage: number, spared: Enemy | null): void {
    this.listener.onExplosion(x, y)
    const radius = BALANCE.weapon.blastRadius
    for (const enemy of this.enemies) {
      if (enemy === spared || !enemy.alive || !enemy.canBeHit) continue
      if (Math.hypot(ringDelta(x, enemy.x, this.map.width), enemy.centerY - y) > radius) continue
      enemy.damage(damage)
      this.listener.onEnemyHit(enemy, enemy.x, enemy.centerY)
      if (!enemy.alive) this.killEnemy(enemy)
    }
  }

  private hitHero(projectile: Projectile): void {
    const hero = this.hero
    if (!hero.alive || !pointInBox(projectile.x, projectile.y, hero, this.map.width, 2)) return
    projectile.active = false
    this.damageHero(projectile.look === 'ink' ? 'guardian' : 'spine')
  }

  private killEnemy(enemy: Enemy): void {
    this.kills++
    for (let i = 0; i < enemy.pearls; i++) this.dropPickup('pearl', enemy.x, enemy.centerY)
    if (enemy.loot) this.dropLoot(enemy.loot, enemy.lootValue, enemy.x, enemy.centerY)
    if (enemy.isBoss) {
      for (let i = 0; i < this.floor * BALANCE.guardian.pearlsPerFloor; i++) {
        this.dropPickup('pearl', enemy.x, enemy.centerY)
      }
      this.dropPickup('heart', enemy.x, enemy.centerY)
    } else if (this.random.bool(BALANCE.pickups.dropPowerChance * this.modifiers.dropChance)) {
      const counters = this.features.map((feature) => ({ value: FEATURE_COUNTERS[feature], weight: COUNTER_DROP_WEIGHT }))
      this.dropPickup(this.random.weighted([...POWER_UP_WEIGHTS, ...counters]), enemy.x, enemy.centerY)
    }
    this.listener.onEnemyKilled(enemy)
    if (enemy.isBoss) this.listener.onGuardianDefeated(enemy)
  }

  private removeDeadEnemies(): void {
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      if (!(this.enemies[i] as Enemy).alive) this.enemies.splice(i, 1)
    }
  }

  private dropPickup(kind: PickupKind, x: number, y: number, value = 1): void {
    const pickup = new Pickup(kind, x, y, value, false)
    pickup.vx = this.random.float(-90, 90)
    pickup.vy = this.random.float(-260, -160)
    this.pickups.push(pickup)
  }

  private dropLoot(loot: CarrierLoot, value: number, x: number, y: number): void {
    this.dropPickup(loot, x, y, Math.max(1, value))
  }

  private updateContacts(): void {
    const hero = this.hero
    if (!hero.alive || hero.invulnerable > 0 || this.cleared) return
    for (const enemy of this.enemies) {
      if (!enemy.alive || !enemy.canHurt) continue
      if (!boxesOverlap(hero, enemy, this.map.width, 4)) continue
      this.damageHero(enemy.kind)
      return
    }
  }

  private damageHero(cause: HurtCause): void {
    const hero = this.hero
    if (hero.invulnerable > 0 || !hero.alive) return
    if (this.powerUps.active('shield') && cause !== 'water') {
      hero.invulnerable = 0.6
      this.listener.onShieldBlock()
      return
    }
    if (hero.hp <= 1 && this.secondWinds > 0) {
      this.secondWinds -= 1
      hero.hp = Math.max(1, this.modifiers.secondWindHearts)
      hero.air = hero.maxAir
      hero.invulnerable = BALANCE.hero.secondWindGrace
      this.listener.onSecondWind()
      return
    }
    if (!hero.hurt(1)) return
    this.hurtCount++
    this.listener.onHeroHurt(cause)
  }

  takeTally(): FloorTally {
    const tally = {
      kills: this.kills,
      keys: this.keysPicked,
      powerUps: this.powerUpsPicked,
      underwaterKeys: this.underwaterKeys,
    }
    this.kills = 0
    this.keysPicked = 0
    this.powerUpsPicked = 0
    this.underwaterKeys = 0
    return tally
  }

  addBonusPearls(amount: number): number {
    const gained = this.multiplyPearls(amount)
    this.pearlsCollected += gained
    return gained
  }

  private multiplyPearls(amount: number): number {
    const exact = amount * this.modifiers.pearlMultiplier + this.pearlCarry
    const whole = Math.floor(exact)
    this.pearlCarry = exact - whole
    return whole
  }

  private updatePickups(dt: number): void {
    const hero = this.hero
    const magnet = this.stats.magnet
    for (const pickup of this.pickups) {
      if (!pickup.alive) continue
      pickup.age += dt
      const dx = ringDelta(pickup.x, hero.x, this.map.width)
      const dy = hero.centerY - (pickup.y - 10)
      const distance = Math.hypot(dx, dy)
      const reach = pickup.kind === 'key' ? magnet * this.modifiers.keyMagnet : MAGNETIC.has(pickup.kind) ? magnet : 0
      if (hero.alive && reach > 0 && distance < reach + PICKUP_RADIUS) pickup.pulled = true
      if (pickup.pulled && hero.alive) {
        const step = Math.min(distance, BALANCE.pickups.magnetPull * dt)
        pickup.x = this.map.wrapX(pickup.x + (dx / (distance || 1)) * step)
        pickup.y += (dy / (distance || 1)) * step
      } else if (!pickup.resting) {
        this.fallPickup(pickup, dt)
      }
      if (!hero.alive || this.cleared) continue
      if (!this.canCollect(pickup)) continue
      pickup.alive = false
      const report = this.applyPickup(pickup)
      this.listener.onPickup(report.kind, pickup.x, pickup.y - 10, report.value)
    }
    for (let i = this.pickups.length - 1; i >= 0; i--) {
      if (!(this.pickups[i] as Pickup).alive) this.pickups.splice(i, 1)
    }
  }

  private updateSubmergedKeys(): void {
    let count = 0
    for (const pickup of this.pickups) {
      if (pickup.alive && pickup.kind === 'key' && this.water.covers(pickup.y - 10)) count++
    }
    this.keysUnderwater = count
    if (count === 0 || this.submergeReported || !this.hero.alive) return
    this.submergeReported = true
    this.listener.onKeysSubmerged(count)
  }

  private canCollect(pickup: Pickup): boolean {
    const hero = this.hero
    const dx = ringDelta(pickup.x, hero.x, this.map.width)
    return Math.hypot(dx, hero.centerY - (pickup.y - 10)) <= (pickup.kind === 'key' ? KEY_RADIUS : PICKUP_RADIUS)
  }

  private fallPickup(pickup: Pickup, dt: number): void {
    const map = this.map
    pickup.vy = Math.min(520, pickup.vy + BALANCE.pickups.gravity * dt)
    const nextX = map.wrapX(pickup.x + pickup.vx * dt)
    if (map.isSolid(map.colAt(nextX), map.rowAt(pickup.y - 6))) pickup.vx *= -0.5
    else pickup.x = nextX
    pickup.vx *= 1 - Math.min(1, dt * 1.5)
    const previous = pickup.y
    const next = previous + pickup.vy * dt
    if (pickup.vy > 0) {
      const col = map.colAt(pickup.x)
      for (let k = Math.floor(previous / map.tile) + 1; k <= Math.floor(next / map.tile); k++) {
        if (!map.isSupport(col, k)) continue
        pickup.y = k * map.tile
        pickup.vy = 0
        pickup.vx = 0
        pickup.resting = true
        return
      }
    }
    pickup.y = Math.min(next, map.height - map.tile)
  }

  private applyPickup(pickup: Pickup): { kind: PickupKind; value: number } {
    switch (pickup.kind) {
      case 'key':
        this.keysLeft = Math.max(0, this.keysLeft - 1)
        this.keysPicked++
        if (this.hero.underwater) this.underwaterKeys++
        break
      case 'pearl':
      case 'shell': {
        const gained = this.multiplyPearls(pickup.value)
        this.pearlsCollected += gained
        this.pearlsPicked += gained
        return { kind: pickup.kind, value: gained }
      }
      case 'heart':
        this.hero.heal(1)
        this.powerUpsPicked++
        break
      default:
        if (isPowerUpKind(pickup.kind)) this.powerUps.activate(pickup.kind)
        this.powerUpsPicked++
    }
    return { kind: pickup.kind, value: pickup.value }
  }

  private updateBreath(dt: number): void {
    const hero = this.hero
    if (!hero.alive || this.cleared || !hero.underwater) {
      hero.air = Math.min(hero.maxAir, hero.air + BALANCE.hero.airRefill * dt)
      hero.drownTimer = 0
      return
    }
    const before = hero.air
    hero.air = Math.max(0, hero.air - dt)
    if (hero.air > 0) {
      const left = Math.ceil(hero.air)
      if (left <= BALANCE.hero.airWarning && left < Math.ceil(before)) this.listener.onAirLow(left)
      return
    }
    hero.drownTimer -= dt
    if (hero.drownTimer > 0) return
    hero.drownTimer = BALANCE.hero.drownInterval
    this.listener.onDrowning(hero.x, hero.headY)
    this.damageHero('water')
  }

  private updateExit(): void {
    const guarded = this.guardian?.alive ?? false
    if (!this.door.open && this.keysLeft === 0 && guarded && !this.heldReported) {
      this.heldReported = true
      this.listener.onDoorHeld()
    }
    if (!this.door.open && this.keysLeft === 0 && !guarded) {
      this.door.open = true
      this.water.boost = BALANCE.water.openBoost
      this.listener.onDoorOpened()
    }
    const hero = this.hero
    if (this.cleared || !this.door.open || !hero.alive) return
    if (hero.state !== 'ground' && hero.state !== 'swim') return
    if (Math.abs(ringDelta(this.door.x, hero.x, this.map.width)) > 12 || Math.abs(hero.y - this.door.y) > 8) return
    this.cleared = true
    this.listener.onFloorCleared()
  }
}
