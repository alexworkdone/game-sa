const easeOut = (t) => 1 - Math.pow(1 - t, 3)

export class Castle {
  #rise = new Float32Array(8).fill(1)
  #riseTime
  #riseDepth
  #active = []

  constructor({ x, y, plateau, plaza, level, banner, color, owner = null, mana = 0 }, model, { riseTime, riseDepth }, upTo = level) {
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
    this.#riseTime = riseTime
    this.#riseDepth = riseDepth
    const parts = model.build(this, upTo)
    this.units = parts.units.map((unit) => ({ ...unit, owner: this }))
    this.allColliders = parts.colliders
    this.#refresh()
  }

  get colliders() {
    return this.#active
  }

  get rising() {
    return this.#rise.some((value) => value < 1)
  }

  shows(unit) {
    return unit.level <= this.level
  }

  sinkOf(unit) {
    return (1 - easeOut(this.#rise[unit.level])) * this.#riseDepth
  }

  raise(level) {
    this.level = level
    this.#rise[level] = 0
    this.#refresh()
  }

  update(dt) {
    let changed = false
    for (let level = 1; level < this.#rise.length; level++) {
      if (this.#rise[level] >= 1) continue
      this.#rise[level] = Math.min(1, this.#rise[level] + dt / this.#riseTime)
      changed = true
    }
    if (changed) this.#refresh()
  }

  #refresh() {
    this.#active = this.allColliders.filter((collider) => collider.level <= this.level && this.#rise[collider.level] > 0.65)
  }
}
