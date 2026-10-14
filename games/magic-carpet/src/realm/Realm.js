import { wrapDelta } from '../core/math.js'
import { Castle } from './Castle.js'
import { Construction } from './Construction.js'
import { PLAYER } from './ManaField.js'

export class Realm {
  #mesh
  #terrain
  #forest
  #model
  #config
  #player
  #mana
  #reserve
  #balloons
  #units
  #structures
  #notify
  #construction = null
  #balanced = false
  #seen = { dx: 0, dy: 0, dz: 0 }
  castles
  hostiles = []
  playerCastle = null
  goal = 1

  constructor({ mesh, terrain, forest, model, config, player, mana, reserve, balloons, castles, units, structures, notify }) {
    this.#mesh = mesh
    this.#terrain = terrain
    this.#forest = forest
    this.#model = model
    this.#config = config
    this.#player = player
    this.#mana = mana
    this.#reserve = reserve
    this.#balloons = balloons
    this.#units = units
    this.#structures = structures
    this.#notify = notify
    this.castles = castles
  }

  setGoal(totalMana) {
    this.goal = Math.max(1, Math.round(totalMana * this.#config.goalShare))
  }

  get equilibrium() {
    return this.playerCastle ? Math.min(1, this.playerCastle.mana / this.goal) : 0
  }

  get building() {
    return this.#construction !== null || Boolean(this.playerCastle?.rising)
  }

  nextLevelMana() {
    const castle = this.playerCastle
    if (!castle || castle.level >= 7) return null
    return this.#config.levelMana[castle.level + 1]
  }

  isHome(x, y) {
    const castle = this.playerCastle
    if (!castle) return false
    return Math.hypot(wrapDelta(x - castle.x, this.#mesh.size), wrapDelta(y - castle.y, this.#mesh.size)) <= castle.plaza
  }

  castleRules() {
    return {
      cost: (target) => (this.#ownCastleAt(target.x, target.y) ? this.#config.upgradeCost : this.#config.buildCost),
      refuse: (target) => this.#refuseCastle(target.x, target.y),
    }
  }

  castCastle(x, y) {
    if (this.#refuseCastle(x, y)) return
    if (this.#ownCastleAt(x, y)) {
      const castle = this.playerCastle
      castle.raise(castle.level + 1)
      this.#notify(`Замок зростає: рівень ${castle.level}`)
      return
    }
    this.#found(x, y)
  }

  possessNear(x, y, z, radius) {
    const mana = this.#mana
    const target = mana.nearest(x, y, z, radius, (i) => mana.owner[i] !== PLAYER)
    if (target < 0) return false
    mana.possess(target, PLAYER)
    return true
  }

  findForeignMana(x, y, z, ux, uy, uz, range, cosCone) {
    const mana = this.#mana
    const size = this.#mesh.size
    let best = -1
    let bestScore = Infinity
    for (let i = 0; i < mana.capacity; i++) {
      if (!mana.isFree(i) || mana.owner[i] === PLAYER) continue
      const dx = wrapDelta(mana.x[i] - x, size)
      const dy = wrapDelta(mana.y[i] - y, size)
      const dz = mana.z[i] - z
      const distance = Math.hypot(dx, dy, dz)
      if (distance > range || distance < 1e-3) continue
      const facing = (dx * ux + dy * uy + dz * uz) / distance
      if (facing < cosCone) continue
      const score = distance * (2 - facing)
      if (score < bestScore) {
        bestScore = score
        best = i
      }
    }
    if (best < 0) return null
    this.#seen.dx = wrapDelta(mana.x[best] - x, size)
    this.#seen.dy = wrapDelta(mana.y[best] - y, size)
    this.#seen.dz = mana.z[best] - z
    return this.#seen
  }

  findHostile(x, y, z, ux, uy, uz, range, cosCone) {
    const size = this.#mesh.size
    let best = null
    let bestScore = Infinity
    for (const hostile of this.hostiles) {
      const dx = wrapDelta(hostile.x - x, size)
      const dy = wrapDelta(hostile.y - y, size)
      const dz = hostile.z - z
      const distance = Math.hypot(dx, dy, dz)
      if (distance > range || distance < 1e-3) continue
      const facing = (dx * ux + dy * uy + dz * uz) / distance
      if (facing < cosCone) continue
      const score = distance * (2 - facing)
      if (score < bestScore) {
        bestScore = score
        best = hostile
      }
    }
    if (!best) return null
    this.#seen.dx = wrapDelta(best.x - x, size)
    this.#seen.dy = wrapDelta(best.y - y, size)
    this.#seen.dz = best.z - z
    return this.#seen
  }

  update(dt, carpet) {
    if (this.#construction) {
      this.#construction.update(dt)
      if (this.#construction.done) this.#construction = null
    }
    for (const castle of this.castles) castle.update(dt)
    this.#balloons.update(dt, this.playerCastle)
    this.#reserve.update(dt, this.isHome(carpet.x, carpet.y))
    if (!this.#balanced && this.equilibrium >= 1) {
      this.#balanced = true
      this.#notify('Рівновагу світу відновлено!')
    }
  }

  #ownCastleAt(x, y) {
    return this.isHome(x, y)
  }

  #refuseCastle(x, y) {
    const config = this.#config
    if (this.building) return 'Замок ще будується'
    const own = this.playerCastle
    if (own) {
      if (!this.#ownCastleAt(x, y)) return 'Твій замок уже стоїть — цілься в нього, щоб наростити'
      if (own.level >= 7) return 'Замок уже найбільший'
      const needed = config.levelMana[own.level + 1]
      if (own.mana < needed) return `Для рівня ${own.level + 1} треба ${needed} мани в замку`
      return null
    }
    const size = this.#mesh.size
    const crowded = this.castles.some(
      (castle) => Math.hypot(wrapDelta(x - castle.x, size), wrapDelta(y - castle.y, size)) < config.castleSpacing,
    )
    if (crowded) return 'Надто близько до іншого замку'
    let wet = 0
    for (let k = 0; k < 16; k++) {
      const angle = (k / 16) * Math.PI * 2
      const r = config.plazaRadius * (k % 2 ? 0.45 : 0.85)
      if (this.#mesh.surfaceAt(x + Math.cos(angle) * r, y + Math.sin(angle) * r) < this.#mesh.seaLevel + 0.5) wet++
    }
    if (this.#mesh.surfaceAt(x, y) < this.#mesh.seaLevel + 0.5 || wet > 4) return 'Замок треба ставити на суходолі'
    return null
  }

  #found(x, y) {
    const config = this.#config
    const size = this.#mesh.size
    const site = {
      x: ((x % size) + size) % size,
      y: ((y % size) + size) % size,
      plaza: config.plazaRadius,
      plateau: Construction.plateauFor(this.#mesh, x, y, config.plazaRadius),
      level: 0,
      color: this.#player.color,
      owner: PLAYER,
      banner: 0,
    }
    this.#terrain.castles.push(site)
    this.#notify('Земля вирівнюється під замок…')
    this.#construction = new Construction({
      mesh: this.#mesh,
      terrain: this.#terrain,
      forest: this.#forest,
      site,
      reach: config.plazaRadius + config.blendReach,
      duration: config.levelTime,
      onLevelled: () => this.#rise(site),
    })
  }

  #rise(site) {
    const castle = new Castle(site, this.#model, this.#config, 7)
    this.playerCastle = castle
    this.castles.push(castle)
    this.#units.push(...castle.units)
    this.#structures.push(castle)
    castle.raise(1)
    this.#notify('Замок виростає з землі!')
  }
}

