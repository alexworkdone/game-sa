import { SeededRandom } from '../core/SeededRandom.js'
import { CastleBuilder } from './CastleBuilder.js'
import { PeriodicNoise } from './PeriodicNoise.js'
import { ReliefShaper } from './ReliefShaper.js'

export class WorldGenerator {
  #config

  constructor(config) {
    this.#config = config
  }

  generate(seed, onProgress = () => {}) {
    const { size, seaLevel, castles: castleConfig } = this.#config
    const noise = new PeriodicNoise(seed)
    const random = new SeededRandom(seed ^ 0x2545f491)

    const relief = new ReliefShaper(noise, size, seaLevel).shape((p) => onProgress(p * 1.4))
    const world = { size, height: relief.height, forest: relief.forest }

    const builder = new CastleBuilder(castleConfig, random)
    const castles = builder
      .findSites(world.height, size, seaLevel)
      .map((site, index) => builder.build(world, site, index))

    const home = castles[0] ?? { x: size / 2, y: size / 2, plaza: 40, plateau: seaLevel + 10 }
    const spawn = {
      x: home.x,
      y: (home.y + home.plaza + 60) % size,
      z: home.plateau + 42,
      yaw: -Math.PI / 2,
    }

    onProgress(1)
    return {
      size,
      seaLevel,
      height: relief.height,
      forest: relief.forest,
      desert: relief.desert,
      wetness: relief.wetness,
      castles,
      spawn,
    }
  }
}

export const transferablesOf = (data) => [
  data.height.buffer,
  data.forest.buffer,
  data.desert.buffer,
  data.wetness.buffer,
]
