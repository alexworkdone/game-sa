import { smoothstep, wrapDelta } from '../core/math.js'

const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)

export class Construction {
  #mesh
  #terrain
  #cover
  site
  #vertices = []
  #bounds
  #duration
  #elapsed = 0
  #onLevelled

  constructor({ mesh, terrain, cover, site, reach, duration, onLevelled }) {
    this.#mesh = mesh
    this.#terrain = terrain
    this.#cover = cover
    this.site = site
    this.#duration = duration
    this.#onLevelled = onLevelled

    const spacing = mesh.spacing
    const span = Math.ceil(reach / spacing) + 1
    const ci = Math.round(site.x / spacing)
    const cj = Math.round(site.y / spacing)
    for (let j = cj - span; j <= cj + span; j++) {
      for (let i = ci - span; i <= ci + span; i++) {
        const [vx, vy] = mesh.vertexPosition(i, j)
        const distance = Math.hypot(wrapDelta(vx - site.x, mesh.size), wrapDelta(vy - site.y, mesh.size))
        if (distance > reach) continue
        const weight = 1 - smoothstep(site.plaza + 2, reach, distance)
        this.#vertices.push({ i, j, from: mesh.heightOfVertex(i, j), weight })
      }
    }
    this.#bounds = [ci - span, cj - span, ci + span, cj + span]
    this.reach = reach
    cover.clear(site.x, site.y, site.plaza + 8, mesh.size)
  }

  get done() {
    return this.#elapsed >= this.#duration
  }

  static plateauFor(mesh, x, y, radius) {
    const spacing = mesh.spacing
    const span = Math.ceil(radius / spacing)
    const ci = Math.round(x / spacing)
    const cj = Math.round(y / spacing)
    let sum = 0
    let count = 0
    for (let j = cj - span; j <= cj + span; j++) {
      for (let i = ci - span; i <= ci + span; i++) {
        const [vx, vy] = mesh.vertexPosition(i, j)
        if (Math.hypot(wrapDelta(vx - x, mesh.size), wrapDelta(vy - y, mesh.size)) > radius) continue
        sum += mesh.heightOfVertex(i, j)
        count++
      }
    }
    return Math.max(mesh.seaLevel + 2, count ? sum / count : mesh.groundAt(x, y))
  }

  update(dt) {
    if (this.done) return
    this.#elapsed = Math.min(this.#duration, this.#elapsed + dt)
    const t = easeInOut(this.#elapsed / this.#duration)
    const plateau = this.site.plateau
    for (const vertex of this.#vertices) {
      this.#mesh.setVertexHeight(vertex.i, vertex.j, vertex.from + (plateau - vertex.from) * vertex.weight * t)
    }
    const [i0, j0, i1, j1] = this.#bounds
    this.#mesh.rebuildAround(i0, j0, i1, j1)
    this.#cover.settle(this.#mesh, this.site.x, this.site.y, this.reach, this.#mesh.size)
    if (this.done) {
      this.#flattenHeightmap()
      this.#onLevelled()
    }
  }

  #flattenHeightmap() {
    const terrain = this.#terrain
    const { x, y, plateau, plaza } = this.site
    const reach = Math.ceil(this.reach)
    for (let dy = -reach; dy <= reach; dy++) {
      for (let dx = -reach; dx <= reach; dx++) {
        const weight = 1 - smoothstep(plaza + 2, this.reach, Math.hypot(dx, dy))
        if (weight <= 0) continue
        const index = terrain.index(x + dx, y + dy)
        terrain.height[index] += (plateau - terrain.height[index]) * weight
      }
    }
  }
}
