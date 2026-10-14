import { TAU, lerp, smoothstep, wrapDelta } from '../core/math.js'

export class CastleBuilder {
  #config
  #random

  constructor(config, random) {
    this.#config = config
    this.#random = random
  }

  findSites(height, size, seaLevel) {
    const { count, spacing, minHeightAboveSea, maxHeightAboveSea, maxRoughness } = this.#config
    const mask = size - 1
    const at = (x, y) => height[(Math.round(y) & mask) * size + (Math.round(x) & mask)]
    const sites = []
    for (let attempt = 0; attempt < 6000 && sites.length < count; attempt++) {
      const x = this.#random.int(0, mask)
      const y = this.#random.int(0, mask)
      const h = at(x, y)
      if (h < seaLevel + minHeightAboveSea || h > seaLevel + maxHeightAboveSea) continue
      let lowest = h
      let highest = h
      for (let k = 0; k < 16; k++) {
        const angle = (k / 16) * TAU
        for (const ring of [14, 28, 42, 58]) {
          const sample = at(x + Math.cos(angle) * ring, y + Math.sin(angle) * ring)
          if (sample < lowest) lowest = sample
          if (sample > highest) highest = sample
        }
      }
      if (highest - lowest > maxRoughness || lowest < seaLevel + 1.5) continue
      const crowded = sites.some(
        (site) => Math.hypot(wrapDelta(site.x - x, size), wrapDelta(site.y - y, size)) < spacing,
      )
      if (!crowded) sites.push({ x, y })
    }
    return sites
  }

  build(world, site, index) {
    const { size, height, forest } = world
    const { plazaRadius, flatReach, minLevel, maxLevel } = this.#config
    const mask = size - 1
    const level = this.#random.int(minLevel, maxLevel)

    let plateau = 0
    let samples = 0
    for (let dy = -plazaRadius; dy <= plazaRadius; dy += 4) {
      for (let dx = -plazaRadius; dx <= plazaRadius; dx += 4) {
        if (dx * dx + dy * dy > plazaRadius * plazaRadius) continue
        plateau += height[((site.y + dy) & mask) * size + ((site.x + dx) & mask)]
        samples++
      }
    }
    plateau = plateau / samples + 0.5

    for (let dy = -flatReach; dy <= flatReach; dy++) {
      for (let dx = -flatReach; dx <= flatReach; dx++) {
        const i = ((site.y + dy) & mask) * size + ((site.x + dx) & mask)
        const blend = 1 - smoothstep(plazaRadius + 4, flatReach, Math.hypot(dx, dy))
        height[i] = lerp(height[i], plateau, blend)
        forest[i] = forest[i] * (1 - blend)
      }
    }

    return { x: site.x, y: site.y, plateau, level, plaza: plazaRadius, banner: index }
  }
}
