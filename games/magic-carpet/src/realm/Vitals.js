export class Vitals {
  #config
  #sinceHit = Infinity
  #shield = 0
  health
  max

  constructor(config) {
    this.#config = config
    this.max = config.health
    this.health = config.health
  }

  get hurtAgo() {
    return this.#sinceHit
  }

  damage(amount) {
    if (this.#shield > 0 || this.health <= 0) return false
    this.health = Math.max(0, this.health - amount)
    this.#sinceHit = 0
    return this.health <= 0
  }

  revive() {
    this.health = this.max
    this.#shield = this.#config.shield
    this.#sinceHit = Infinity
  }

  update(dt, home) {
    this.#sinceHit += dt
    this.#shield = Math.max(0, this.#shield - dt)
    if (this.#sinceHit < this.#config.regenDelay || this.health >= this.max) return
    this.health = Math.min(this.max, this.health + (home ? this.#config.homeRegen : this.#config.regen) * dt)
  }
}
