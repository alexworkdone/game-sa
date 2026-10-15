import { packRgb, wrapDelta } from '../../core/math.js'
import { PLAYER } from '../../realm/ManaField.js'

const BACK = packRgb(24, 16, 52)
const STRONG = packRgb(124, 214, 110)
const WEAK = packRgb(255, 112, 86)
const STRUCK = packRgb(255, 236, 200)

export class CastleGaugeLayer {
  #castles
  #config
  #worldSize
  #xs = new Float32Array(4)
  #ys = new Float32Array(4)

  constructor(castles, config, worldSize) {
    this.#castles = castles
    this.#config = config
    this.#worldSize = worldSize
  }

  collect(scene) {
    const { projector, batch, camera } = scene
    const config = this.#config
    for (const castle of this.#castles) {
      if (!castle.standing || castle.owner === PLAYER || castle.health >= castle.maxHealth) continue
      const rx = wrapDelta(castle.x - camera.x, this.#worldSize)
      const ry = wrapDelta(castle.y - camera.y, this.#worldSize)
      const distance = Math.hypot(rx, ry)
      if (distance > config.range) continue
      if (!projector.point(rx, ry, castle.top + config.lift)) continue
      const share = Math.max(0, castle.health / castle.maxHealth)
      const key = distance - 1
      const half = config.width / 2
      const x = projector.px
      const y = projector.py - config.height
      this.#rect(batch, key, BACK, x - half - 1.5, y - 1.5, config.width + 3, config.height + 3)
      const fill = castle.struckAgo < config.flash ? STRUCK : share < 0.35 ? WEAK : STRONG
      if (share > 0) this.#rect(batch, key - 0.001, fill, x - half, y, config.width * share, config.height)
    }
  }

  #rect(batch, key, color, x, y, width, height) {
    const xs = this.#xs
    const ys = this.#ys
    xs[0] = x
    ys[0] = y
    xs[1] = x + width
    ys[1] = y
    xs[2] = x + width
    ys[2] = y + height
    xs[3] = x
    ys[3] = y + height
    batch.polygon(key, color, xs, ys, 4, false)
  }
}
