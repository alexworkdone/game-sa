const pack = (r, g, b) =>
  ((b > 255 ? 255 : b < 0 ? 0 : b) << 16) | ((g > 255 ? 255 : g < 0 ? 0 : g) << 8) | (r > 255 ? 255 : r < 0 ? 0 : r)

const ORIGIN = 1 << 16

export class GroundShader {
  #atmosphere
  #shadows
  #clouds
  #config
  #seaLevel
  #radius = 1
  #fadeStart = 1
  #sunHX = 1
  #sunHY = 0
  #scatter = 0
  #lightOn = false
  #lightZSafe = 1
  #tint = [0, 0, 0]

  constructor({ atmosphere, shadows, clouds, config, seaLevel }) {
    this.#atmosphere = atmosphere
    this.#shadows = shadows
    this.#clouds = clouds
    this.#config = config
    this.#seaLevel = seaLevel
  }

  prepare() {
    const atmosphere = this.#atmosphere
    this.#radius = this.#config.radius
    this.#fadeStart = this.#radius * this.#config.edgeFog
    const horizontal = Math.hypot(atmosphere.sunX, atmosphere.sunY) || 1
    this.#sunHX = atmosphere.sunX / horizontal
    this.#sunHY = atmosphere.sunY / horizontal
    this.#scatter = (0.35 + atmosphere.glow * 0.45) * atmosphere.sunVisible
    this.#lightOn = atmosphere.lightZ > 0.01 && atmosphere.lightR + atmosphere.lightG + atmosphere.lightB > 0.01
    this.#lightZSafe = Math.max(0.2, atmosphere.lightZ)
  }

  get sunLateralX() {
    return this.#sunHX
  }

  get sunLateralY() {
    return this.#sunHY
  }

  get lightOn() {
    return this.#lightOn
  }

  shade(color, nx, ny, nz, wx, wy, wz, distance, dirX, dirY) {
    const atmosphere = this.#atmosphere
    let direct = 0
    if (this.#lightOn) {
      const ndl = nx * atmosphere.lightX + ny * atmosphere.lightY + nz * atmosphere.lightZ
      if (ndl > 0) direct = ndl * this.sunlight(wx, wy, wz)
    }
    const ambient = 0.78 + 0.22 * nz
    let r = (color & 255) * (atmosphere.ambientR * ambient + atmosphere.lightR * direct)
    let g = ((color >> 8) & 255) * (atmosphere.ambientG * ambient + atmosphere.lightG * direct)
    let b = ((color >> 16) & 255) * (atmosphere.ambientB * ambient + atmosphere.lightB * direct)
    return this.#fog(r, g, b, distance, wz, dirX, dirY)
  }

  sunlight(wx, wy, wz) {
    const shadows = this.#shadows
    const sx = (((wx + ORIGIN) | 0) >> shadows.shift) & shadows.mask
    const sy = (((wy + ORIGIN) | 0) >> shadows.shift) & shadows.mask
    let light = shadows.data[(sy << shadows.bits) | sx] / 255
    if (light <= 0) return 0
    const atmosphere = this.#atmosphere
    const clouds = this.#clouds
    const lift = (clouds.altitude - wz) / this.#lightZSafe
    const cx = (((wx + atmosphere.lightX * lift + clouds.origin) * clouds.inverseTexel + clouds.offsetX) | 0) & clouds.mask
    const cy = (((wy + atmosphere.lightY * lift + clouds.origin) * clouds.inverseTexel + clouds.offsetY) | 0) & clouds.mask
    const cover = (clouds.coverage[(cy << clouds.bits) | cx] - clouds.threshold) / clouds.softness
    if (cover > 0) light *= 1 - (cover > 1 ? 1 : cover) * clouds.shadowStrength
    return light
  }

  fogAmount(distance, height) {
    const atmosphere = this.#atmosphere
    let fog = 1 - Math.exp(-distance * atmosphere.fogDensity)
    if (distance > this.#fadeStart) {
      let t = (distance - this.#fadeStart) / (this.#radius - this.#fadeStart)
      if (t > 1) t = 1
      const edge = t * t * (3 - 2 * t)
      if (edge > fog) fog = edge
    }
    const lift = height - this.#seaLevel
    const mist = atmosphere.heightFog * Math.exp(-(lift > 0 ? lift : 0) / this.#config.heightFogScale) * (1 - Math.exp(-distance / 120))
    return 1 - (1 - fog) * (1 - mist)
  }

  fogTint(dirX, dirY, out) {
    const atmosphere = this.#atmosphere
    const toward = dirX * this.#sunHX + dirY * this.#sunHY
    let scatter = toward > 0 ? toward * toward : 0
    scatter = scatter * scatter * this.#scatter
    out[0] = atmosphere.fogR + (atmosphere.scatterR - atmosphere.fogR) * scatter
    out[1] = atmosphere.fogG + (atmosphere.scatterG - atmosphere.fogG) * scatter
    out[2] = atmosphere.fogB + (atmosphere.scatterB - atmosphere.fogB) * scatter
    return out
  }

  #fog(r, g, b, distance, height, dirX, dirY) {
    const fog = this.fogAmount(distance, height)
    const tint = this.fogTint(dirX, dirY, this.#tint)
    return pack(r + (tint[0] - r) * fog, g + (tint[1] - g) * fog, b + (tint[2] - b) * fog)
  }
}
