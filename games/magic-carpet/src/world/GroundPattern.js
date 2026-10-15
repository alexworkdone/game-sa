import { PeriodicNoise } from './PeriodicNoise.js'

const RELIEF_RING = Array.from({ length: 6 }, (_, k) => [Math.cos((k / 6) * Math.PI * 2), Math.sin((k / 6) * Math.PI * 2)])

export class GroundPattern {
  #terrain
  #noise
  #reliefRadius

  constructor(terrain, seed, { reliefRadius }) {
    this.#terrain = terrain
    this.#noise = new PeriodicNoise(seed ^ 0x9a7c3e)
    this.#reliefRadius = reliefRadius
  }

  patch(x, y) {
    return this.#noise.fbm(x, y, this.#terrain.size, 8, 3, 1)
  }

  speck(x, y) {
    return this.#noise.fbm(x, y, this.#terrain.size, 22, 2, 7)
  }

  relief(x, y, h) {
    const terrain = this.#terrain
    const radius = this.#reliefRadius
    let sum = 0
    for (const [cx, cy] of RELIEF_RING) sum += terrain.heightAt(x + cx * radius, y + cy * radius)
    return h - sum / RELIEF_RING.length
  }
}
