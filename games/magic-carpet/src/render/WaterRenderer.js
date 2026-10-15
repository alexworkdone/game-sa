const pack = (r, g, b) =>
  0xff000000 | ((b > 255 ? 255 : b < 0 ? 0 : b) << 16) | ((g > 255 ? 255 : g < 0 ? 0 : g) << 8) | (r > 255 ? 255 : r < 0 ? 0 : r)

const ORIGIN = 1 << 16
const FOG_STEPS = 512

export class WaterRenderer {
  #atmosphere
  #clouds
  #shader
  #mesh
  #waves
  #config
  #radius
  #lateral = new Float32Array(0)
  #lengthSq = new Float32Array(0)
  #length = new Float32Array(0)
  #fogR = new Float32Array(0)
  #fogG = new Float32Array(0)
  #fogB = new Float32Array(0)
  #far = new Uint32Array(0)
  #fogLut = new Float32Array(FOG_STEPS + 1)
  #tint = [0, 0, 0]

  constructor({ atmosphere, clouds, shader, mesh, waves, config, radius }) {
    this.#atmosphere = atmosphere
    this.#clouds = clouds
    this.#shader = shader
    this.#mesh = mesh
    this.#waves = waves
    this.#config = config
    this.#radius = radius
  }

  render(target, camera, view, time) {
    const width = view.width
    const height = view.height
    const focal = view.focal
    const invFocal = 1 / focal
    const horizon = height * 0.5 + Math.tan(camera.pitch) * focal
    const first = Math.max(0, Math.ceil(horizon - 0.5))
    if (first >= height) return

    const shader = this.#shader
    const mesh = this.#mesh
    const sea = mesh.seaLevel
    const radius = this.#radius
    shader.prepare()
    this.#prepareColumns(width, camera.yaw, invFocal)
    this.#prepareFog(sea)

    const atmosphere = this.#atmosphere
    const clouds = this.#clouds
    const waves = this.#waves
    const config = this.#config
    const stride = target.stride
    const pixels = target.pixels
    const clearSky = target.clearSky
    const lateral = this.#lateral
    const lengthSq = this.#lengthSq
    const lengths = this.#length
    const fogR = this.#fogR
    const fogG = this.#fogG
    const fogB = this.#fogB
    const far = this.#far
    const fogLut = this.#fogLut
    const fogScale = FOG_STEPS / radius

    const heights = mesh.vz
    const cells = mesh.cells
    const cellMask = mesh.mask
    const invSpacing = 1 / mesh.spacing

    const slopeX = waves.slopeX
    const slopeY = waves.slopeY
    const waveSize = waves.size
    const waveMask = waves.mask
    const swell = config.swell
    const ripple = config.ripple
    const swellInv = 1 / swell.texel
    const rippleInv = 1 / ripple.texel
    const swellOffX = (time * swell.drift[0] * swellInv) % waveSize
    const swellOffY = (time * swell.drift[1] * swellInv) % waveSize
    const rippleOffX = (time * ripple.drift[0] * rippleInv) % waveSize
    const rippleOffY = (time * ripple.drift[1] * rippleInv) % waveSize
    const rippleGain = ripple.gain
    const waveStrength = config.waveStrength
    const invWaveFade = 1 / config.waveFade

    const cloudCoverage = clouds.coverage
    const cloudMask = clouds.mask
    const cloudBits = clouds.bits
    const cloudInv = clouds.inverseTexel
    const cloudOffX = clouds.offsetX
    const cloudOffY = clouds.offsetY
    const cloudSpan = clouds.altitude - sea
    const cloudFar = clouds.far
    const invCloudFarSq = 1 / (cloudFar * cloudFar)
    const cloudThreshold = clouds.threshold
    const cloudInvSoft = 1 / clouds.softness
    const cloudMix = clouds.opacity * config.cloudReflection

    const zenR = atmosphere.zenithR
    const zenG = atmosphere.zenithG
    const zenB = atmosphere.zenithB
    const horR = atmosphere.horizonR
    const horG = atmosphere.horizonG
    const horB = atmosphere.horizonB
    const litR = atmosphere.cloudLitR
    const litG = atmosphere.cloudLitG
    const litB = atmosphere.cloudLitB
    const shadeR = atmosphere.cloudShadeR
    const shadeG = atmosphere.cloudShadeG
    const shadeB = atmosphere.cloudShadeB
    const ambR = atmosphere.ambientR
    const ambG = atmosphere.ambientG
    const ambB = atmosphere.ambientB
    const lightOn = shader.lightOn
    const lightX = atmosphere.lightX
    const lightY = atmosphere.lightY
    const lightZ = atmosphere.lightZ
    const sunR = atmosphere.lightR * (lightZ > 0 ? lightZ : 0)
    const sunG = atmosphere.lightG * (lightZ > 0 ? lightZ : 0)
    const sunB = atmosphere.lightB * (lightZ > 0 ? lightZ : 0)
    const glintR = atmosphere.lightR * 255 * config.glint
    const glintG = atmosphere.lightG * 255 * config.glint
    const glintB = atmosphere.lightB * 255 * config.glint
    const sheen = config.sheen

    const [shallowR, shallowG, shallowB] = config.shallow
    const [deepR, deepG, deepB] = config.deep
    const [foamR, foamG, foamB] = config.foam
    const dryR = config.shore[0] * ambR
    const dryG = config.shore[1] * ambG
    const dryB = config.shore[2] * ambB
    const depthScale = config.depthScale
    const dryMargin = -config.dryMargin
    const foamDepth = config.foamDepth
    const invFoamDepth = 1 / foamDepth
    const foamStrength = config.foamStrength
    const foamClock = time * config.foamSpeed
    const foamRipple = config.foamRipple
    const reflectance = config.reflectance

    const fX = Math.cos(camera.yaw)
    const fY = Math.sin(camera.yaw)
    const rX = -fY
    const rY = fX
    const camX = camera.x
    const camY = camera.y
    const lift = Math.max(0.5, camera.z - sea)

    for (let y = first; y < height; y++) {
      const v = (horizon - y - 0.5) * invFocal
      let o = y * stride
      if (v > -1e-5) {
        for (let c = 0; c < width; c++, o++) {
          pixels[o] = far[c]
          clearSky[o] = 0
        }
        continue
      }
      const reach = lift / -v
      const baseX = camX + fX * reach
      const baseY = camY + fY * reach
      const stepX = rX * reach
      const stepY = rY * reach
      const vv = v * v

      for (let c = 0; c < width; c++, o++) {
        clearSky[o] = 0
        const distance = reach * lengths[c]
        const fog = distance < radius ? fogLut[(distance * fogScale) | 0] : 1
        if (fog > 0.985) {
          pixels[o] = far[c]
          continue
        }
        const u = lateral[c]
        const wx = baseX + stepX * u
        const wy = baseY + stepY * u

        const gx = (wx + ORIGIN) * invSpacing
        const gy = (wy + ORIGIN) * invSpacing
        const ix = gx | 0
        const iy = gy | 0
        const tx = gx - ix
        const ty = gy - iy
        const x0 = ix & cellMask
        const x1 = (ix + 1) & cellMask
        const y0 = (iy & cellMask) * cells
        const y1 = ((iy + 1) & cellMask) * cells
        const top = heights[y0 + x0] + (heights[y0 + x1] - heights[y0 + x0]) * tx
        const bottom = heights[y1 + x0] + (heights[y1 + x1] - heights[y1 + x0]) * tx
        let depth = sea - (top + (bottom - top) * ty)

        if (depth < dryMargin) {
          pixels[o] = pack(dryR + (fogR[c] - dryR) * fog, dryG + (fogG[c] - dryG) * fog, dryB + (fogB[c] - dryB) * fog)
          continue
        }
        if (depth < 0) depth = 0

        const amplitude = waveStrength / (1 + distance * invWaveFade)
        let sx = 0
        let sy = 0
        {
          const ax = (wx + ORIGIN) * swellInv + swellOffX
          const ay = (wy + ORIGIN) * swellInv + swellOffY
          const jx = ax | 0
          const jy = ay | 0
          const kx = ax - jx
          const ky = ay - jy
          const a0 = jx & waveMask
          const a1 = (jx + 1) & waveMask
          const b0 = (jy & waveMask) * waveSize
          const b1 = ((jy + 1) & waveMask) * waveSize
          let p = slopeX[b0 + a0] + (slopeX[b0 + a1] - slopeX[b0 + a0]) * kx
          let q = slopeX[b1 + a0] + (slopeX[b1 + a1] - slopeX[b1 + a0]) * kx
          sx = p + (q - p) * ky
          p = slopeY[b0 + a0] + (slopeY[b0 + a1] - slopeY[b0 + a0]) * kx
          q = slopeY[b1 + a0] + (slopeY[b1 + a1] - slopeY[b1 + a0]) * kx
          sy = p + (q - p) * ky
        }
        {
          const ax = (wy + ORIGIN) * rippleInv + rippleOffX
          const ay = (ORIGIN - wx) * rippleInv + rippleOffY
          const jx = ax | 0
          const jy = ay | 0
          const kx = ax - jx
          const ky = ay - jy
          const a0 = jx & waveMask
          const a1 = (jx + 1) & waveMask
          const b0 = (jy & waveMask) * waveSize
          const b1 = ((jy + 1) & waveMask) * waveSize
          let p = slopeX[b0 + a0] + (slopeX[b0 + a1] - slopeX[b0 + a0]) * kx
          let q = slopeX[b1 + a0] + (slopeX[b1 + a1] - slopeX[b1 + a0]) * kx
          const along = p + (q - p) * ky
          p = slopeY[b0 + a0] + (slopeY[b0 + a1] - slopeY[b0 + a0]) * kx
          q = slopeY[b1 + a0] + (slopeY[b1 + a1] - slopeY[b1 + a0]) * kx
          const across = p + (q - p) * ky
          sx -= across * rippleGain
          sy += along * rippleGain
        }
        sx *= amplitude
        sy *= amplitude

        const invNormal = 1 / Math.sqrt(sx * sx + sy * sy + 1)
        const nx = -sx * invNormal
        const ny = -sy * invNormal
        const nz = invNormal
        const invView = 1 / Math.sqrt(lengthSq[c] + vv)
        const dx = (fX + rX * u) * invView
        const dy = (fY + rY * u) * invView
        const dz = v * invView
        let cosine = -(dx * nx + dy * ny + dz * nz)
        if (cosine < 0.02) cosine = 0.02
        const rx = dx + 2 * cosine * nx
        const ry = dy + 2 * cosine * ny
        let rz = dz + 2 * cosine * nz
        if (rz < 0.015) rz = 0.015

        const grazing = 1 - cosine
        const g2 = grazing * grazing
        const fresnel = reflectance + (1 - reflectance) * g2 * g2 * grazing

        let k = rz * 1.6
        if (k > 1) k = 1
        k = 1 - (1 - k) * (1 - k)
        let skyR = horR + (zenR - horR) * k
        let skyG = horG + (zenG - horG) * k
        let skyB = horB + (zenB - horB) * k
        let haze = 1 - rz * 7
        if (haze > 0) {
          haze *= haze
          skyR += (fogR[c] - skyR) * haze
          skyG += (fogG[c] - skyG) * haze
          skyB += (fogB[c] - skyB) * haze
        }

        if (cloudMix > 0) {
          const travel = cloudSpan / rz
          const hx = rx * travel
          const hy = ry * travel
          const span = hx * hx + hy * hy
          if (span < cloudFar * cloudFar) {
            const cx = (((wx + hx + clouds.origin) * cloudInv + cloudOffX) | 0) & cloudMask
            const cy = (((wy + hy + clouds.origin) * cloudInv + cloudOffY) | 0) & cloudMask
            const value = cloudCoverage[(cy << cloudBits) | cx]
            let alpha = (value - cloudThreshold) * cloudInvSoft
            if (alpha > 0) {
              if (alpha > 1) alpha = 1
              alpha = alpha * alpha * (3 - 2 * alpha) * (1 - span * invCloudFarSq) * cloudMix
              let density = (value - cloudThreshold) * 2.4
              if (density > 1) density = 1
              const shade = density * 0.55
              skyR += (litR + (shadeR - litR) * shade - skyR) * alpha
              skyG += (litG + (shadeG - litG) * shade - skyG) * alpha
              skyB += (litB + (shadeB - litB) * shade - skyB) * alpha
            }
          }
        }

        const light = lightOn ? shader.sunlight(wx, wy, sea) : 0
        const illumR = ambR + sunR * light
        const illumG = ambG + sunG * light
        const illumB = ambB + sunB * light
        const murk = depth / (depth + depthScale)
        let r = (shallowR + (deepR - shallowR) * murk) * illumR
        let g = (shallowG + (deepG - shallowG) * murk) * illumG
        let b = (shallowB + (deepB - shallowB) * murk) * illumB

        if (depth < foamDepth) {
          let edge = 1 - depth * invFoamDepth
          edge *= edge
          const foam = edge * foamStrength * (0.6 + 0.4 * Math.sin(foamClock - depth * foamRipple + (sx - sy) * 6))
          r += (foamR * illumR - r) * foam
          g += (foamG * illumG - g) * foam
          b += (foamB * illumB - b) * foam
        }

        r += (skyR - r) * fresnel
        g += (skyG - g) * fresnel
        b += (skyB - b) * fresnel

        if (light > 0) {
          const facing = rx * lightX + ry * lightY + rz * lightZ
          if (facing > 0.8) {
            let p = facing * facing
            p *= p
            p *= p
            p *= p
            let q = p * p
            q *= q
            q *= q
            q *= q
            const spark = (q + p * sheen) * light
            r += glintR * spark
            g += glintG * spark
            b += glintB * spark
          }
        }

        pixels[o] = pack(r + (fogR[c] - r) * fog, g + (fogG[c] - g) * fog, b + (fogB[c] - b) * fog)
      }
    }
  }

