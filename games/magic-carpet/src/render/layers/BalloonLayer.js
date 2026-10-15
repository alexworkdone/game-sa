import { packRgb, wrapDelta } from '../../core/math.js'
import { manaRadius } from '../../realm/ManaField.js'

export class BalloonLayer {
  #fleet
  #worldSize
  #envelope
  #basket
  #cargo
  #gaugeBack
  #gaugeFill
  #sizeScale
  #xs = new Float32Array(4)
  #ys = new Float32Array(4)

  constructor(fleet, config, mana, worldSize) {
    this.#fleet = fleet
    this.#worldSize = worldSize
    this.#envelope = config.envelope.map((color) => packRgb(...color))
    this.#basket = packRgb(...config.basket)
    this.#cargo = mana.owned.map((color) => packRgb(...color))
    this.#gaugeBack = packRgb(...config.gauge[0])
    this.#gaugeFill = packRgb(...config.gauge[1])
    this.#sizeScale = mana.sizeScale
  }

  collect(scene) {
    const { projector, batch, camera, radius, time } = scene
    const xs = this.#xs
    const ys = this.#ys
    for (const balloon of this.#fleet.balloons) {
      const rx = wrapDelta(balloon.x - camera.x, this.#worldSize)
      const ry = wrapDelta(balloon.y - camera.y, this.#worldSize)
      const distance = Math.hypot(rx, ry)
      if (distance > radius) continue
      const z = balloon.z + Math.sin(time * 0.9 + balloon.sway) * 0.4
      if (!projector.point(rx, ry, z)) continue
      const scale = projector.focal / projector.pd
      const x = projector.px
      const y = projector.py
      const envelope = 3.4 * scale
      const basketTop = y + 1.4 * scale
      const basketHalf = 0.9 * scale
      const basketBottom = basketTop + 1.3 * scale
      const key = distance - 3

      xs[0] = x - envelope * 0.55
      ys[0] = y - envelope * 0.1
      xs[1] = x - basketHalf * 0.8
      ys[1] = basketTop
      xs[2] = x - basketHalf * 0.8 + Math.max(0.6, 0.12 * scale)
      ys[2] = basketTop
      xs[3] = x - envelope * 0.55 + Math.max(0.6, 0.12 * scale)
      ys[3] = y - envelope * 0.1
      batch.polygon(key + 0.002, this.#basket, xs, ys, 4, false)
      for (let k = 0; k < 4; k++) xs[k] = 2 * x - xs[k]
      batch.polygon(key + 0.002, this.#basket, xs, ys, 4, false)

      xs[0] = x - basketHalf
      ys[0] = basketTop
      xs[1] = x + basketHalf
      ys[1] = basketTop
      xs[2] = x + basketHalf * 0.8
      ys[2] = basketBottom
      xs[3] = x - basketHalf * 0.8
      ys[3] = basketBottom
      batch.polygon(key + 0.001, this.#basket, xs, ys, 4, false)
      if (balloon.cargo > 0) {
        const load = Math.min(manaRadius(balloon.cargo, this.#sizeScale) * 0.55, 1.6) * scale
        batch.sphere(key + 0.0015, this.#cargo[0], this.#cargo[1], this.#cargo[2], x, basketTop - load * 0.4, load, -0.4, -0.5)
      }

      const [highlight, body, shade] = this.#envelope
      batch.sphere(key, highlight, body, shade, x, y - envelope * 0.9, envelope, -0.45, -0.5)

      const fill = Math.min(1, balloon.cargo / balloon.capacity)
      const gaugeHalf = envelope * 0.85
      const gaugeHeight = Math.max(3, envelope * 0.16)
      const gaugeTop = y - envelope * 2.1 - gaugeHeight
      this.#rect(batch, key - 0.001, this.#gaugeBack, x - gaugeHalf - 1, gaugeTop - 1, gaugeHalf * 2 + 2, gaugeHeight + 2)
      if (fill > 0) this.#rect(batch, key - 0.002, this.#gaugeFill, x - gaugeHalf, gaugeTop, gaugeHalf * 2 * fill, gaugeHeight)
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
