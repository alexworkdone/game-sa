import { SeededRandom } from '../../core/SeededRandom.js'
import { PROP_BUSH, PROP_FLOWERS, PROP_ROCK } from '../../world/Scatter.js'
import { lighten, mixColor } from '../color.js'

const AFTER_GROUND = 3
const TOP = 0
const RIGHT_UP = 1
const RIGHT_DOWN = 2
const BOTTOM_RIGHT = 3
const BOTTOM_LEFT = 4
const LEFT_DOWN = 5
const LEFT_UP = 6
const INNER = 7
const OUTLINE = [TOP, RIGHT_UP, RIGHT_DOWN, BOTTOM_RIGHT, BOTTOM_LEFT, LEFT_DOWN, LEFT_UP]
const LIT_FACET = [TOP, RIGHT_UP, RIGHT_DOWN, INNER]
const DARK_FACET = [INNER, BOTTOM_RIGHT, BOTTOM_LEFT, LEFT_DOWN]
const PETALS = [
  [-0.6, 0],
  [0.5, -0.15],
  [0, -0.4],
  [0.3, 0.2],
]
const BLADES = [
  [-0.35, 1],
  [0.05, 0.8],
  [0.4, 0.7],
]

const rockShapes = () => {
  const random = new SeededRandom(0x5eed70c)
  const jitter = (amount) => random.range(-amount, amount)
  return Array.from({ length: 8 }, () => {
    const width = random.range(0.85, 1.45)
    const points = [
      [jitter(0.2), -1],
      [0.55 + jitter(0.12), -0.75 + jitter(0.1)],
      [0.95 + jitter(0.1), -0.22 + jitter(0.1)],
      [0.65 + jitter(0.1), 0],
      [-0.7 + jitter(0.1), 0],
      [-0.95 + jitter(0.1), -0.28 + jitter(0.1)],
      [-0.55 + jitter(0.12), -0.8 + jitter(0.1)],
      [0.18 + jitter(0.1), -0.4 + jitter(0.08)],
    ]
    return points.map(([x, y]) => [x * width, y])
  })
}

export class ScatterLayer {
  #scatter
  #config
  #shapes = rockShapes()
  #xs = new Float32Array(8)
  #ys = new Float32Array(8)

  constructor(scatter, config) {
    this.#scatter = scatter
    this.#config = config
  }

