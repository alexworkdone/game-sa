import { packRgb, wrapDelta } from '../../core/math.js'
import { AIM, FALLING, GONE } from '../../realm/Crowd.js'

const AFTER_GROUND = 2.5

export class PeopleLayer {
  #crowd
  #mesh
  #config
  #worldSize
  #radius
  #skin
  #legs
  #flash
  #spot = { height: 0, anchorX: 0, anchorY: 0 }
  #xs = new Float32Array(4)
  #ys = new Float32Array(4)

  constructor(crowd, mesh, config, shot, worldSize, radius) {
    this.#crowd = crowd
    this.#mesh = mesh
    this.#config = config
    this.#worldSize = worldSize
    this.#radius = radius
    this.#skin = packRgb(...config.skin)
    this.#legs = packRgb(...config.legs)
    this.#flash = packRgb(...shot.shell)
  }

  collect(scene) {
    const { projector, batch, shader, camera } = scene
    const size = this.#worldSize
    const spot = this.#spot
    const sunX = shader.sunLateralX
    const sunY = shader.sunLateralY
    for (const person of this.#crowd.people) {
      if (person.state === GONE) continue
      const rx = wrapDelta(person.x - camera.x, size)
      const ry = wrapDelta(person.y - camera.y, size)
      const distance = Math.hypot(rx, ry)
      if (distance > this.#radius) continue
      if (!projector.point(rx, ry, person.z)) continue
      const tall = this.#config.height * (projector.focal / projector.pd)
      if (tall < 2) continue
      const x = projector.px
      const y = projector.py
      if (x + tall < -projector.extentX || x - tall > projector.extentX || y - tall > projector.extentY || y < -projector.extentY) continue

      this.#mesh.locate(person.x, person.y, spot)
      const anchorX = wrapDelta(spot.anchorX - camera.x, size)
      const anchorY = wrapDelta(spot.anchorY - camera.y, size)
      const key = Math.hypot(anchorX, anchorY) - AFTER_GROUND
      const inv = 1 / Math.max(distance, 1e-3)
      const wx = person.x
      const wy = person.y
      const lit = (color) => shader.shade(color, sunX * 0.45, sunY * 0.45, 0.8, wx, wy, person.z + 2, distance, rx * inv, ry * inv)
      const fall = person.state === FALLING ? Math.min(1, person.timer / this.#config.fallTime) : 0
      const squash = 1 - fall * 0.82
      const lean = fall * tall * 0.5
      const up = (share) => y - share * tall * squash
      const tunic = lit(packRgb(...person.tunic))
      const skin = lit(this.#skin)

      if (tall < 7) {
        this.#quad(batch, key, tunic, x - tall * 0.14, up(0.85), x + tall * 0.14 + lean, up(0.85), x + tall * 0.18 + lean, y, x - tall * 0.18, y)
        continue
      }

      const swing = person.state === AIM || fall > 0 ? 0 : Math.sin(person.stride * 1.7) * tall * 0.11
      const legs = lit(this.#legs)
      const hip = up(0.42)
      const leg = tall * 0.045
      this.#quad(batch, key + 0.002, legs, x - tall * 0.08 - leg, hip, x - tall * 0.08 + leg, hip, x - tall * 0.08 + swing + leg, y, x - tall * 0.08 + swing - leg, y)
      this.#quad(batch, key + 0.002, legs, x + tall * 0.08 - leg, hip, x + tall * 0.08 + leg, hip, x + tall * 0.08 - swing + leg, y, x + tall * 0.08 - swing - leg, y)

      const shoulder = up(0.8)
      const arm = tall * 0.04
      if (person.state === AIM && fall === 0) {
        const handX = x + tall * 0.12
        const handY = up(1.12)
        this.#quad(batch, key - 0.001, skin, x + tall * 0.12 - arm, shoulder, x + tall * 0.12 + arm, shoulder, handX + arm, handY, handX - arm, handY)
        if (person.flash > 0) batch.circle(key - 0.003, this.#flash, handX, handY, tall * 0.12)
      } else {
        this.#quad(batch, key + 0.001, skin, x - tall * 0.16 - arm, shoulder, x - tall * 0.16 + arm, shoulder, x - tall * 0.18 - swing * 0.6 + arm, up(0.48), x - tall * 0.18 - swing * 0.6 - arm, up(0.48))
        this.#quad(batch, key + 0.001, skin, x + tall * 0.16 - arm, shoulder, x + tall * 0.16 + arm, shoulder, x + tall * 0.18 + swing * 0.6 + arm, up(0.48), x + tall * 0.18 + swing * 0.6 - arm, up(0.48))
      }
      this.#quad(batch, key, tunic, x - tall * 0.15 + lean * 0.6, shoulder, x + tall * 0.15 + lean * 0.6, shoulder, x + tall * 0.21, up(0.36), x - tall * 0.21, up(0.36))
      batch.circle(key - 0.002, skin, x + lean, up(0.91), tall * 0.1)
    }
  }

  #quad(batch, key, color, ax, ay, bx, by, cx, cy, dx, dy) {
    const xs = this.#xs
    const ys = this.#ys
    xs[0] = ax
    ys[0] = ay
    xs[1] = bx
    ys[1] = by
    xs[2] = cx
    ys[2] = cy
    xs[3] = dx
    ys[3] = dy
    batch.polygon(key, color, xs, ys, 4, false)
  }
}
