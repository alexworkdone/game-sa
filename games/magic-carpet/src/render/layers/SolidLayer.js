import { wrapDelta } from '../../core/math.js'

const CAPACITY = 64

export class SolidLayer {
  #units
  #worldSize
  #detailRadius
  #clipX = new Float32Array(CAPACITY)
  #clipY = new Float32Array(CAPACITY)
  #clipZ = new Float32Array(CAPACITY)

  constructor(units, worldSize, detailRadius) {
    this.#units = units
    this.#worldSize = worldSize
    this.#detailRadius = detailRadius
  }

  collect(scene) {
    const { projector, batch, shader, camera, radius, lateralLimit } = scene
    const size = this.#worldSize
    const camX = camera.x
    const camY = camera.y
    const camZ = camera.z
    const inX = projector.inX
    const inY = projector.inY
    const inZ = projector.inZ

    for (const unit of this.#units) {
      const owner = unit.owner
      if (owner && !owner.shows(unit)) continue
      const sink = owner ? owner.sinkOf(unit) : 0
      const floor = owner ? owner.plateau - 0.2 : -Infinity
      const rx = wrapDelta(unit.x - camX, size)
      const ry = wrapDelta(unit.y - camY, size)
      const distance = Math.hypot(rx, ry)
      if (distance > radius + unit.radius) continue
      const forward = rx * projector.fX + ry * projector.fY
      if (forward < -unit.radius * 2) continue
      const lateral = rx * projector.rX + ry * projector.rY
      if (Math.abs(lateral) > (forward > 0 ? forward : 0) * lateralLimit + unit.radius * 2) continue

      const offsetX = rx - unit.x
      const offsetY = ry - unit.y
      const key = distance - unit.bias
      const detailed = distance < this.#detailRadius
      const inv = distance > 1e-3 ? 1 / distance : 0
      const dirX = rx * inv
      const dirY = ry * inv

      unit.solids.forEach((solid, order) => {
        if (solid.detail && !detailed) return
        if (solid.coarse && detailed) return
        const vertices = solid.vertices
        for (const face of solid.faces) {
          const fx = face.cx + offsetX
          const fy = face.cy + offsetY
          const fz = face.cz - sink
          let nx = face.nx
          let ny = face.ny
          let nz = face.nz
          if ((camZ - fz) * nz - fx * nx - fy * ny < 0) {
            if (!face.doubleSided) continue
            nx = -nx
            ny = -ny
            nz = -nz
          }
          const indices = face.indices
          let count = indices.length
          for (let k = 0; k < count; k++) {
            const v = indices[k] * 3
            inX[k] = vertices[v] + offsetX
            inY[k] = vertices[v + 1] + offsetY
            inZ[k] = vertices[v + 2] - sink
          }
          if (sink > 0) {
            count = this.#clipFloor(inX, inY, inZ, count, floor)
            if (count < 3) continue
          }
          const m = projector.polygon(count)
          if (m === 0) continue
          const color = shader.shade(face.color, nx, ny, nz, fx + camX, fy + camY, Math.max(fz, floor), distance, dirX, dirY)
          batch.polygon(key - order * 0.001, color, projector.outX, projector.outY, m)
        }
      })
    }
  }

  #clipFloor(xs, ys, zs, count, floor) {
    const cx = this.#clipX
    const cy = this.#clipY
    const cz = this.#clipZ
    let n = 0
    for (let k = 0; k < count; k++) {
      const next = k + 1 === count ? 0 : k + 1
      const inside = zs[k] >= floor
      if (inside) {
        cx[n] = xs[k]
        cy[n] = ys[k]
        cz[n] = zs[k]
        n++
      }
      if (inside !== zs[next] >= floor) {
        const t = (floor - zs[k]) / (zs[next] - zs[k])
        cx[n] = xs[k] + (xs[next] - xs[k]) * t
        cy[n] = ys[k] + (ys[next] - ys[k]) * t
        cz[n] = floor
        n++
      }
    }
    for (let k = 0; k < n; k++) {
      xs[k] = cx[k]
      ys[k] = cy[k]
      zs[k] = cz[k]
    }
    return n
  }
}
