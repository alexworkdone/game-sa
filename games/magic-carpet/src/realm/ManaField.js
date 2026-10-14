import { wrapDelta } from '../core/math.js'

export const NEUTRAL = 0
export const PLAYER = 1

const FREE = 1

export class ManaField {
  #size

  constructor(capacity, worldSize) {
    this.#size = worldSize
    this.capacity = capacity
    this.state = new Uint8Array(capacity)
    this.owner = new Uint8Array(capacity)
    this.reserved = new Uint8Array(capacity)
    this.x = new Float32Array(capacity)
    this.y = new Float32Array(capacity)
    this.z = new Float32Array(capacity)
    this.value = new Float32Array(capacity)
    this.phase = new Float32Array(capacity)
  }

  isFree(i) {
    return this.state[i] === FREE
  }

  add(x, y, z, value, owner = NEUTRAL) {
    const slot = this.state.indexOf(0)
    if (slot < 0) return -1
    this.state[slot] = FREE
    this.owner[slot] = owner
    this.reserved[slot] = 0
    this.x[slot] = ((x % this.#size) + this.#size) % this.#size
    this.y[slot] = ((y % this.#size) + this.#size) % this.#size
    this.z[slot] = z
    this.value[slot] = value
    this.phase[slot] = Math.random() * Math.PI * 2
    return slot
  }

  scatter(random, count, ground, config) {
    let total = 0
    for (let n = 0; n < count; n++) {
      const x = random.range(0, this.#size)
      const y = random.range(0, this.#size)
      const value = Math.round(random.range(config.minValue, config.maxValue))
      this.add(x, y, ground.groundAt(x, y) + config.hover, value)
      total += value
    }
    return total
  }

  nearest(x, y, z, radius, accept) {
    let best = -1
    let bestDistance = radius
    for (let i = 0; i < this.capacity; i++) {
      if (this.state[i] !== FREE || !accept(i)) continue
      const distance = Math.hypot(wrapDelta(this.x[i] - x, this.#size), wrapDelta(this.y[i] - y, this.#size), this.z[i] - z)
      if (distance < bestDistance) {
        bestDistance = distance
        best = i
      }
    }
    return best
  }

  possess(i, owner) {
    this.owner[i] = owner
    this.reserved[i] = 0
  }

  collect(i) {
    this.state[i] = 0
    return this.value[i]
  }
}
