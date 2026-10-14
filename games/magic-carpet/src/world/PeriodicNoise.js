const GRADIENT_COUNT = 256
const GRADIENT_X = new Float32Array(GRADIENT_COUNT)
const GRADIENT_Y = new Float32Array(GRADIENT_COUNT)

for (let i = 0; i < GRADIENT_COUNT; i++) {
  const angle = (i / GRADIENT_COUNT) * Math.PI * 2
  GRADIENT_X[i] = Math.cos(angle)
  GRADIENT_Y[i] = Math.sin(angle)
}

export const hashCell = (x, y, seed) => {
  let h = (Math.imul(x, 0x27d4eb2d) ^ Math.imul(y, 0x165667b1) ^ seed) | 0
  h = Math.imul(h ^ (h >>> 15), 0x85ebca6b)
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35)
  return (h ^ (h >>> 16)) >>> 0
}

export class PeriodicNoise {
  #seed

  constructor(seed) {
    this.#seed = seed | 0
  }

  sample(x, y, period, salt = 0) {
    const xf = Math.floor(x)
    const yf = Math.floor(y)
    const fx = x - xf
    const fy = y - yf
    const x0 = ((xf % period) + period) % period
    const y0 = ((yf % period) + period) % period
    const x1 = x0 + 1 === period ? 0 : x0 + 1
    const y1 = y0 + 1 === period ? 0 : y0 + 1
    const seed = this.#seed ^ Math.imul(salt + 1, 0x9e3779b1)
    const g00 = hashCell(x0, y0, seed) & 255
    const g10 = hashCell(x1, y0, seed) & 255
    const g01 = hashCell(x0, y1, seed) & 255
    const g11 = hashCell(x1, y1, seed) & 255
    const n00 = GRADIENT_X[g00] * fx + GRADIENT_Y[g00] * fy
    const n10 = GRADIENT_X[g10] * (fx - 1) + GRADIENT_Y[g10] * fy
    const n01 = GRADIENT_X[g01] * fx + GRADIENT_Y[g01] * (fy - 1)
    const n11 = GRADIENT_X[g11] * (fx - 1) + GRADIENT_Y[g11] * (fy - 1)
    const u = fx * fx * fx * (fx * (fx * 6 - 15) + 10)
    const v = fy * fy * fy * (fy * (fy * 6 - 15) + 10)
    const a = n00 + (n10 - n00) * u
    const b = n01 + (n11 - n01) * u
    return (a + (b - a) * v) * 1.41
  }

  fbm(x, y, size, frequency, octaves, salt = 0, gain = 0.5) {
    let sum = 0
    let amplitude = 1
    let norm = 0
    let f = frequency
    for (let i = 0; i < octaves; i++) {
      sum += this.sample((x / size) * f, (y / size) * f, f, salt + i) * amplitude
      norm += amplitude
      amplitude *= gain
      f *= 2
    }
    return sum / norm
  }

  ridged(x, y, size, frequency, octaves, salt = 0) {
    let sum = 0
    let amplitude = 0.5
    let norm = 0
    let weight = 1
    let f = frequency
    for (let i = 0; i < octaves; i++) {
      let n = 1 - Math.abs(this.sample((x / size) * f, (y / size) * f, f, salt + i))
      n *= n
      n *= weight
      weight = n * 2 > 1 ? 1 : n * 2
      sum += n * amplitude
      norm += amplitude
      amplitude *= 0.5
      f *= 2
    }
    return sum / norm
  }
}
