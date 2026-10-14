export class FieldGrid {
  #resolution
  #mask
  #scale
  #values

  constructor(resolution, worldSize) {
    this.#resolution = resolution
    this.#mask = resolution - 1
    this.#scale = resolution / worldSize
    this.#values = new Float32Array(resolution * resolution)
  }

  fill(sampler) {
    const resolution = this.#resolution
    const step = 1 / this.#scale
    for (let gy = 0; gy < resolution; gy++) {
      for (let gx = 0; gx < resolution; gx++) {
        this.#values[gy * resolution + gx] = sampler(gx * step, gy * step)
      }
    }
    return this
  }

  sample(x, y) {
    const sx = x * this.#scale
    const sy = y * this.#scale
    const ix = Math.floor(sx)
    const iy = Math.floor(sy)
    const fx = sx - ix
    const fy = sy - iy
    const mask = this.#mask
    const resolution = this.#resolution
    const x0 = ix & mask
    const x1 = (ix + 1) & mask
    const y0 = (iy & mask) * resolution
    const y1 = ((iy + 1) & mask) * resolution
    const values = this.#values
    const a = values[y0 + x0] + (values[y0 + x1] - values[y0 + x0]) * fx
    const b = values[y1 + x0] + (values[y1 + x1] - values[y1 + x0]) * fx
    return a + (b - a) * fy
  }
}
