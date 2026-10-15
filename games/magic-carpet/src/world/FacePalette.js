import { clamp, packRgb, wrapDelta } from '../core/math.js'

const tone = (color, gain) =>
  packRgb(
    clamp(Math.round(color[0] * gain), 0, 255),
    clamp(Math.round(color[1] * gain), 0, 255),
    clamp(Math.round(color[2] * gain), 0, 255),
  )

const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]

export class FacePalette {
  #terrain
  #palette
  #snowLine
  #pattern

  constructor(terrain, palette, snowLine, pattern) {
    this.#terrain = terrain
    this.#palette = palette
    this.#snowLine = snowLine
    this.#pattern = pattern
  }

  land(x, y, h, nz, variation) {
    const palette = this.#palette
    const alternate = variation > 0.5
    const plaza = this.#plazaReach(x, y)
    if (plaza < -9) return tone(alternate ? palette.plaza : palette.plazaShade, 0.96 + variation * 0.08)
    if (plaza <= 0) return tone(palette.plazaBorder, 0.96 + variation * 0.08)

    const relief = this.#pattern.relief(x, y, h)
    const gain = clamp(1 + relief * 0.011, 0.86, 1.12) * (0.96 + variation * 0.08)
    return tone(this.#surface(x, y, h, nz, variation), gain)
  }

  #surface(x, y, h, nz, variation) {
    const palette = this.#palette
    const terrain = this.#terrain
    const pattern = this.#pattern
    const index = terrain.index(x, y)
    const sea = terrain.seaLevel
    const snow = this.#snowLine
    const alternate = variation > 0.5
    const speck = pattern.speck(x, y)

    if (nz < 0.7) return this.#cliff(h, speck, variation)
    if (h > snow && nz > 0.78) return variation > 0.3 ? palette.snow : palette.snowShade
    if (h > snow - 8) return speck > 0 ? palette.rockLight : palette.scree
    if (h < sea + 0.7) return palette.wetSand
    if (h < sea + 1.8) return palette.beach

    const patch = pattern.patch(x, y)
    if (terrain.desert[index] > 128) {
      if (speck > 0.45) return palette.scrub
      return (Math.floor(h * 0.45 + patch * 3) & 1) === 0 ? palette.sand : palette.sandShade
    }
    const wet = terrain.wetness[index] / 255
    if (wet > 0.68 && h < sea + 9) return alternate ? palette.marsh : palette.marshShade
    if (terrain.forest[index] > 110) return patch > 0.1 ? palette.forestMoss : palette.forestFloor
    if (h > snow - 34) return patch > 0.15 ? (alternate ? palette.heath : palette.heathShade) : alternate ? palette.alpine : palette.rock
    if (nz < 0.8) return speck > 0.2 ? palette.scree : alternate ? palette.rock : palette.alpine
    return this.#meadow(wet, patch, speck, variation)
  }

  #cliff(h, speck, variation) {
    const palette = this.#palette
    if (h > this.#snowLine - 8) return palette.rockLight
    const band = Math.floor((h + speck * 6) / 6) % 3
    if (band === 0) return palette.rockWarm
    return band === 1 ? palette.rock : variation > 0.5 ? palette.rockShade : palette.rock
  }

  #meadow(wet, patch, speck, variation) {
    const palette = this.#palette
    const alternate = variation > 0.5
    const dryness = (1 - wet) * 0.75 + patch * 1.25 + (variation - 0.5) * 0.14
    if (speck < -0.42 && dryness > 0.5) return alternate ? palette.dirt : palette.dirtShade
    let grass
    if (dryness < 0.25) grass = alternate ? palette.meadowDeep : palette.meadowDeepShade
    else if (dryness < 0.55) grass = alternate ? palette.grassLush : palette.grassLushShade
    else if (dryness < 0.85) grass = alternate ? palette.grassDry : palette.grassDryShade
    else grass = alternate ? palette.grassGold : palette.grassGoldShade
    if (speck > 0.36 && wet > 0.3) return mix(grass, palette.bloom[Math.floor(variation * palette.bloom.length)], 0.3)
    return grass
  }

  #plazaReach(x, y) {
    const terrain = this.#terrain
    let nearest = Infinity
    for (const castle of terrain.castles) {
      const distance = Math.hypot(wrapDelta(x - castle.x, terrain.size), wrapDelta(y - castle.y, terrain.size)) - castle.plaza
      if (distance < nearest) nearest = distance
    }
    return nearest
  }
}
