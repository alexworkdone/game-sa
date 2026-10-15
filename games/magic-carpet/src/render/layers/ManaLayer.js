import { smoothstep, wrapDelta } from '../../core/math.js'
import { PLAYER, manaRadius } from '../../realm/ManaField.js'

const AFTER_GROUND = 3

const veil = (color, fog, tint) =>
  (Math.round(color[2] + (tint[2] - color[2]) * fog) << 16) |
  (Math.round(color[1] + (tint[1] - color[1]) * fog) << 8) |
  Math.round(color[0] + (tint[0] - color[0]) * fog)

export class ManaLayer {
  #mana
  #mesh
  #worldSize
  #config
  #spot = { height: 0, anchorX: 0, anchorY: 0 }
  #tint = [0, 0, 0]

  constructor(mana, mesh, config, worldSize) {
    this.#mana = mana
    this.#mesh = mesh
    this.#config = config
    this.#worldSize = worldSize
  }

  collect(scene) {
    const { projector, batch, shader, camera, time } = scene
    const mana = this.#mana
    const config = this.#config
    const size = this.#worldSize
    const spot = this.#spot
    const tint = this.#tint
    const viewRadius = config.viewRadius
    for (let i = 0; i < mana.capacity; i++) {
      if (!mana.isFree(i)) continue
      const rx = wrapDelta(mana.x[i] - camera.x, size)
      const ry = wrapDelta(mana.y[i] - camera.y, size)
      const distance = Math.hypot(rx, ry)
      if (distance > viewRadius) continue
      const z = mana.z[i] + Math.sin(time * 1.6 + mana.phase[i]) * 0.6
      if (!projector.point(rx, ry, z)) continue
      const scale = projector.focal / projector.pd
      const orbRadius = manaRadius(mana.value[i], config.sizeScale) * scale
      if (orbRadius < 0.6) continue

      const inv = distance > 1e-3 ? 1 / distance : 0
      const fog = Math.max(shader.fogAmount(distance, z), smoothstep(config.fadeStart, viewRadius, distance))
      shader.fogTint(rx * inv, ry * inv, tint)
      this.#mesh.locate(mana.x[i], mana.y[i], spot)
      const anchorX = wrapDelta(spot.anchorX - camera.x, size)
      const anchorY = wrapDelta(spot.anchorY - camera.y, size)
      const [highlight, body, shade] = mana.owner[i] === PLAYER ? config.owned : config.neutral
      batch.sphere(
        Math.hypot(anchorX, anchorY) - AFTER_GROUND,
        veil(highlight, fog, tint),
        veil(body, fog, tint),
        veil(shade, fog, tint),
        projector.px,
        projector.py,
        orbRadius,
        -0.4,
        -0.5,
      )
    }
  }
}
