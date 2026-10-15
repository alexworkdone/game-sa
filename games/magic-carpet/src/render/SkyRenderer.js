const pack = (r, g, b) =>
  0xff000000 | ((b > 255 ? 255 : b < 0 ? 0 : b) << 16) | ((g > 255 ? 255 : g < 0 ? 0 : g) << 8) | (r > 255 ? 255 : r < 0 ? 0 : r)

export class SkyRenderer {
  #atmosphere
  #clouds

  constructor({ atmosphere, clouds }) {
    this.#atmosphere = atmosphere
    this.#clouds = clouds
  }

  render(target, camera, view) {
    const atmosphere = this.#atmosphere
    const clouds = this.#clouds
    const width = view.width
    const height = view.height
    const focal = view.focal
    const invFocal = 1 / focal
    const stride = target.stride
    const pixels = target.pixels
    const clearSky = target.clearSky

    const coverage = clouds.coverage
    const cloudMask = clouds.mask
    const cloudBits = clouds.bits
    const cloudInv = clouds.inverseTexel
    const cloudOffX = clouds.offsetX
    const cloudOffY = clouds.offsetY
    const cloudFar = clouds.far
    const invCloudFar = 1 / cloudFar
    const cloudThreshold = clouds.threshold
    const cloudInvSoft = 1 / clouds.softness
    const cloudOpacity = clouds.opacity

    const camX = camera.x + clouds.origin
    const camY = camera.y + clouds.origin
    const cloudSpan = clouds.altitude - camera.z
    const skyClouds = cloudSpan > 1
    const fX = Math.cos(camera.yaw)
    const fY = Math.sin(camera.yaw)
    const rX = -fY
    const rY = fX
    const cx = width * 0.5
    const horizon = height * 0.5 + Math.tan(camera.pitch) * focal
    const rows = Math.min(height, Math.max(0, Math.ceil(horizon - 0.5)))

    const zenR = atmosphere.zenithR
    const zenG = atmosphere.zenithG
    const zenB = atmosphere.zenithB
    const horR = atmosphere.horizonR
    const horG = atmosphere.horizonG
    const horB = atmosphere.horizonB
    const sunX = atmosphere.sunX
    const sunY = atmosphere.sunY
    const sunZ = atmosphere.sunZ
    const sunHorizontal = Math.hypot(sunX, sunY) || 1
    const sunHX = sunX / sunHorizontal
    const sunHY = sunY / sunHorizontal
    const sunVisible = atmosphere.sunVisible
    const moonX = atmosphere.moonX
    const moonY = atmosphere.moonY
    const moonZ = atmosphere.moonZ
    const moonVisible = atmosphere.moonVisible
    const moonR = atmosphere.moonDiscR
    const moonG = atmosphere.moonDiscG
    const moonB = atmosphere.moonDiscB
    const scatR = atmosphere.scatterR
    const scatG = atmosphere.scatterG
    const scatB = atmosphere.scatterB
    const glow = atmosphere.glow * sunVisible
    const scatterStrength = 0.35 + atmosphere.glow * 0.45
    const cloudLitR = atmosphere.cloudLitR
    const cloudLitG = atmosphere.cloudLitG
    const cloudLitB = atmosphere.cloudLitB
    const cloudShadeR = atmosphere.cloudShadeR
    const cloudShadeG = atmosphere.cloudShadeG
    const cloudShadeB = atmosphere.cloudShadeB
    const sunGlowA = glow * 0.22
    const sunGlowB = glow * 0.7
    const sunDisc = 0.99925
    const moonDisc = 0.99955

    for (let column = 0; column < width; column++) {
      const u = (column + 0.5 - cx) * invFocal
      const dirX = fX + rX * u
      const dirY = fY + rY * u
      const lengthSq = 1 + u * u
      const invDirLength = 1 / Math.sqrt(lengthSq)

      const sunCos = (dirX * sunHX + dirY * sunHY) * invDirLength
      let scatter = sunCos > 0 ? sunCos * sunCos : 0
      scatter = scatter * scatter * scatterStrength * sunVisible
      const fogR = atmosphere.fogR + (scatR - atmosphere.fogR) * scatter
      const fogG = atmosphere.fogG + (scatG - atmosphere.fogG) * scatter
      const fogB = atmosphere.fogB + (scatB - atmosphere.fogB) * scatter
      const sunA = dirX * sunX + dirY * sunY
      const moonA = dirX * moonX + dirY * moonY

      for (let y = 0, o = column; y < rows; y++, o += stride) {
        const v = (horizon - y - 0.5) * invFocal
        const invLength = 1 / Math.sqrt(lengthSq + v * v)
        const e = v * invLength
        let k = e * 1.6
        if (k > 1) k = 1
        k = 1 - (1 - k) * (1 - k)
        let r = horR + (zenR - horR) * k
        let g = horG + (zenG - horG) * k
        let b = horB + (zenB - horB) * k
        let haze = 1 - e * 7
        if (haze > 0) {
          haze *= haze
          r += (fogR - r) * haze
          g += (fogG - g) * haze
          b += (fogB - b) * haze
        }

        if (glow > 0) {
          const d = (sunA + v * sunZ) * invLength
          if (d > 0.6) {
            let p = d * d
            p *= p
            p *= p
            let q = p * p
            q *= q
            q *= q
            const halo = p * sunGlowA + q * sunGlowB
            r += scatR * halo
            g += scatG * halo
            b += scatB * halo
            if (d > sunDisc) {
              const core = (d - sunDisc) * 8000
              const t = (core > 1 ? 1 : core) * sunVisible
              r += 280 * t
              g += 270 * t
              b += 240 * t
            }
          }
        }

        if (moonVisible > 0) {
          const d = (moonA + v * moonZ) * invLength
          if (d > 0.995) {
            if (d > moonDisc) {
              r += (moonR - r) * moonVisible
              g += (moonG - g) * moonVisible
              b += (moonB - b) * moonVisible
            } else {
              const halo = (d - 0.995) * 120 * moonVisible
              r += 90 * halo
              g += 100 * halo
              b += 130 * halo
            }
          }
        }

        let veil = 0
        if (skyClouds && v > 0.008) {
          const reach = cloudSpan / v
          if (reach < cloudFar) {
            const ux = (camX + dirX * reach) * cloudInv + cloudOffX
            const uy = (camY + dirY * reach) * cloudInv + cloudOffY
            const ix = ux | 0
            const iy = uy | 0
            const tx = ux - ix
            const ty = uy - iy
            const cx0 = ix & cloudMask
            const cx1 = (ix + 1) & cloudMask
            const cy0 = (iy & cloudMask) << cloudBits
            const cy1 = ((iy + 1) & cloudMask) << cloudBits
            const top0 = coverage[cy0 + cx0] + (coverage[cy0 + cx1] - coverage[cy0 + cx0]) * tx
            const top1 = coverage[cy1 + cx0] + (coverage[cy1 + cx1] - coverage[cy1 + cx0]) * tx
            const value = top0 + (top1 - top0) * ty
            let alpha = (value - cloudThreshold) * cloudInvSoft
            if (alpha > 0) {
              if (alpha > 1) alpha = 1
              alpha = alpha * alpha * (3 - 2 * alpha)
              const distance = reach * invCloudFar
              alpha *= (1 - distance * distance) * cloudOpacity
              let density = (value - cloudThreshold) * 2.4
              if (density > 1) density = 1
              const shade = density * 0.55
              let cr = cloudLitR + (cloudShadeR - cloudLitR) * shade
              let cg = cloudLitG + (cloudShadeG - cloudLitG) * shade
              let cb = cloudLitB + (cloudShadeB - cloudLitB) * shade
              const far = distance * 0.75
              cr += (fogR - cr) * far
              cg += (fogG - cg) * far
              cb += (fogB - cb) * far
              if (glow > 0) {
                const d = (sunA + v * sunZ) * invLength
                if (d > 0.7) {
                  let p = d * d
                  p *= p
                  p *= p
                  const silver = p * glow * (1 - density) * 0.9
                  cr += scatR * silver
                  cg += scatG * silver
                  cb += scatB * silver
                }
              }
              r += (cr - r) * alpha
              g += (cg - g) * alpha
              b += (cb - b) * alpha
              veil = alpha
            }
          }
        }

        pixels[o] = pack(r, g, b)
        clearSky[o] = (1 - veil) * 255
      }
    }
  }
}
