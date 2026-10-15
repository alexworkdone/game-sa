import { wrapDelta } from '../core/math.js'
import { Castle } from './Castle.js'
import { Construction } from './Construction.js'
import { PLAYER, manaRadius } from './ManaField.js'

export class Realm {
  #mesh
  #terrain
  #cover
  #model
  #config
  #player
  #mana
  #reserve
  #balloons
  #units
  #structures
  #notify
  #manaScale
  #manaHover
  #probe
  #construction = null
  #completed = false
  #announced = 0
  #seen = { dx: 0, dy: 0, dz: 0 }
  castles
  playerCastle = null
  goal = 1

  constructor({ mesh, terrain, cover, model, config, player, mana, manaScale, manaHover, probe, reserve, balloons, castles, units, structures, notify }) {
    this.#manaScale = manaScale
    this.#manaHover = manaHover
    this.#probe = probe
    this.#mesh = mesh
    this.#terrain = terrain
    this.#cover = cover
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

  get balloons() {
    return this.#balloons.balloons
  }

  get progress() {
    return this.playerCastle ? Math.min(1, this.playerCastle.mana / this.goal) : 0
  }

  get upgradeReady() {
    const next = this.nextLevelMana()
    return next !== null && !this.building && this.playerCastle.mana >= next
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
    const size = this.#mesh.size
    let best = -1
    let bestGap = Infinity
    for (let i = 0; i < mana.capacity; i++) {
      if (!mana.isFree(i) || mana.owner[i] === PLAYER) continue
      const distance = Math.hypot(wrapDelta(mana.x[i] - x, size), wrapDelta(mana.y[i] - y, size), mana.z[i] - z)
      const gap = distance - manaRadius(mana.value[i], this.#manaScale)
      if (gap <= radius && gap < bestGap) {
        bestGap = gap
        best = i
      }
    }
    if (best < 0) return false
    mana.possess(best, PLAYER)
    return true
  }

  findForeignMana(x, y, z, ux, uy, uz, range, cosCone) {
    return this.#seekMana(x, y, z, ux, uy, uz, range, cosCone, (i) => this.#mana.owner[i] !== PLAYER)
  }

  findMana(x, y, z, ux, uy, uz, range, cosCone) {
    return this.#seekMana(x, y, z, ux, uy, uz, range, cosCone, () => true)
  }

  #seekMana(x, y, z, ux, uy, uz, range, cosCone, accept) {
    const mana = this.#mana
    const size = this.#mesh.size
    let best = -1
    let bestScore = Infinity
    for (let i = 0; i < mana.capacity; i++) {
      if (!mana.isFree(i) || !accept(i)) continue
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

  dropMana(x, y, value) {
    this.#mana.add(x, y, this.#probe.groundAt(x, y) + this.#manaHover + manaRadius(value, this.#manaScale), value)
  }

  damageCastle(castle, amount) {
    if (castle.standing && castle.damage(amount)) this.#ruin(castle)
  }

  blast(x, y, z, damage, radius) {
    const size = this.#mesh.size
    for (const castle of this.castles) {
      if (castle !== this.playerCastle && castle.struck(x, y, z, radius, size)) this.damageCastle(castle, damage)
    }
  }

  update(dt, carpet) {
    if (this.#construction) {
      const construction = this.#construction
      construction.update(dt)
      this.#mana.settle(this.#probe, construction.site.x, construction.site.y, construction.reach, this.#manaHover, this.#manaScale)
      if (construction.done) this.#construction = null
    }
    for (const castle of this.castles) castle.update(dt)
    const waiting = this.upgradeReady
    this.#balloons.update(dt, this.playerCastle, waiting)
    this.#reserve.update(dt, this.isHome(carpet.x, carpet.y))
    if (waiting && this.#announced !== this.playerCastle.level + 1) {
      this.#announced = this.playerCastle.level + 1
      this.#notify(`Мани досить на рівень ${this.#announced} — наростіть замок, кулі чекають`)
    }
    if (!this.#completed && this.progress >= 1) {
      this.#completed = true
      this.#notify('Прогрес 100% — світ відновлено!')
    }
  }

  #ruin(castle) {
    const config = this.#config
    const own = castle === this.playerCastle
    const lowered = castle.lower(own ? 1 : 0)
    const spilled = castle.standing ? castle.mana * config.spillShare : castle.mana
    castle.mana -= spilled
    this.#spill(castle, spilled)
    castle.heal(config.ruinHealth)
    if (!own) {
      this.#notify(castle.standing ? `Чужий замок упав до рівня ${castle.level} — мана розсипалась` : 'Чужий замок зруйновано вщент!')
      return
    }
    this.#announced = castle.level + 1
    this.#notify(lowered ? `Замок зруйновано до рівня ${castle.level} — мана розсипалась!` : 'Замок ледь тримається — мана розсипалась!')
  }

  #spill(castle, amount) {
    const count = this.#config.spillPearls
    const value = amount / count
    if (value < 1) return
    for (let k = 0; k < count; k++) {
      const angle = k * 2.39996 + castle.x
      const reach = castle.plaza * (0.7 + 0.25 * ((k * 0.618) % 1))
      const x = castle.x + Math.cos(angle) * reach
      const y = castle.y + Math.sin(angle) * reach
      this.dropMana(x, y, value)
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
      (castle) => castle.standing && Math.hypot(wrapDelta(x - castle.x, size), wrapDelta(y - castle.y, size)) < config.castleSpacing,
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
      cover: this.#cover,
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

