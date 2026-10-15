import { packRgb, wrapDelta } from '../../core/math.js'

const RING_DOTS = 32

export class MagnetLayer {
  #magnetism
  #mana
  #ground
  #worldSize
  #glow
  #core
  #config
  #xs = new Float32Array(4)
  #ys = new Float32Array(4)

  constructor(magnetism, mana, ground, spell, config, worldSize) {
    this.#magnetism = magnetism
    this.#mana = mana
    this.#ground = ground
    this.#config = config
    this.#worldSize = worldSize
    this.#glow = packRgb(...spell.shell)
    this.#core = packRgb(...spell.core)
  }

  collect(scene) {
    const { projector, batch, camera } = scene
    const mana = this.#mana
    const size = this.#worldSize
    for (const pull of this.#magnetism.pulls) {
      const cx = wrapDelta(pull.x - camera.x, size)
      const cy = wrapDelta(pull.y - camera.y, size)
      const t = pull.age / this.#config.ring
      if (t < 1) {
        const reach = this.#magnetism.radius * (1 - (1 - t) * (1 - t))
        for (let k = 0; k < RING_DOTS; k++) {
          const angle = (k / RING_DOTS) * Math.PI * 2
          const px = cx + Math.cos(angle) * reach
          const py = cy + Math.sin(angle) * reach
          const pz = this.#ground.groundAt(pull.x + Math.cos(angle) * reach, pull.y + Math.sin(angle) * reach) + 1.2
          if (!projector.point(px, py, pz)) continue
          batch.circle(Math.hypot(px, py) - 3, this.#glow, projector.px, projector.py, Math.max(1.4, (1 - t * 0.6) * 1.8 * (projector.focal / projector.pd)))
        }
      }
      if (!projector.point(cx, cy, pull.z)) continue
      const tx = projector.px
      const ty = projector.py
      for (const i of pull.members) {
        const mx = wrapDelta(mana.x[i] - camera.x, size)
        const my = wrapDelta(mana.y[i] - camera.y, size)
        if (!projector.point(mx, my, mana.z[i])) continue
        this.#tether(batch, Math.hypot(mx, my) - 2.5, projector.px, projector.py, tx, ty, pull.age)
      }
    }
  }

  #tether(batch, key, ax, ay, bx, by, age) {
    const dx = bx - ax
    const dy = by - ay
    const length = Math.hypot(dx, dy)
    if (length < 1) return
    const nx = (-dy / length) * 1.1
    const ny = (dx / length) * 1.1
    const xs = this.#xs
    const ys = this.#ys
    xs[0] = ax + nx
    ys[0] = ay + ny
    xs[1] = bx + nx * 0.4
    ys[1] = by + ny * 0.4
    xs[2] = bx - nx * 0.4
    ys[2] = by - ny * 0.4
    xs[3] = ax - nx
    ys[3] = ay - ny
    batch.polygon(key, this.#glow, xs, ys, 4, false)
    const pulse = (age * 1.6) % 1
    batch.circle(key - 0.001, this.#core, ax + dx * pulse, ay + dy * pulse, 1.6)
  }
}
