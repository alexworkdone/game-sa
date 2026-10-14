export class ManaReserve {
  #config

  constructor(config) {
    this.#config = config
    this.max = config.max
    this.value = config.max
  }

  update(dt, atHome) {
    const regen = atHome ? this.#config.castleRegen : this.#config.regen
    this.value = Math.min(this.max, this.value + regen * dt)
  }

  spend(amount) {
    if (this.value < amount) return false
    this.value -= amount
    return true
  }

  refund(amount) {
    this.value = Math.min(this.max, this.value + amount)
  }
}
