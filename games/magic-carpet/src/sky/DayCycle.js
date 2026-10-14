import { TAU } from '../core/math.js'

const orbit = (angle, tilt, target) => {
  const s = Math.sin(angle)
  target.x = Math.cos(angle)
  target.y = s * Math.sin(tilt)
  target.z = s * Math.cos(tilt)
}

export class DayCycle {
  #config
  time
  sun = { x: 0, y: 0, z: 1 }
  moon = { x: 0, y: 0, z: -1 }

  constructor(config) {
    this.#config = config
    this.time = config.start
    this.#recompute()
  }

  get angle() {
    return (this.time - 0.25) * TAU
  }

  get tilt() {
    return this.#config.tilt
  }

  update(dt, speed = 1) {
    this.time = (this.time + (dt * speed) / this.#config.length) % 1
    this.#recompute()
  }

  clock() {
    const minutes = Math.floor(this.time * 24 * 60)
    const hours = Math.floor(minutes / 60)
    return `${String(hours).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`
  }

  #recompute() {
    orbit(this.angle, this.#config.tilt, this.sun)
    orbit(this.angle + Math.PI + this.#config.moonOffset, this.#config.tilt, this.moon)
  }
}
