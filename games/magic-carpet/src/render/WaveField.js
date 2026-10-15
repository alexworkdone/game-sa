import { SeededRandom } from '../core/SeededRandom.js'

export class WaveField {
  constructor(seed, { size, trains, wind, spread, reach }) {
    this.size = size
    this.mask = size - 1
    this.slopeX = new Float32Array(size * size)
    this.slopeY = new Float32Array(size * size)
    this.#generate(new SeededRandom(seed ^ 0x77a7e5), trains, Math.atan2(wind[1], wind[0]), spread, reach)
  }

  #generate(random, count, heading, spread, [nearest, farthest]) {
    const size = this.size
    const waves = []
    while (waves.length < count) {
      const angle = heading + random.range(-spread, spread)
      const length = random.range(nearest, farthest)
      const kx = Math.round(Math.cos(angle) * length)
      const ky = Math.round(Math.sin(angle) * length)
      if (kx === 0 && ky === 0) continue
      waves.push({ kx: (kx * Math.PI * 2) / size, ky: (ky * Math.PI * 2) / size, gain: 1 / Math.hypot(kx, ky), phase: random.range(0, Math.PI * 2) })
    }

    let energy = 0
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        let sx = 0
        let sy = 0
        for (const wave of waves) {
          const slope = wave.gain * Math.cos(wave.kx * x + wave.ky * y + wave.phase)
          sx += slope * wave.kx * size
          sy += slope * wave.ky * size
        }
        this.slopeX[y * size + x] = sx
        this.slopeY[y * size + x] = sy
        energy += sx * sx + sy * sy
      }
    }
    const norm = 1 / Math.sqrt(energy / (size * size) || 1)
    for (let i = 0; i < size * size; i++) {
      this.slopeX[i] *= norm
      this.slopeY[i] *= norm
    }
  }
}
