import { packRgb, wrapDelta } from '../../core/math.js'
import { BURSTING } from '../../magic/ProjectilePool.js'

const SPARKS = 6

export class ProjectileLayer {
  #pool
  #spells
  #worldSize

  constructor(pool, spells, worldSize) {
    this.#pool = pool
    this.#worldSize = worldSize
    this.#spells = spells.map((spell) => ({
      ...spell,
      coreColor: packRgb(...spell.core),
      shellColor: packRgb(...spell.shell),
      trailColor: packRgb(...spell.trail),
    }))
  }

  collect(scene) {
    const { projector, batch, camera } = scene
    const pool = this.#pool
    const size = this.#worldSize
    for (let i = 0; i < pool.capacity; i++) {
      const state = pool.state[i]
      if (state === 0) continue
      const spell = this.#spells[pool.spell[i]]
      const rx = wrapDelta(pool.x[i] - camera.x, size)
      const ry = wrapDelta(pool.y[i] - camera.y, size)
      const z = pool.z[i]
      const distance = Math.hypot(rx, ry)
      const key = distance - 3

      if (state === BURSTING) {
        if (!projector.point(rx, ry, z)) continue
        const t = pool.age[i] / pool.burstTime
        const scale = projector.focal / projector.pd
        const reach = spell.blast * t * scale
        const cx = projector.px
        const cy = projector.py
        for (let s = 0; s < SPARKS; s++) {
          const angle = (s / SPARKS) * Math.PI * 2 + i
          batch.circle(key, spell.trailColor, cx + Math.cos(angle) * reach, cy + Math.sin(angle) * reach * 0.7, spell.radius * (1 - t) * scale * 0.8)
        }
        batch.circle(key - 0.001, spell.shellColor, cx, cy, spell.radius * 2.2 * (1 - t) * scale)
        batch.circle(key - 0.002, spell.coreColor, cx, cy, spell.radius * 1.2 * (1 - t) * scale)
        continue
      }

      const speed = Math.hypot(pool.vx[i], pool.vy[i], pool.vz[i]) || 1
      for (let k = 3; k >= 1; k--) {
        const back = (k * 1.6 * spell.radius) / speed
        if (!projector.point(rx - pool.vx[i] * back, ry - pool.vy[i] * back, z - pool.vz[i] * back)) continue
        const scale = projector.focal / projector.pd
        batch.circle(key + k * 0.01, spell.trailColor, projector.px, projector.py, spell.radius * (1 - k * 0.22) * scale)
      }
      if (!projector.point(rx, ry, z)) continue
      const scale = projector.focal / projector.pd
      batch.sphere(key, spell.coreColor, spell.shellColor, spell.trailColor, projector.px, projector.py, spell.radius * scale, 0, 0)
    }
  }
}