  collect(scene) {
    const scatter = this.#scatter
    const config = this.#config
    const { projector, batch, shader, camera, lateralLimit } = scene
    const bucketSize = scatter.bucketSize
    const mask = scatter.buckets - 1
    const radiusSq = config.radius * config.radius
    const detailSq = config.detailRadius * config.detailRadius
    const smallSq = config.smallRadius * config.smallRadius
    const camX = camera.x
    const camY = camera.y
    const reach = Math.ceil(config.radius / bucketSize) + 1
    const baseX = Math.floor(camX / bucketSize)
    const baseY = Math.floor(camY / bucketSize)
    const margin = bucketSize * 0.75
    const sunX = shader.sunLateralX
    const sunY = shader.sunLateralY
    const side = sunX * projector.rX + sunY * projector.rY > 0 ? 1 : -1

    for (let bj = -reach; bj <= reach; bj++) {
      for (let bi = -reach; bi <= reach; bi++) {
        const gx = baseX + bi
        const gy = baseY + bj
        const centerX = (gx + 0.5) * bucketSize - camX
        const centerY = (gy + 0.5) * bucketSize - camY
        const forward = centerX * projector.fX + centerY * projector.fY
        if (forward < -margin) continue
        const lateral = centerX * projector.rX + centerY * projector.rY
        if (Math.abs(lateral) > (forward > 0 ? forward : 0) * lateralLimit + margin) continue

        const wx = gx & mask
        const wy = gy & mask
        const offsetX = (gx - wx) * bucketSize - camX
        const offsetY = (gy - wy) * bucketSize - camY
        const bucket = wy * scatter.buckets + wx

        for (let p = scatter.bucketStart[bucket], end = scatter.bucketStart[bucket + 1]; p < end; p++) {
          if (!scatter.alive[p]) continue
          const kind = scatter.kind[p]
          const rx = scatter.x[p] + offsetX
          const ry = scatter.y[p] + offsetY
          const distSq = rx * rx + ry * ry
          const small = kind !== PROP_ROCK && kind !== PROP_BUSH
          if (distSq > (small ? smallSq : radiusSq)) continue
          const z = scatter.z[p]
          if (!projector.point(rx, ry, z)) continue
          const scale = projector.focal / projector.pd
          const extent = scatter.size[p] * scale
          if (extent < 1.2) continue
          const x = projector.px
          const y = projector.py
          if (x + extent * 1.5 < -projector.extentX || x - extent * 1.5 > projector.extentX) continue
          if (y - extent * 2 > projector.extentY || y < -projector.extentY) continue

          const distance = Math.sqrt(distSq)
          const inv = 1 / distance
          const dirX = rx * inv
          const dirY = ry * inv
          const worldX = rx + camX
          const worldY = ry + camY
          const anchorX = rx + scatter.anchorX[p]
          const anchorY = ry + scatter.anchorY[p]
          const key = Math.sqrt(anchorX * anchorX + anchorY * anchorY) - AFTER_GROUND
          const color = scatter.color[p]
          const near = distSq < detailSq

          if (kind === PROP_ROCK) {
            const lit = shader.shade(color, sunX * 0.6, sunY * 0.6, 0.8, worldX, worldY, z + 1, distance, dirX, dirY)
            const dark = shader.shade(color, -sunX * 0.6, -sunY * 0.6, 0.5, worldX, worldY, z, distance, dirX, dirY)
            this.#rock(batch, key, scatter.shape[p], x, y, extent, side, near, lit, mixColor(lit, dark, 0.5), dark)
          } else if (kind === PROP_BUSH) {
            const lit = shader.shade(color, sunX * 0.55, sunY * 0.55, 0.83, worldX, worldY, z + 1, distance, dirX, dirY)
            const shade = shader.shade(color, -sunX * 0.55, -sunY * 0.55, 0.83, worldX, worldY, z + 1, distance, dirX, dirY)
            if (!near) {
              batch.circle(key, mixColor(lit, shade, 0.3), x, y - extent * 0.7, extent)
              continue
            }
            batch.sphere(key, lighten(lit, 0.14), lit, shade, x, y - extent * 0.75, extent, side * 0.62, -0.55)
            batch.sphere(key - 0.001, lighten(lit, 0.14), lit, shade, x + side * extent * 0.75, y - extent * 0.5, extent * 0.68, side * 0.62, -0.55)
          } else if (kind === PROP_FLOWERS) {
            const bright = shader.shade(color, 0, 0, 1, worldX, worldY, z, distance, dirX, dirY)
            const dot = Math.max(0.9, extent * 0.3)
            for (const [px, py] of PETALS) batch.circle(key, bright, x + px * extent, y + py * extent, dot)
          } else {
            this.#tuft(batch, key, x, y, extent, shader.shade(color, sunX * 0.3, sunY * 0.3, 0.9, worldX, worldY, z, distance, dirX, dirY))
          }
        }
      }
    }
  }

  #rock(batch, key, variant, x, y, extent, side, near, lit, middle, dark) {
    const shape = this.#shapes[variant % this.#shapes.length]
    const xs = this.#xs
    const ys = this.#ys
    const place = (indices) => {
      indices.forEach((index, k) => {
        xs[k] = x + shape[index][0] * extent * side
        ys[k] = y + shape[index][1] * extent
      })
      return indices.length
    }
    batch.polygon(key, near ? middle : mixColor(lit, dark, 0.45), xs, ys, place(OUTLINE), false)
    if (!near) return
    batch.polygon(key - 0.001, lit, xs, ys, place(LIT_FACET), false)
    batch.polygon(key - 0.001, dark, xs, ys, place(DARK_FACET), false)
  }

  #tuft(batch, key, x, y, extent, color) {
    const xs = this.#xs
    const ys = this.#ys
    const half = Math.max(0.6, extent * 0.09)
    for (const [lean, height] of BLADES) {
      xs[0] = x + lean * extent * 0.5 - half
      ys[0] = y
      xs[1] = x + lean * extent * 0.5 + half
      ys[1] = y
      xs[2] = x + lean * extent
      ys[2] = y - height * extent
      batch.polygon(key, color, xs, ys, 3, false)
    }
  }
}
