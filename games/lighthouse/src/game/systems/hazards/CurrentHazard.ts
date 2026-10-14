import { BALANCE } from '../../config/balance.js'
import { ringDelta } from '../../level/Ring.js'
import type { HazardHost, IHazard } from './IHazard.js'

export interface KelpPatch {
  readonly x: number
  readonly width: number
  readonly top: number
  readonly bottom: number
}

export class CurrentHazard implements IHazard {
  readonly kelp: KelpPatch[] = []
  private readonly flip: number
  private readonly tierTops: readonly number[]

  constructor(host: HazardHost) {
    const map = host.map
    const random = host.random
    const config = BALANCE.currents
    this.flip = random.bool(0.5) ? 1 : -1
    this.tierTops = host.tierRows.map((row) => row * map.tile)
    const floors = host.tierRows.slice(0, 3)
    for (let i = 0; i < config.kelpPatches; i++) {
      const row = random.pick(floors)
      const bottom = row * map.tile
      this.kelp.push({
        x: random.float(0, map.width),
        width: config.kelpWidth * map.tile,
        top: bottom - map.tile * 2.4,
        bottom,
      })
    }
  }

  flowAt(y: number): number {
    const band = this.tierTops.findIndex((top) => y > top - 2)
    const index = band < 0 ? this.tierTops.length : band
    return (index % 2 === 0 ? 1 : -1) * this.flip * BALANCE.currents.speed
  }

  inKelp(x: number, y: number, width: number): boolean {
    return this.kelp.some((patch) => y > patch.top && y - 10 < patch.bottom && Math.abs(ringDelta(patch.x, x, width)) < patch.width / 2)
  }

  update(_dt: number, host: HazardHost): void {
    const hero = host.hero
    if (!hero.alive || !hero.inWater || host.powerUps.active('fins')) return
    hero.flow = this.flowAt(hero.y)
    if (this.inKelp(hero.x, hero.y, host.map.width)) hero.swimDrag = BALANCE.currents.kelpDrag
  }
}
