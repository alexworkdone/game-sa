import { clamp, packRgb, wrapDelta } from '../core/math.js'

const tone = (color, gain) =>
  packRgb(
    clamp(Math.round(color[0] * gain), 0, 255),
    clamp(Math.round(color[1] * gain), 0, 255),
    clamp(Math.round(color[2] * gain), 0, 255),
  )

export class FacePalette {
  #terrain
  #palette
  #snowLine

  constructor(terrain, palette, snowLine) {
    this.#terrain = terrain
    this.#palette = palette
    this.#snowLine = snowLine
  }

  land(x, y, h, nz, variation) {
    const palette = this.#palette
    const terrain = this.#terrain
    const index = terrain.index(x, y)
    const sea = terrain.seaLevel
    const snow = this.#snowLine
    const gain = 0.96 + variation * 0.08
    const alternate = variation > 0.5

    const plaza = this.#plazaReach(x, y)
    if (plaza < -9) return tone(alternate ? palette.plaza : palette.plazaShade, gain)
    if (plaza <= 0) return tone(palette.plazaBorder, gain)
    if (nz < 0.7) return tone(h > snow - 8 ? palette.rockLight : alternate ? palette.rock : palette.rockShade, gain)
    if (h > snow && nz > 0.78) return tone(palette.snow, 1)
    if (h > snow - 8) return tone(palette.rockLight, gain)
    if (h < sea + 1.8) return tone(palette.beach, gain)
    if (terrain.desert[index] > 128) return tone(alternate ? palette.sand : palette.sandShade, gain)
    if (terrain.forest[index] > 110) return tone(palette.forestFloor, gain)
    if (h > snow - 34) return tone(palette.alpine, gain)
    if (nz < 0.8) return tone(alternate ? palette.rock : palette.alpine, gain)
    const lush = terrain.wetness[index] > 128
    if (lush) return tone(alternate ? palette.grassLush : palette.grassLushShade, gain)
    return tone(alternate ? palette.grassDry : palette.grassDryShade, gain)
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
