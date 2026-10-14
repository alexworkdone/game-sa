import { PeriodicNoise } from '../world/PeriodicNoise.js'

export class CloudLayer {
  constructor(seed, config) {
    const size = config.textureSize
    this.size = size
    this.mask = size - 1
    this.bits = Math.log2(size)
    this.altitude = config.altitude
    this.texelSize = config.texelSize
    this.inverseTexel = 1 / config.texelSize
    this.far = config.far
    this.threshold = config.threshold
    this.softness = config.softness
    this.opacity = config.opacity
    this.shadowStrength = config.shadowStrength
    this.windX = config.wind[0]
    this.windY = config.wind[1]
    this.origin = 1 << 16
    this.offsetX = 0
    this.offsetY = 0
    this.coverage = this.#generate(seed, size)
  }

  update(dt) {
    this.offsetX = (this.offsetX + this.windX * dt * this.inverseTexel) % this.size
    this.offsetY = (this.offsetY + this.windY * dt * this.inverseTexel) % this.size
  }

  #generate(seed, size) {
    const noise = new PeriodicNoise(seed ^ 0x51ed27)
    const values = new Float32Array(size * size)
    let min = Infinity
    let max = -Infinity
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const base = noise.fbm(x, y, size, 4, 5, 0, 0.55)
        const puffs = noise.fbm(x, y, size, 16, 3, 10)
        const value = base + Math.max(0, puffs) * 0.35
        values[y * size + x] = value
        if (value < min) min = value
        if (value > max) max = value
      }
    }
    const range = max - min || 1
    for (let i = 0; i < values.length; i++) values[i] = (values[i] - min) / range
    return values
  }
}
