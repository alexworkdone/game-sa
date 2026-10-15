import { wrapDelta } from '../core/math.js'
import { gapTo, topOf } from '../world/colliders.js'

const easeOut = (t) => 1 - Math.pow(1 - t, 3)

export class Castle {
  #rise = new Float32Array(8).fill(1)
  #falling = new Uint8Array(8)
  #riseTime
  #riseDepth
  #toughness
  #regen
  #regenDelay
  #alarm
  #sinceHit = Infinity
  #active = []

  constructor({ x, y, plateau, plaza, level, banner, color, owner = null, mana = 0 }, model, config, upTo = level) {
    this.x = x
    this.y = y
    this.plateau = plateau
    this.plaza = plaza
    this.reach = plaza
    this.level = level
    this.banner = banner
    this.color = color
    this.owner = owner
    this.mana = mana
    this.#riseTime = config.riseTime
    this.#riseDepth = config.riseDepth
    this.#toughness = config.health
    this.#regen = config.healthRegen
    this.#regenDelay = config.regenDelay
    this.#alarm = config.alarm
    this.maxHealth = this.#toughness[level] ?? 0
    this.health = this.maxHealth
    const parts = model.build(this, upTo)
    this.units = parts.units.map((unit) => ({ ...unit, owner: this }))
    this.allColliders = parts.colliders
    this.#refresh()
  }

  get colliders() {
    return this.#active
  }

  get rising() {
    return this.#rise.some((value, level) => value < 1 && level <= this.level)
  }

  get standing() {
    return this.level > 0
  }

  get underAttack() {
    return this.#sinceHit < this.#alarm
  }

  get struckAgo() {
    return this.#sinceHit
  }

  shows(unit) {
    return unit.level <= this.level || this.#falling[unit.level] === 1
  }

  sinkOf(unit) {
    return (1 - easeOut(this.#rise[unit.level])) * this.#riseDepth
  }

  raise(level) {
    this.level = level
    this.#rise[level] = 0
    this.#falling[level] = 0
    const toughest = this.#toughness[level] ?? this.maxHealth
    this.health += toughest - this.maxHealth
    this.maxHealth = toughest
    this.#refresh()
  }

  struck(x, y, z, radius, worldSize) {
    if (!this.standing || z < this.plateau - radius) return false
    const dx = wrapDelta(x - this.x, worldSize)
    const dy = wrapDelta(y - this.y, worldSize)
    if (Math.abs(dx) > this.reach + radius || Math.abs(dy) > this.reach + radius) return false
    const px = this.x + dx
    const py = this.y + dy
    return this.#active.some((shape) => gapTo(shape, px, py) <= radius && z <= topOf(shape) + radius)
  }

  lower(floor) {
    if (this.level <= floor) return false
    this.#falling[this.level] = 1
    this.level--
    this.maxHealth = this.#toughness[this.level] ?? this.maxHealth
    this.health = Math.min(this.health, this.maxHealth)
    this.#refresh()
    return true
  }

  damage(amount) {
    this.health = Math.max(0, this.health - amount)
    this.#sinceHit = 0
    return this.health <= 0
  }

  heal(share) {
    this.health = Math.max(this.health, this.maxHealth * share)
  }

  update(dt) {
    let changed = false
    for (let level = 1; level < this.#rise.length; level++) {
      if (this.#falling[level]) {
        this.#rise[level] = Math.max(0, this.#rise[level] - dt / this.#riseTime)
        if (this.#rise[level] === 0) this.#falling[level] = 0
        changed = true
        continue
      }
      if (this.#rise[level] >= 1 || level > this.level) continue
      this.#rise[level] = Math.min(1, this.#rise[level] + dt / this.#riseTime)
      changed = true
    }
    if (changed) this.#refresh()
    this.#sinceHit += dt
    if (this.#sinceHit > this.#regenDelay && this.health < this.maxHealth) {
      this.health = Math.min(this.maxHealth, this.health + this.#regen * dt)
    }
  }

  #refresh() {
    this.#active = this.allColliders.filter((collider) => collider.level <= this.level && this.#rise[collider.level] > 0.65)
    this.top = this.#active.reduce((top, collider) => Math.max(top, topOf(collider)), this.plateau)
  }
}
