import { BALANCE } from '../../config/balance.js'
import { ringDelta } from '../../level/Ring.js'
import type { TileMap } from '../../level/TileMap.js'
import type { HazardHost, IHazard } from './IHazard.js'

export interface Floe {
  x: number
  readonly width: number
  readonly vx: number
}

export class IceHazard implements IHazard {
  readonly icy = new Set<number>()
  readonly floes: Floe[] = []
  private readonly map: TileMap

  constructor(host: HazardHost) {
    const map = host.map
    const random = host.random
    this.map = map
    for (const row of host.tierRows.slice(1)) {
      for (const run of this.runs(map, row)) {
        if (!random.bool(BALANCE.ice.plankShare)) continue
        for (const c of run) this.icy.add(map.index(c, row))
      }
    }
    const ice = BALANCE.ice
    for (let i = 0; i < ice.floes; i++) {
      this.floes.push({
        x: random.float(0, map.width),
        width: random.float(ice.floeMin, ice.floeMax),
        vx: random.float(-ice.floeDrift, ice.floeDrift),
      })
    }
    const grip = (): boolean => host.powerUps.active('crampons')
    host.hero.terrain = {
      iceAt: (c, r) => !grip() && this.icy.has(map.index(c, r)),
      floeAt: (x) => this.floeAt(x, host.water.level),
      floeBlocks: (x) => !grip() && this.floeAt(x, host.water.level),
    }
  }

  isIcy(c: number, r: number): boolean {
    return this.icy.has(this.map.index(c, r))
  }

  floeAt(x: number, level: number): boolean {
    if (level >= this.map.height - 2) return false
    return this.floes.some((floe) => Math.abs(ringDelta(floe.x, x, this.map.width)) <= floe.width / 2)
  }

  update(dt: number): void {
    for (const floe of this.floes) floe.x = this.map.wrapX(floe.x + floe.vx * dt)
  }

  private runs(map: TileMap, row: number): number[][] {
    const runs: number[][] = []
    const solid = (c: number): boolean => map.isSolid(c, row)
    const start = Array.from({ length: map.cols }, (_, c) => c).find((c) => solid(c) && !solid(c - 1))
    if (start === undefined) return solid(0) ? [Array.from({ length: map.cols }, (_, c) => c)] : []
    let current: number[] = []
    for (let i = 0; i < map.cols; i++) {
      const c = map.wrapCol(start + i)
      if (solid(c)) {
        current.push(c)
        continue
      }
      if (current.length > 0) runs.push(current)
      current = []
    }
    if (current.length > 0) runs.push(current)
    return runs
  }
}
