import { packRgb, wrapDelta } from '../../core/math.js'

export class BalloonLayer {
  #fleet
  #worldSize
  #envelope
  #basket
  #cargo
  #xs = new Float32Array(4)
  #ys = new Float32Array(4)

  constructor(fleet, config, mana, worldSize) {
    this.#fleet = fleet
    this.#worldSize = worldSize
    this.#envelope = config.envelope.map((color) => packRgb(...color))
    this.#basket = packRgb(...config.basket)
    this.#cargo = mana.owned.map((color) => packRgb(...color))
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
        batch.sphere(key + 0.0015, this.#cargo[0], this.#cargo[1], this.#cargo[2], x, basketTop - 0.2 * scale, 0.8 * scale, -0.4, -0.5)
      }

      const [highlight, body, shade] = this.#envelope
      batch.sphere(key, highlight, body, shade, x, y - envelope * 0.9, envelope, -0.45, -0.5)
    }
  }
}