  #prepareColumns(width, yaw, invFocal) {
    if (this.#lateral.length < width) {
      this.#lateral = new Float32Array(width)
      this.#lengthSq = new Float32Array(width)
      this.#length = new Float32Array(width)
      this.#fogR = new Float32Array(width)
      this.#fogG = new Float32Array(width)
      this.#fogB = new Float32Array(width)
      this.#far = new Uint32Array(width)
    }
    const fX = Math.cos(yaw)
    const fY = Math.sin(yaw)
    const tint = this.#tint
    const center = width * 0.5
    for (let c = 0; c < width; c++) {
      const u = (c + 0.5 - center) * invFocal
      const lengthSq = 1 + u * u
      const length = Math.sqrt(lengthSq)
      this.#lateral[c] = u
      this.#lengthSq[c] = lengthSq
      this.#length[c] = length
      this.#shader.fogTint((fX - fY * u) / length, (fY + fX * u) / length, tint)
      this.#fogR[c] = tint[0]
      this.#fogG[c] = tint[1]
      this.#fogB[c] = tint[2]
      this.#far[c] = pack(tint[0], tint[1], tint[2])
    }
  }

  #prepareFog(sea) {
    const step = this.#radius / FOG_STEPS
    for (let i = 0; i <= FOG_STEPS; i++) this.#fogLut[i] = this.#shader.fogAmount(i * step, sea)
  }
}
