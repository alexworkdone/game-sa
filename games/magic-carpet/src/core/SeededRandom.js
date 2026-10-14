export class SeededRandom {
  #state

  constructor(seed) {
    this.#state = seed >>> 0 || 1
  }

  next() {
    this.#state = (this.#state + 0x6d2b79f5) >>> 0
    let t = this.#state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }

  range(min, max) {
    return min + (max - min) * this.next()
  }

  int(min, max) {
    return Math.floor(this.range(min, max + 1))
  }

  pick(list) {
    return list[Math.floor(this.next() * list.length)]
  }
}
