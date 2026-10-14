const HEX = Array.from({ length: 256 }, (_, i) => i.toString(16).padStart(2, '0'))
const widen = (level) => (level << 2) | (level >> 4)

export class ColorCache {
  #styles = new Array(1 << 18)

  style(color) {
    const r = (color & 255) >> 2
    const g = ((color >> 8) & 255) >> 2
    const b = ((color >> 16) & 255) >> 2
    const key = (r << 12) | (g << 6) | b
    return (this.#styles[key] ??= `#${HEX[widen(r)]}${HEX[widen(g)]}${HEX[widen(b)]}`)
  }
}
