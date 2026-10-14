import { packRgb, wrapDelta } from '../../core/math.js'
import { PLAYER } from '../../realm/ManaField.js'

const packAll = (colors) => colors.map((color) => packRgb(...color))

export class ManaLayer {
  #mana
  #worldSize
  #neutral
  #owned

  constructor(mana, config, worldSize) {
    this.#mana = mana
    this.#worldSize = worldSize
    this.#neutral = packAll(config.neutral)
    this.#owned = packAll(config.owned)
  }

  collect(scene) {
    const { projector, batch, camera, radius, time } = scene
    const mana = this.#mana
    const size = this.#worldSize
    for (let i = 0; i < mana.capacity; i++) {
      if (!mana.isFree(i)) continue
      const rx = wrapDelta(mana.x[i] - camera.x, size)
      const ry = wrapDelta(mana.y[i] - camera.y, size)
      const distance = Math.hypot(rx, ry)
      if (distance > radius) continue
      const z = mana.z[i] + Math.sin(time * 1.6 + mana.phase[i]) * 0.6
      if (!projector.point(rx, ry, z)) continue
      const scale = projector.focal / projector.pd
      const orbRadius = (0.9 + Math.sqrt(mana.value[i]) * 0.36) * scale
      if (orbRadius < 0.6) continue
      const [highlight, body, shade] = mana.owner[i] === PLAYER ? this.#owned : this.#neutral
      batch.sphere(distance - 2, highlight, body, shade, projector.px, projector.py, orbRadius, -0.4, -0.5)
    }
  }
}
