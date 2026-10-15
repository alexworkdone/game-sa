import { wrapDelta } from '../core/math.js'
import { heightOf } from './colliders.js'

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
