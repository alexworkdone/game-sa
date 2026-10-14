import { TREE_PINE } from '../../world/Forest.js'
import { lighten, mixColor } from '../color.js'

const AFTER_GROUND = 3

export class ForestLayer {
  #forest
  #config
  #xs = new Float32Array(4)
  #ys = new Float32Array(4)

  constructor(forest, config) {
    this.#forest = forest
    this.#config = config
  }

  collect(scene) {
    const forest = this.#forest
    const config = this.#config
    const { projector, batch, shader, camera, lateralLimit } = scene
    const xs = this.#xs
    const ys = this.#ys
    const bucketSize = forest.bucketSize
    const buckets = forest.buckets
    const mask = buckets - 1
    const radius = config.radius
    const radiusSq = radius * radius
    const detailSq = config.detailRadius * config.detailRadius
    const camX = camera.x
    const camY = camera.y
    const reach = Math.ceil(radius / bucketSize) + 1
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
        const bucket = wy * buckets + wx

        for (let t = forest.bucketStart[bucket], end = forest.bucketStart[bucket + 1]; t < end; t++) {
          if (!forest.alive[t]) continue
          const rx = forest.x[t] + offsetX
          const ry = forest.y[t] + offsetY
          const distSq = rx * rx + ry * ry
          if (distSq > radiusSq) continue
          const z = forest.z[t]
          if (!projector.point(rx, ry, z)) continue
          const scale = projector.focal / projector.pd
          const tall = forest.height[t] * scale
          if (tall < 1.5) continue
          const x = projector.px
          const y = projector.py
          const half = forest.width[t] * 0.5 * scale
          if (x + half < -projector.extentX || x - half > projector.extentX) continue
          if (y - tall > projector.extentY || y < -projector.extentY) continue

          const distance = Math.sqrt(distSq)
          const inv = 1 / distance
          const dirX = rx * inv
          const dirY = ry * inv
          const worldX = rx + camX
          const worldY = ry + camY
          const crownZ = z + forest.height[t] * 0.6
          const anchorX = rx + forest.anchorX[t]
          const anchorY = ry + forest.anchorY[t]
          const key = Math.sqrt(anchorX * anchorX + anchorY * anchorY) - AFTER_GROUND
          const color = forest.color[t]
          const lit = shader.shade(color, sunX * 0.55, sunY * 0.55, 0.83, worldX, worldY, crownZ, distance, dirX, dirY)
          const shade = shader.shade(color, -sunX * 0.55, -sunY * 0.55, 0.83, worldX, worldY, crownZ, distance, dirX, dirY)
          const near = distSq < detailSq

          if (forest.kind[t] === TREE_PINE) {
            const crownBase = y - tall * 0.18
            xs[0] = x
            ys[0] = y - tall
            xs[1] = x + half
            ys[1] = crownBase
            xs[2] = x - half
            ys[2] = crownBase
            if (!near) {
              batch.polygon(key, mixColor(lit, shade, 0.3), xs, ys, 3, false)
              continue
            }
            this.#trunk(batch, shader, forest.trunk, key, x, y, half * 0.26, tall * 0.24, side, worldX, worldY, z, distance, dirX, dirY)
            batch.gradient(key - 0.001, xs, ys, 3, x + side * half, crownBase, x - side * half, crownBase, lighten(lit, 0.08), mixColor(lit, shade, 0.4), shade)
            continue
          }

          const crownY = y - tall + half
          if (!near) {
            batch.circle(key, mixColor(lit, shade, 0.3), x, crownY, half)
            continue
          }
          this.#trunk(batch, shader, forest.trunk, key, x, y, half * 0.2, tall * 0.5, side, worldX, worldY, z, distance, dirX, dirY)
          batch.sphere(key - 0.001, lighten(lit, 0.16), lit, shade, x, crownY, half, side * 0.62, -0.55)
        }
      }
    }
  }

  #trunk(batch, shader, color, key, x, y, half, height, side, worldX, worldY, z, distance, dirX, dirY) {
    const xs = this.#xs
    const ys = this.#ys
    xs[0] = x - half
    ys[0] = y
    xs[1] = x + half
    ys[1] = y
    xs[2] = x + half
    ys[2] = y - height
    xs[3] = x - half
    ys[3] = y - height
    const sunX = shader.sunLateralX
    const sunY = shader.sunLateralY
    const lit = shader.shade(color, sunX * 0.7, sunY * 0.7, 0.2, worldX, worldY, z, distance, dirX, dirY)
    const dark = shader.shade(color, -sunX * 0.7, -sunY * 0.7, 0.2, worldX, worldY, z, distance, dirX, dirY)
    batch.gradient(key, xs, ys, 4, x + side * half, y, x - side * half, y, lit, mixColor(lit, dark, 0.45), dark)
  }
}
