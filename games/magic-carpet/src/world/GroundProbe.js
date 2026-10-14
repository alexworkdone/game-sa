import { wrapDelta } from '../core/math.js'

const heightOf = (shape, x, y) => {
  switch (shape.kind) {
    case 'box':
      return x >= shape.x0 && x <= shape.x1 && y >= shape.y0 && y <= shape.y1 ? shape.top : -Infinity
    case 'cylinder':
      return Math.hypot(x - shape.x, y - shape.y) <= shape.radius ? shape.top : -Infinity
    case 'cone': {
      const distance = Math.hypot(x - shape.x, y - shape.y)
      return distance <= shape.radius ? shape.base + shape.height * (1 - distance / shape.radius) : -Infinity
    }
    case 'pyramid': {
      const ring = Math.max(Math.abs(x - shape.x), Math.abs(y - shape.y))
      return ring <= shape.half ? shape.base + shape.height * (1 - ring / shape.half) : -Infinity
    }
    default:
      return -Infinity
  }
}

export class GroundProbe {
  #mesh
  #structures
  #size

  constructor(mesh, structures) {
    this.#mesh = mesh
    this.#structures = structures
    this.#size = mesh.size
  }

  get seaLevel() {
    return this.#mesh.seaLevel
  }

  groundAt(x, y) {
    let ground = this.#mesh.groundAt(x, y)
    for (const structure of this.#structures) {
      const dx = wrapDelta(x - structure.x, this.#size)
      const dy = wrapDelta(y - structure.y, this.#size)
      if (Math.abs(dx) > structure.reach || Math.abs(dy) > structure.reach) continue
      const px = structure.x + dx
      const py = structure.y + dy
      for (const shape of structure.colliders) {
        const top = heightOf(shape, px, py)
        if (top > ground) ground = top
      }
    }
    return ground
  }
}
