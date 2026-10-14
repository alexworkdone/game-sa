import { FieldGrid } from './FieldGrid.js'
import { lerp, smoothstep } from '../core/math.js'

export class ReliefShaper {
  #noise
  #size
  #seaLevel

  constructor(noise, size, seaLevel) {
    this.#noise = noise
    this.#size = size
    this.#seaLevel = seaLevel
  }

  shape(onProgress) {
    const noise = this.#noise
    const size = this.#size
    const sea = this.#seaLevel
    const low = size / 4
    const field = (resolution, sampler) => new FieldGrid(resolution, size).fill(sampler)

    const warpX = field(low, (x, y) => noise.fbm(x, y, size, 3, 3, 10) * 70)
    const warpY = field(low, (x, y) => noise.fbm(x, y, size, 3, 3, 20) * 70)
    const continent = field(low, (x, y) =>
      noise.fbm(x + warpX.sample(x, y), y + warpY.sample(x, y), size, 2, 6, 30),
    )
    const mountainMask = field(low, (x, y) => noise.fbm(x, y, size, 3, 3, 40))
    const hills = field(low, (x, y) => noise.fbm(x, y, size, 12, 3, 50))
    const moisture = field(low, (x, y) => noise.fbm(x, y, size, 3, 4, 60))
    const temperature = field(low, (x, y) => noise.fbm(x, y, size, 2, 3, 70))
    const rivers = field(low, (x, y) =>
      noise.fbm(x + warpY.sample(x, y) * 0.5, y + warpX.sample(x, y) * 0.5, size, 3, 4, 80),
    )
    const lakes = field(low, (x, y) => noise.fbm(x, y, size, 5, 3, 90))
    onProgress(0.12)

    const ridges = field(size / 2, (x, y) =>
      noise.ridged(x + warpX.sample(x, y) * 0.6, y + warpY.sample(x, y) * 0.6, size, 5, 5, 100),
    )
    onProgress(0.3)

    const cells = size * size
    const height = new Float32Array(cells)
    const forest = new Uint8Array(cells)
    const desert = new Uint8Array(cells)
    const wetness = new Uint8Array(cells)
    const detailScale = 256 / size

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const i = y * size + x
        const c = continent.sample(x, y) * 1.8 + 0.1
        const land = smoothstep(-0.02, 0.22, c)
        const mountains = smoothstep(-0.08, 0.3, mountainMask.sample(x, y) * 1.6)
        const hill = hills.sample(x, y) * 1.6
        const detail = noise.sample(x * detailScale, y * detailScale, 256, 110)

        let h = sea + c * 30 + land * (5 + hill * 8)
        h += land * mountains * Math.pow(ridges.sample(x, y), 1.35) * 118
        h += detail * (0.6 + mountains * 2.5)

        const lake = smoothstep(0.3, 0.45, lakes.sample(x, y) * 1.6) * land * (1 - mountains)
        h = lerp(h, sea - 2 - lake * 4, lake)

        const river = Math.abs(rivers.sample(x, y))
        const valley = (1 - smoothstep(0.02, 0.1, river)) * land
        const valleyFloor = sea + 3 + Math.max(0, h - sea) * 0.3
        if (h > valleyFloor) h = lerp(h, valleyFloor, valley)

        const warmth = temperature.sample(x, y) * 1.6
        const wet = moisture.sample(x, y) * 1.6
        const dry = smoothstep(0.1, 0.35, warmth - wet) * land * (1 - mountains) * smoothstep(sea + 0.5, sea + 3, h)
        const woods =
          smoothstep(0, 0.25, wet - warmth * 0.35) *
          land *
          (1 - dry) *
          (1 - smoothstep(88, 112, h)) *
          smoothstep(sea + 1.2, sea + 3, h)

        height[i] = h
        forest[i] = woods * 255
        desert[i] = dry * 255
        wetness[i] = (wet * 0.5 + 0.5) * 255
      }
      if ((y & 63) === 63) onProgress(0.3 + (0.3 * y) / size)
    }

    return { height, forest, desert, wetness }
  }
}
