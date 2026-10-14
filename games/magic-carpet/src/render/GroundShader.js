const pack = (r, g, b) =>
  ((b > 255 ? 255 : b < 0 ? 0 : b) << 16) | ((g > 255 ? 255 : g < 0 ? 0 : g) << 8) | (r > 255 ? 255 : r < 0 ? 0 : r)

const ORIGIN = 1 << 16

export class GroundShader {
  #atmosphere
  #shadows
  #clouds
  #config
  #seaLevel
  #palette
  #radius = 1
  #fadeStart = 1
  #camZ = 0
  #sunHX = 1
  #sunHY = 0
  #scatter = 0
  #lightOn = false
  #lightZSafe = 1

  constructor({ atmosphere, shadows, clouds, config, seaLevel, palette }) {
    this.#atmosphere = atmosphere
    this.#shadows = shadows
    this.#clouds = clouds
    this.#config = config
    this.#seaLevel = seaLevel
    this.#palette = palette
  }

  prepare(camera) {
    const atmosphere = this.#atmosphere
    this.#radius = this.#config.radius
    this.#fadeStart = this.#radius * this.#config.edgeFog
    this.#camZ = camera.z
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

  shade(color, nx, ny, nz, wx, wy, wz, distance, dirX, dirY) {
    const atmosphere = this.#atmosphere
    let direct = 0
    if (this.#lightOn) {
      const ndl = nx * atmosphere.lightX + ny * atmosphere.lightY + nz * atmosphere.lightZ
      if (ndl > 0) direct = ndl * this.#sunlight(wx, wy, wz)
    }
    const ambient = 0.78 + 0.22 * nz
    let r = (color & 255) * (atmosphere.ambientR * ambient + atmosphere.lightR * direct)
    let g = ((color >> 8) & 255) * (atmosphere.ambientG * ambient + atmosphere.lightG * direct)
    let b = ((color >> 16) & 255) * (atmosphere.ambientB * ambient + atmosphere.lightB * direct)
    return this.#fog(r, g, b, distance, wz, dirX, dirY)
  }

  shadeWater(depth, wx, wy, distance, dirX, dirY, phase, time) {
    const atmosphere = this.#atmosphere
    const palette = this.#palette
    const t = depth > 10 ? 1 : depth / 10
    const from = t < 0.5 ? palette.waterShallow : palette.waterMid
    const to = t < 0.5 ? palette.waterMid : palette.waterDeep
    const k = t < 0.5 ? t * 2 : (t - 0.5) * 2
    const sea = this.#seaLevel
    const sun = this.#lightOn ? Math.max(0, atmosphere.lightZ) * 0.6 * this.#sunlight(wx, wy, sea) : 0
    const shimmer = 1 + Math.sin(time * 1.3 + phase * 40) * this.#config.waterShimmer
    let r = (from[0] + (to[0] - from[0]) * k) * (atmosphere.ambientR + atmosphere.lightR * sun) * shimmer
    let g = (from[1] + (to[1] - from[1]) * k) * (atmosphere.ambientG + atmosphere.lightG * sun) * shimmer
    let b = (from[2] + (to[2] - from[2]) * k) * (atmosphere.ambientB + atmosphere.lightB * sun) * shimmer

    const height = this.#camZ - sea
    const elevation = height / Math.sqrt(distance * distance + height * height)
    const m = 1 - elevation
    const fresnel = 0.04 + 0.6 * m * m * m * m * m
    let sky = elevation * 1.6
    if (sky > 1) sky = 1
    sky = 1 - (1 - sky) * (1 - sky)
    r += (atmosphere.horizonR + (atmosphere.zenithR - atmosphere.horizonR) * sky - r) * fresnel
    g += (atmosphere.horizonG + (atmosphere.zenithG - atmosphere.horizonG) * sky - g) * fresnel
    b += (atmosphere.horizonB + (atmosphere.zenithB - atmosphere.horizonB) * sky - b) * fresnel

    if (atmosphere.sunVisible > 0 && atmosphere.sunZ > 0) {
      const inv = 1 / Math.sqrt(distance * distance + height * height)
      const tilt = Math.sin(time * 2.1 + phase * 97) * 0.05
      const reflect =
        dirX * distance * inv * atmosphere.sunX + dirY * distance * inv * atmosphere.sunY + height * inv * atmosphere.sunZ + tilt
      if (reflect > 0.9) {
        let p = reflect * reflect
        p *= p
        p *= p
        p *= p
        p *= p
        const glint = p * this.#config.glint * atmosphere.sunVisible
        r += atmosphere.lightR * 255 * glint
        g += atmosphere.lightG * 255 * glint
        b += atmosphere.lightB * 255 * glint
      }
    }
    return this.#fog(r, g, b, distance, sea, dirX, dirY)
  }

  #sunlight(wx, wy, wz) {
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

  #fog(r, g, b, distance, height, dirX, dirY) {
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
    fog = 1 - (1 - fog) * (1 - mist)

    const toward = dirX * this.#sunHX + dirY * this.#sunHY
    let scatter = toward > 0 ? toward * toward : 0
    scatter = scatter * scatter * this.#scatter
    const fogR = atmosphere.fogR + (atmosphere.scatterR - atmosphere.fogR) * scatter
    const fogG = atmosphere.fogG + (atmosphere.scatterG - atmosphere.fogG) * scatter
    const fogB = atmosphere.fogB + (atmosphere.scatterB - atmosphere.fogB) * scatter
    return pack(r + (fogR - r) * fog, g + (fogG - g) * fog, b + (fogB - b) * fog)
  }
}
