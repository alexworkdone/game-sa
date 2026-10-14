import { wrapDelta } from '../core/math.js'
import { hashCell } from './PeriodicNoise.js'

export const FACE_LAND = 0
export const FACE_WATER = 1

const SLOTS = 4
const unit = (x, y, seed) => hashCell(x, y, seed) / 4294967296

export class TerrainMesh {
  #terrain
  #palette
  #triangles

  constructor(terrain, palette, config) {
    this.#terrain = terrain
    this.#palette = palette
    this.size = terrain.size
    this.seaLevel = terrain.seaLevel
    this.spacing = config.spacing
    this.cells = terrain.size / config.spacing
    this.mask = this.cells - 1
    this.slots = SLOTS

    const quads = this.cells * this.cells
    const faces = quads * SLOTS
    this.quadCount = new Uint8Array(quads)
    this.kind = new Uint8Array(faces)
    this.count = new Uint8Array(faces)
    this.vertices = new Float32Array(faces * 12)
    this.normal = new Float32Array(faces * 3)
    this.color = new Uint32Array(faces)
    this.centroid = new Float32Array(faces * 3)
    this.depth = new Float32Array(faces)
    this.phase = new Float32Array(faces)
    this.#triangles = new Float32Array(quads * 2 * 9)

    this.#buildVertices(config)
    for (let j = 0; j < this.cells; j++) {
      for (let i = 0; i < this.cells; i++) this.#rebuildQuad(i, j)
    }
  }

  heightOfVertex(i, j) {
    return this.vz[(j & this.mask) * this.cells + (i & this.mask)]
  }

  vertexPosition(i, j) {
    const index = (j & this.mask) * this.cells + (i & this.mask)
    return [this.vx[index], this.vy[index]]
  }

  setVertexHeight(i, j, height) {
    this.vz[(j & this.mask) * this.cells + (i & this.mask)] = height
  }

  rebuildAround(i0, j0, i1, j1) {
    for (let j = j0 - 1; j <= j1; j++) {
      for (let i = i0 - 1; i <= i1; i++) this.#rebuildQuad(i & this.mask, j & this.mask)
    }
  }

  surfaceAt(x, y) {
    return this.locate(x, y).height
  }

  locate(x, y, target = { height: 0, anchorX: x, anchorY: y }) {
    const spacing = this.spacing
    const cells = this.cells
    const size = this.size
    const px = ((x % size) + size) % size
    const py = ((y % size) + size) % size
    const shiftX = x - px
    const shiftY = y - py
    const ci = Math.floor(px / spacing)
    const cj = Math.floor(py / spacing)
    const t = this.#triangles
    for (let dj = -1; dj <= 1; dj++) {
      for (let di = -1; di <= 1; di++) {
        const gi = ci + di
        const gj = cj + dj
        const wi = gi & this.mask
        const wj = gj & this.mask
        const ox = (gi - wi) * spacing
        const oy = (gj - wj) * spacing
        const quad = wj * cells + wi
        for (let k = 0; k < 2; k++) {
          const o = (quad * 2 + k) * 9
          const ax = t[o] + ox
          const ay = t[o + 1] + oy
          const bx = t[o + 3] + ox
          const by = t[o + 4] + oy
          const cx = t[o + 6] + ox
          const cy = t[o + 7] + oy
          const det = (by - cy) * (ax - cx) + (cx - bx) * (ay - cy)
          if (det === 0) continue
          const wa = ((by - cy) * (px - cx) + (cx - bx) * (py - cy)) / det
          const wb = ((cy - ay) * (px - cx) + (ax - cx) * (py - cy)) / det
          const wc = 1 - wa - wb
          if (wa < -1e-4 || wb < -1e-4 || wc < -1e-4) continue
          target.height = wa * t[o + 2] + wb * t[o + 5] + wc * t[o + 8]
          target.anchorX = (ax + bx + cx) / 3 + shiftX
          target.anchorY = (ay + by + cy) / 3 + shiftY
          return target
        }
      }
    }
    target.height = this.#terrain.heightAt(px, py)
    target.anchorX = x
    target.anchorY = y
    return target
  }

  groundAt(x, y) {
    const h = this.surfaceAt(x, y)
    return h > this.seaLevel ? h : this.seaLevel
  }

