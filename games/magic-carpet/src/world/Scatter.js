import { packRgb, wrapDelta } from '../core/math.js'
import { hashCell } from './PeriodicNoise.js'

export const PROP_ROCK = 0
export const PROP_BUSH = 1
export const PROP_FLOWERS = 2
export const PROP_TUFT = 3

const BUCKET = 64

export class Scatter {
  constructor(terrain, mesh, pattern, config, snowLine, seed) {
    this.bucketSize = BUCKET
    this.buckets = terrain.size / BUCKET
    const props = this.#place(terrain, mesh, pattern, config, snowLine, seed)
    const count = props.length
    this.count = count
    this.x = new Float32Array(count)
    this.y = new Float32Array(count)
    this.z = new Float32Array(count)
    this.anchorX = new Float32Array(count)
    this.anchorY = new Float32Array(count)
    this.size = new Float32Array(count)
    this.kind = new Uint8Array(count)
    this.shape = new Uint8Array(count)
    this.alive = new Uint8Array(count).fill(1)
    this.color = new Uint32Array(count)

    const bucketOf = (prop) => Math.floor(prop.y / BUCKET) * this.buckets + Math.floor(prop.x / BUCKET)
    props.sort((a, b) => bucketOf(a) - bucketOf(b))
    this.bucketStart = new Uint32Array(this.buckets * this.buckets + 1)
    props.forEach((prop, i) => {
      this.x[i] = prop.x
      this.y[i] = prop.y
      this.z[i] = prop.z
      this.anchorX[i] = prop.anchorX
      this.anchorY[i] = prop.anchorY
      this.size[i] = prop.size
      this.kind[i] = prop.kind
      this.shape[i] = prop.shape
      this.color[i] = prop.color
    })
    let cursor = 0
    for (let b = 0; b <= this.buckets * this.buckets; b++) {
      while (cursor < count && bucketOf(props[cursor]) < b) cursor++
      this.bucketStart[b] = cursor
    }
  }

  #within(x, y, radius, size, visit) {
    for (let p = 0; p < this.count; p++) {
      if (!this.alive[p]) continue
      if (Math.hypot(wrapDelta(this.x[p] - x, size), wrapDelta(this.y[p] - y, size)) <= radius) visit(p)
    }
  }

  clear(x, y, radius, size) {
    this.#within(x, y, radius, size, (p) => {
      this.alive[p] = 0
    })
  }

  settle(mesh, x, y, radius, size) {
    const ground = { height: 0, anchorX: 0, anchorY: 0 }
    this.#within(x, y, radius, size, (p) => {
      mesh.locate(this.x[p], this.y[p], ground)
      this.z[p] = ground.height - 0.2
      this.anchorX[p] = ground.anchorX - this.x[p]
      this.anchorY[p] = ground.anchorY - this.y[p]
      if (ground.height < mesh.seaLevel + 0.4) this.alive[p] = 0
    })
  }

  #place(terrain, mesh, pattern, config, snowLine, seed) {
    const size = terrain.size
    const sea = terrain.seaLevel
    const props = []
    const random = (x, y, salt) => hashCell(x, y, seed ^ salt) / 4294967296
    const pick = (list, gx, gy, salt) => list[Math.floor(random(gx, gy, salt) * list.length)]
    const castles = terrain.castles
    const ground = { height: 0, anchorX: 0, anchorY: 0 }

    for (let gy = 0; gy < size; gy += config.spacing) {
      for (let gx = 0; gx < size; gx += config.spacing) {
        const x = (gx + (random(gx, gy, 11) - 0.5) * 2 * config.jitter + size) % size
        const y = (gy + (random(gx, gy, 12) - 0.5) * 2 * config.jitter + size) % size
        mesh.locate(x, y, ground)
        const z = ground.height
        if (z < sea + 0.4) continue
        const nearCastle = castles.some(
          (castle) => Math.hypot(wrapDelta(castle.x - x, size), wrapDelta(castle.y - y, size)) < castle.plaza + 6,
        )
        if (nearCastle) continue

        const index = terrain.index(x, y)
        const slope = Math.abs(mesh.surfaceAt(x + 2, y) - mesh.surfaceAt(x - 2, y)) + Math.abs(mesh.surfaceAt(x, y + 2) - mesh.surfaceAt(x, y - 2))
        const wet = terrain.wetness[index] / 255
        const desert = terrain.desert[index] > 128
        const woods = terrain.forest[index] / 255
        const shore = z < sea + 2.2
        const marsh = wet > 0.68 && z < sea + 9
        const highland = z > snowLine - 34
        const steep = slope > 5
        const meadow = !desert && !marsh && !highland && !steep && woods < 0.43
        const bloom = meadow && wet > 0.3 && pattern.speck(x, y) > 0.28

        const roll = random(gx, gy, 13)
        let kind = -1
        let chance = 0
        const rockChance = steep ? 0.12 : highland ? 0.08 : desert ? 0.035 : shore ? 0.03 : 0.02
        if (roll < (chance += rockChance)) kind = PROP_ROCK
        else if (roll < (chance += woods > 0.24 && woods < 0.55 ? 0.1 : meadow && wet > 0.45 ? 0.03 : marsh ? 0.05 : desert ? 0.012 : 0)) kind = PROP_BUSH
        else if (roll < (chance += bloom ? 0.4 : 0)) kind = PROP_FLOWERS
        else if (roll < (chance += marsh || (shore && wet > 0.4) ? 0.24 : meadow ? 0.15 : 0)) kind = PROP_TUFT
        if (kind < 0 || z > snowLine) continue

        const grow = random(gx, gy, 14)
        let propSize
        let color
        if (kind === PROP_ROCK) {
          propSize = (steep || highland ? 1.6 : 0.9) + grow * (steep || highland ? 2.4 : 1.3)
          color = pick(desert ? config.sandstone : config.stone, gx, gy, 15)
        } else if (kind === PROP_BUSH) {
          propSize = 1.4 + grow * 1.5
          color = desert ? config.dryBush : random(gx, gy, 16) < 0.12 ? pick(config.blossom, gx, gy, 17) : pick(config.bush, gx, gy, 15)
        } else if (kind === PROP_FLOWERS) {
          propSize = 0.8 + grow * 0.5
          color = pick(config.flowers, gx, gy, 15)
        } else {
          propSize = (marsh || shore ? 2.2 : 1.1) + grow * (marsh || shore ? 1.4 : 0.6)
          color = marsh || shore ? pick(config.reeds, gx, gy, 15) : pick(config.tufts, gx, gy, 15)
        }

        props.push({
          x,
          y,
          z: z - 0.2,
          anchorX: ground.anchorX - x,
          anchorY: ground.anchorY - y,
          size: propSize,
          kind,
          shape: Math.floor(random(gx, gy, 18) * 256),
          color: packRgb(...color),
        })
      }
    }
    return props
  }
}
