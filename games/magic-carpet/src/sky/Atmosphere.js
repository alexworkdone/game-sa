import { smoothstep } from '../core/math.js'

const COLOR_KEYS = ['zenith', 'horizon', 'fog', 'scatter', 'cloudLit', 'cloudShade', 'ambient', 'sun']
const SCALAR_KEYS = ['stars', 'fogDensity', 'heightFog', 'glow']
const CHANNELS = ['R', 'G', 'B']

export class Atmosphere {
  #keys
  #moon

  constructor(keys, moon) {
    this.#keys = keys
    this.#moon = moon
    COLOR_KEYS.forEach((key) => CHANNELS.forEach((channel) => (this[key + channel] = 0)))
    SCALAR_KEYS.forEach((key) => (this[key] = 0))
    Object.assign(this, {
      lightR: 0,
      lightG: 0,
      lightB: 0,
      lightX: 0,
      lightY: 0,
      lightZ: 1,
      sunX: 0,
      sunY: 0,
      sunZ: 1,
      moonX: 0,
      moonY: 0,
      moonZ: -1,
      sunVisible: 1,
      moonVisible: 0,
      moonDiscR: moon.disc[0],
      moonDiscG: moon.disc[1],
      moonDiscB: moon.disc[2],
    })
  }

  update(day) {
    const elevation = day.sun.z
    const keys = this.#keys
    let upper = keys.findIndex((key) => key.at >= elevation)
    if (upper <= 0) upper = upper === 0 ? 1 : keys.length - 1
    const a = keys[upper - 1]
    const b = keys[upper]
    const t = Math.min(1, Math.max(0, (elevation - a.at) / (b.at - a.at)))

    for (const key of COLOR_KEYS) {
      for (let c = 0; c < 3; c++) this[key + CHANNELS[c]] = a[key][c] + (b[key][c] - a[key][c]) * t
    }
    for (const key of SCALAR_KEYS) this[key] = a[key] + (b[key] - a[key]) * t

    this.sunX = day.sun.x
    this.sunY = day.sun.y
    this.sunZ = day.sun.z
    this.moonX = day.moon.x
    this.moonY = day.moon.y
    this.moonZ = day.moon.z
    this.sunVisible = smoothstep(-0.08, 0.02, elevation)
    this.moonVisible = 1 - smoothstep(-0.1, 0.06, elevation)

    const sunStrength = smoothstep(-0.04, 0.1, elevation)
    if (sunStrength > 0) {
      this.#setLight(day.sun, this.sunR * sunStrength, this.sunG * sunStrength, this.sunB * sunStrength)
    } else {
      const moonStrength = smoothstep(-0.02, -0.15, elevation) * smoothstep(0, 0.12, day.moon.z)
      const light = this.#moon.light
      this.#setLight(day.moon, light[0] * moonStrength, light[1] * moonStrength, light[2] * moonStrength)
    }
  }

  #setLight(direction, r, g, b) {
    this.lightX = direction.x
    this.lightY = direction.y
    this.lightZ = direction.z
    this.lightR = r
    this.lightG = g
    this.lightB = b
  }
}