  #buildVertices(config) {
    const terrain = this.#terrain
    const spacing = this.spacing
    const cells = this.cells
    const size = this.size
    const jitter = config.jitter
    const smoothing = config.smoothing
    this.vx = new Float32Array(cells * cells)
    this.vy = new Float32Array(cells * cells)
    this.vz = new Float32Array(cells * cells)
    for (let j = 0; j < cells; j++) {
      for (let i = 0; i < cells; i++) {
        const index = j * cells + i
        const x = i * spacing + (unit(i, j, 11) - 0.5) * 2 * jitter
        const y = j * spacing + (unit(i, j, 23) - 0.5) * 2 * jitter
        this.vx[index] = x
        this.vy[index] = y
        const plaza = terrain.castles.find(
          (castle) => Math.hypot(wrapDelta(x - castle.x, size), wrapDelta(y - castle.y, size)) <= castle.plaza + 2,
        )
        this.vz[index] = plaza
          ? plaza.plateau
          : (terrain.heightAt(x, y) * 2 +
              terrain.heightAt(x + smoothing, y) +
              terrain.heightAt(x - smoothing, y) +
              terrain.heightAt(x, y + smoothing) +
              terrain.heightAt(x, y - smoothing)) /
            6
      }
    }
  }

  #corner(i, j) {
    const cells = this.cells
    const wi = i % cells
    const wj = j % cells
    const index = wj * cells + wi
    return [this.vx[index] + (i - wi) * this.spacing, this.vy[index] + (j - wj) * this.spacing, this.vz[index]]
  }

  #rebuildQuad(i, j) {
    const quad = j * this.cells + i
    const a = this.#corner(i, j)
    const b = this.#corner(i + 1, j)
    const c = this.#corner(i + 1, j + 1)
    const d = this.#corner(i, j + 1)
    const triangles = Math.abs(a[2] - c[2]) <= Math.abs(b[2] - d[2]) ? [[a, b, c], [a, c, d]] : [[a, b, d], [b, c, d]]
    this.quadCount[quad] = 0
    triangles.forEach((triangle, k) => {
      this.#triangles.set(triangle.flat(), (quad * 2 + k) * 9)
      this.#addTriangle(quad, triangle, i * 2 + k, j)
    })
  }

  #addTriangle(quad, triangle, hashX, hashY) {
    const sea = this.seaLevel
    const [a, b, c] = triangle
    let nx = (b[1] - a[1]) * (c[2] - a[2]) - (b[2] - a[2]) * (c[1] - a[1])
    let ny = (b[2] - a[2]) * (c[0] - a[0]) - (b[0] - a[0]) * (c[2] - a[2])
    let nz = (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0])
    const length = Math.hypot(nx, ny, nz) || 1
    const flip = nz < 0 ? -1 : 1
    nx = (nx / length) * flip
    ny = (ny / length) * flip
    nz = (nz / length) * flip

    const land = []
    const water = []
    for (let k = 0; k < 3; k++) {
      const p = triangle[k]
      const q = triangle[(k + 1) % 3]
      const pAbove = p[2] >= sea
      const qAbove = q[2] >= sea
      if (pAbove) land.push(p)
      else water.push([p[0], p[1], sea, sea - p[2]])
      if (pAbove !== qAbove) {
        const t = (sea - p[2]) / (q[2] - p[2])
        const cross = [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t, sea, 0]
        land.push(cross)
        water.push(cross)
      }
    }

    const variation = unit(hashX, hashY, 47)
    if (land.length >= 3) {
      const center = this.#center(land)
      const color = this.#palette.land(center[0], center[1], center[2], nz, variation)
      this.#write(quad, FACE_LAND, land, nx, ny, nz, color, center, 0, variation)
    }
    if (water.length >= 3) {
      const center = this.#center(water)
      const depth = water.reduce((sum, p) => sum + (p[3] ?? 0), 0) / water.length
      this.#write(quad, FACE_WATER, water, 0, 0, 1, 0, center, depth, variation)
    }
  }

  #center(points) {
    const center = [0, 0, 0]
    for (const p of points) {
      center[0] += p[0] / points.length
      center[1] += p[1] / points.length
      center[2] += p[2] / points.length
    }
    return center
  }

  #write(quad, kind, points, nx, ny, nz, color, center, depth, phase) {
    const face = quad * SLOTS + this.quadCount[quad]++
    this.kind[face] = kind
    this.count[face] = points.length
    points.forEach((p, k) => {
      this.vertices[face * 12 + k * 3] = p[0]
      this.vertices[face * 12 + k * 3 + 1] = p[1]
      this.vertices[face * 12 + k * 3 + 2] = p[2]
    })
    this.normal[face * 3] = nx
    this.normal[face * 3 + 1] = ny
    this.normal[face * 3 + 2] = nz
    this.color[face] = color
    this.centroid[face * 3] = center[0]
    this.centroid[face * 3 + 1] = center[1]
    this.centroid[face * 3 + 2] = center[2]
    this.depth[face] = depth
    this.phase[face] = phase
  }
}
