export class Terrain {
  constructor(data) {
    this.size = data.size
    this.mask = data.size - 1
    this.shift = Math.log2(data.size)
    this.seaLevel = data.seaLevel
    this.height = data.height
    this.forest = data.forest
    this.desert = data.desert
    this.wetness = data.wetness
    this.castles = data.castles
    this.spawn = data.spawn
  }

  index(x, y) {
    return ((Math.floor(y) & this.mask) << this.shift) + (Math.floor(x) & this.mask)
  }

  heightAt(x, y) {
    const ix = Math.floor(x)
    const iy = Math.floor(y)
    const fx = x - ix
    const fy = y - iy
    const mask = this.mask
    const shift = this.shift
    const x0 = ix & mask
    const x1 = (ix + 1) & mask
    const y0 = (iy & mask) << shift
    const y1 = ((iy + 1) & mask) << shift
    const h = this.height
    const a = h[y0 + x0] + (h[y0 + x1] - h[y0 + x0]) * fx
    const b = h[y1 + x0] + (h[y1 + x1] - h[y1 + x0]) * fx
    return a + (b - a) * fy
  }
}
