export class SunShadowMap {
  #terrain
  #distances
  #cursor = 0

  constructor(terrain, { shift, steps }) {
    this.#terrain = terrain
    this.shift = shift
    this.size = terrain.size >> shift
    this.mask = this.size - 1
    this.bits = Math.log2(this.size)
    this.data = new Uint8Array(this.size * this.size).fill(255)
    this.#distances = Float32Array.from({ length: steps }, (_, k) => 1.5 * Math.pow(1.4, k))
  }

  rebuild(light) {
    this.update(light, this.size)
  }

  update(light, rows) {
    const { size, mask, bits, shift, data } = this
    const terrain = this.#terrain
    const heights = terrain.height
    const tMask = terrain.mask
    const tShift = terrain.shift
    const sea = terrain.seaLevel
    const horizontal = Math.hypot(light.x, light.y)

    if (light.z <= 0.02 || horizontal < 1e-4) {
      const value = light.z <= 0.02 ? 0 : 255
      for (let r = 0; r < rows; r++) {
        data.fill(value, this.#cursor << bits, (this.#cursor + 1) << bits)
        this.#cursor = (this.#cursor + 1) & mask
      }
      return
    }

    const dx = light.x / horizontal
    const dy = light.y / horizontal
    const rise = light.z / horizontal
    const distances = this.#distances
    const steps = distances.length
    const offset = terrain.size * 8

    for (let r = 0; r < rows; r++) {
      const sy = this.#cursor
      this.#cursor = (this.#cursor + 1) & mask
      const wy = sy << shift
      for (let sx = 0; sx < size; sx++) {
        const wx = sx << shift
        const own = heights[(wy << tShift) + wx]
        const h0 = (own > sea ? own : sea) + 0.4
        let worst = 1e9
        for (let k = 0; k < steps; k++) {
          const d = distances[k]
          const px = ((wx + offset + dx * d) | 0) & tMask
          const py = ((wy + offset + dy * d) | 0) & tMask
          const clearance = (h0 + d * rise - heights[(py << tShift) + px]) / (1 + d * 0.05)
          if (clearance < worst) {
            worst = clearance
            if (worst < -1.5) break
          }
        }
        let lit = (worst + 1) * 0.5
        lit = lit <= 0 ? 0 : lit >= 1 ? 1 : lit * lit * (3 - 2 * lit)
        data[(sy << bits) + sx] = lit * 255
      }
    }
  }
}
