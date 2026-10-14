import { packRgb, wrapDelta } from '../core/math.js'
import { hashCell } from './PeriodicNoise.js'

export const TREE_PINE = 0
export const TREE_ROUND = 1

const BUCKET = 64

export class Forest {
  constructor(terrain, mesh, config, seed) {
    this.bucketSize = BUCKET
    this.buckets = terrain.size / BUCKET
    const trees = this.#plant(terrain, mesh, config, seed)
    const count = trees.length
    this.count = count
    this.x = new Float32Array(count)
    this.y = new Float32Array(count)
    this.z = new Float32Array(count)
    this.anchorX = new Float32Array(count)
    this.anchorY = new Float32Array(count)
    this.height = new Float32Array(count)
    this.width = new Float32Array(count)
    this.kind = new Uint8Array(count)
    this.alive = new Uint8Array(count).fill(1)
    this.color = new Uint32Array(count)
    this.trunk = packRgb(...config.trunk)

    const bucketOf = (tree) => Math.floor(tree.y / BUCKET) * this.buckets + Math.floor(tree.x / BUCKET)
    trees.sort((a, b) => bucketOf(a) - bucketOf(b))
    this.bucketStart = new Uint32Array(this.buckets * this.buckets + 1)
    trees.forEach((tree, i) => {
      this.x[i] = tree.x
      this.y[i] = tree.y
      this.z[i] = tree.z
      this.anchorX[i] = tree.anchorX
      this.anchorY[i] = tree.anchorY
      this.height[i] = tree.height
      this.width[i] = tree.width
      this.kind[i] = tree.kind
      this.color[i] = tree.color
    })
    let cursor = 0
    for (let b = 0; b <= this.buckets * this.buckets; b++) {
      while (cursor < count && bucketOf(trees[cursor]) < b) cursor++
      this.bucketStart[b] = cursor
    }
  }

  treesWithin(x, y, radius, size, visit) {
    for (let t = 0; t < this.count; t++) {
      if (!this.alive[t]) continue
      const distance = Math.hypot(wrapDelta(this.x[t] - x, size), wrapDelta(this.y[t] - y, size))
      if (distance <= radius) visit(t, distance)
    }
  }

  clear(x, y, radius, size) {
    this.treesWithin(x, y, radius, size, (t) => {
      this.alive[t] = 0
    })
  }

  settle(mesh, x, y, radius, size) {
    const ground = { height: 0, anchorX: 0, anchorY: 0 }
    this.treesWithin(x, y, radius, size, (t) => {
      mesh.locate(this.x[t], this.y[t], ground)
      this.z[t] = ground.height - 0.4
      this.anchorX[t] = ground.anchorX - this.x[t]
      this.anchorY[t] = ground.anchorY - this.y[t]
      if (ground.height < mesh.seaLevel + 0.5) this.alive[t] = 0
    })
  }

  #plant(terrain, mesh, config, seed) {
    const size = terrain.size
    const sea = terrain.seaLevel
    const trees = []
    const random = (x, y, salt) => hashCell(x, y, seed ^ salt) / 4294967296
    const castles = terrain.castles
    for (let gy = 0; gy < size; gy += config.spacing) {
      for (let gx = 0; gx < size; gx += config.spacing) {
        const x = (gx + (random(gx, gy, 1) - 0.5) * 2 * config.jitter + size) % size
        const y = (gy + (random(gx, gy, 2) - 0.5) * 2 * config.jitter + size) % size
        const woods = terrain.forest[terrain.index(x, y)] / 255
        const lonely = random(gx, gy, 3) < 0.012
        if (woods < config.minForest + random(gx, gy, 4) * 0.35 && !lonely) continue
        if (terrain.desert[terrain.index(x, y)] > 90) continue
        const ground = mesh.locate(x, y)
        const z = ground.height
        if (z < sea + 1.8) continue
        const slope = Math.abs(mesh.surfaceAt(x + 3, y) - mesh.surfaceAt(x - 3, y)) + Math.abs(mesh.surfaceAt(x, y + 3) - mesh.surfaceAt(x, y - 3))
        if (slope > 7) continue
        const nearCastle = castles.some(
          (castle) => Math.hypot(wrapDelta(castle.x - x, size), wrapDelta(castle.y - y, size)) < castle.plaza + 8,
        )
        if (nearCastle) continue

        const highland = z > sea + 42
        const pine = highland || random(gx, gy, 5) < 0.35
        const scale = 0.8 + random(gx, gy, 6) * 0.5
        const palette = pine ? config.pine : config.round
        const autumn = !pine && random(gx, gy, 8) < 0.07
        const color = autumn ? config.autumn : palette[Math.floor(random(gx, gy, 7) * palette.length)]
        const height = (pine ? 14 : 11) * scale
        trees.push({
          x,
          y,
          z: z - 0.4,
          anchorX: ground.anchorX - x,
          anchorY: ground.anchorY - y,
          height,
          width: pine ? height * 0.56 : height * 0.74,
          kind: pine ? TREE_PINE : TREE_ROUND,
          color: packRgb(...color),
        })
      }
    }
    return trees
  }
}
