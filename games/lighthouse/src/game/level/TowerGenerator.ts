import type { IRandom } from '@sa/core'
import { LAYOUT } from '../config/layout.js'
import { BALANCE, enemiesForFloor, keysForFloor } from '../config/balance.js'
import type { ILevelGenerator } from './ILevelGenerator.js'
import type {
  EnemyKind,
  EnemySpawn,
  LevelBlueprint,
  PowerUpSpawn,
} from './LevelBlueprint.js'
import { NavGrid } from './NavGrid.js'
import { POWER_UP_WEIGHTS } from '../config/powerups.js'
import { ringDistance, wrap } from './Ring.js'
import { TILE_EMPTY, TILE_LADDER, TILE_SOLID, TileMap } from './TileMap.js'
import type { Cell } from './TileMap.js'

interface Segment {
  readonly start: number
  readonly length: number
}

interface Tier {
  readonly row: number
  readonly segments: readonly Segment[]
}

const TIER_ROWS = [14, 11, 8, 5, 2] as const
const MAX_ATTEMPTS = 24
const MIN_SEGMENT = 4
const LADDER_SPACING = 3
const EXTRA_LADDER_CHANCE = 0.3

const MIDDLE_GAPS: readonly { value: number; weight: number }[] = [
  { value: 1, weight: 30 },
  { value: 2, weight: 45 },
  { value: 3, weight: 25 },
]

const GALLERY_GAPS: readonly { value: number; weight: number }[] = [
  { value: 0, weight: 50 },
  { value: 1, weight: 50 },
]


const ENEMY_WEIGHTS: Readonly<Record<EnemyKind, number>> = {
  crab: 5,
  jelly: 3,
  octopus: 2,
  urchin: 2,
  guardian: 0,
}

export class TowerGenerator implements ILevelGenerator {
  generate(floor: number, random: IRandom): LevelBlueprint {
    let fallback: LevelBlueprint | null = null
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      const blueprint = this.attempt(floor, random.fork(`floor-${floor}-${attempt}`))
      fallback ??= blueprint
      if (this.isSolvable(blueprint)) return blueprint
    }
    return fallback as LevelBlueprint
  }

  private attempt(floor: number, random: IRandom): LevelBlueprint {
    const map = new TileMap(LAYOUT.cols, LAYOUT.rows, LAYOUT.tile)
    const top = TIER_ROWS.length - 1
    for (let c = 0; c < map.cols; c++) map.set(c, 0, TILE_SOLID)

    const tiers: Segment[][] = []
    for (let t = 0; t <= top; t++) {
      const gaps = t === 0 ? 0 : random.weighted(t === top ? GALLERY_GAPS : MIDDLE_GAPS)
      const segments = this.carveRing(map.cols, gaps, random)
      for (const segment of segments) {
        for (const c of this.columns(segment, map.cols)) map.set(c, TIER_ROWS[t] as number, TILE_SOLID)
      }
      tiers.push(segments)
    }
    for (let t = 0; t < top; t++) {
      this.connect(
        map,
        { row: TIER_ROWS[t] as number, segments: tiers[t] as Segment[] },
        { row: TIER_ROWS[t + 1] as number, segments: tiers[t + 1] as Segment[] },
        random,
      )
    }

    const used = new Set<number>()
    const heroSpawn = this.pickHeroSpawn(map, random)
    this.reserveAround(map, used, heroSpawn, 2)

    const exit = this.pickExit(map, random)
    this.reserveAround(map, used, exit, 1)

    const keys = this.placeKeys(map, used, keysForFloor(floor), random)
    const pearls = this.pickCells(
      map,
      used,
      random.int(BALANCE.floor.loosePearlsMin, BALANCE.floor.loosePearlsMax + 1),
      random,
      () => true,
    )
    const powerUps = this.placePowerUps(map, used, floor, random)
    const enemies = this.placeEnemies(map, used, heroSpawn, floor, random)

    return {
      floor,
      map,
      tierRows: TIER_ROWS,
      heroSpawn,
      exit,
      keys,
      pearls,
      powerUps,
      enemies,
    }
  }

  private carveRing(cols: number, gaps: number, random: IRandom): Segment[] {
    if (gaps === 0) return [{ start: 0, length: cols }]
    const widths = Array.from({ length: gaps }, () => random.int(2, 4))
    const span = cols - widths.reduce((sum, width) => sum + width, 0)
    const weights = Array.from({ length: gaps }, () => random.float(0.3, 1))
    const total = weights.reduce((sum, weight) => sum + weight, 0)
    const free = span - gaps * MIN_SEGMENT
    const lengths = weights.map((weight) => MIN_SEGMENT + Math.floor((free * weight) / total))
    const assigned = lengths.reduce((sum, length) => sum + length, 0)
    lengths[gaps - 1] = (lengths[gaps - 1] as number) + span - assigned
    const segments: Segment[] = []
    let cursor = random.int(0, cols)
    for (let i = 0; i < gaps; i++) {
      segments.push({ start: wrap(cursor, cols), length: lengths[i] as number })
      cursor += (lengths[i] as number) + (widths[i] as number)
    }
    return segments
  }

  private columns(segment: Segment, cols: number): number[] {
    return Array.from({ length: segment.length }, (_, i) => wrap(segment.start + i, cols))
  }

  private segmentOf(segments: readonly Segment[], c: number, cols: number): number {
    return segments.findIndex((segment) => wrap(c - segment.start, cols) < segment.length)
  }

  private connect(map: TileMap, lower: Tier, upper: Tier, random: IRandom): void {
    const cols = map.cols
    const { row: lowRow, segments: low } = lower
    const { row: upRow, segments: up } = upper
    const placed: number[] = []
    const coveredLow = new Set<number>()
    const coveredUp = new Set<number>()
    const order = random.shuffle(Array.from({ length: cols }, (_, c) => c))

    const canPlace = (c: number, strict: boolean): boolean => {
      if (!map.isSolid(c, lowRow) || !map.isSolid(c, upRow) || map.isLadder(c, upRow - 1)) return false
      for (let r = upRow + 1; r < lowRow; r++) if (map.get(c, r) !== TILE_EMPTY) return false
      if (placed.some((other) => ringDistance(other, c, cols) < LADDER_SPACING)) return false
      return !strict || !(map.isLadder(c - 1, lowRow) || map.isLadder(c + 1, lowRow))
    }
    const place = (c: number): void => {
      for (let r = upRow; r < lowRow; r++) map.set(c, r, TILE_LADDER)
      placed.push(c)
      coveredLow.add(this.segmentOf(low, c, cols))
      coveredUp.add(this.segmentOf(up, c, cols))
    }
    const sweep = (wanted: (c: number) => boolean): void => {
      for (const strict of [true, false]) {
        for (const c of order) if (wanted(c) && canPlace(c, strict)) place(c)
      }
    }

    sweep((c) => !coveredLow.has(this.segmentOf(low, c, cols)) && !coveredUp.has(this.segmentOf(up, c, cols)))
    sweep((c) => !coveredLow.has(this.segmentOf(low, c, cols)))
    sweep((c) => !coveredUp.has(this.segmentOf(up, c, cols)))
    if (random.bool(EXTRA_LADDER_CHANCE)) {
      const extra = order.find((c) => canPlace(c, true))
      if (extra !== undefined) place(extra)
    }
  }

  private standableCells(map: TileMap, accept: (cell: Cell) => boolean): Cell[] {
    const cells: Cell[] = []
    for (const tierRow of TIER_ROWS) {
      const r = tierRow - 1
      for (let c = 0; c < map.cols; c++) {
        if (!map.canStand(c, r) || map.isLadder(c, r)) continue
        const cell = { c, r }
        if (accept(cell)) cells.push(cell)
      }
    }
    return cells
  }

  private reserveAround(map: TileMap, used: Set<number>, cell: Cell, radius: number): void {
    for (let dc = -radius; dc <= radius; dc++) used.add(map.index(cell.c + dc, cell.r))
  }

  private pickHeroSpawn(map: TileMap, random: IRandom): Cell {
    const row = TIER_ROWS[0] - 1
    const options: number[] = []
    for (let c = 0; c < map.cols; c++) if (!map.isLadder(c, row)) options.push(c)
    return { c: random.pick(options), r: row }
  }

  private pickExit(map: TileMap, random: IRandom): Cell {
    const row = (TIER_ROWS[TIER_ROWS.length - 1] as number) - 1
    const options: number[] = []
    for (let c = 0; c < map.cols; c++) {
      if (map.canStand(c, row) && !map.isLadder(c, row) && !map.isLadder(c, row + 1)) options.push(c)
    }
    return { c: options.length > 0 ? random.pick(options) : 0, r: row }
  }

  private pickCells(
    map: TileMap,
    used: Set<number>,
    count: number,
    random: IRandom,
    accept: (cell: Cell) => boolean,
  ): Cell[] {
    const pool = random.shuffle(
      this.standableCells(map, (cell) => !used.has(map.index(cell.c, cell.r)) && accept(cell)),
    )
    const picked = pool.slice(0, count)
    for (const cell of picked) used.add(map.index(cell.c, cell.r))
    return picked
  }

  private placeKeys(map: TileMap, used: Set<number>, count: number, random: IRandom): Cell[] {
    const keys: Cell[] = []
    const tiers = random.shuffle([...TIER_ROWS])
    for (const tierRow of tiers) {
      if (keys.length >= count) break
      keys.push(...this.pickCells(map, used, 1, random, (cell) => cell.r === tierRow - 1))
    }
    keys.push(...this.pickCells(map, used, count - keys.length, random, (cell) => cell.r < TIER_ROWS[0] - 1))
    return keys
  }

  private placePowerUps(map: TileMap, used: Set<number>, floor: number, random: IRandom): PowerUpSpawn[] {
    const count = floor >= BALANCE.pickups.secondPowerUpFloor ? 2 : 1
    return this.pickCells(map, used, count, random, (cell) => cell.r <= (TIER_ROWS[2] as number) - 1).map(
      (cell) => ({ ...cell, kind: random.weighted(POWER_UP_WEIGHTS) }),
    )
  }

  private placeEnemies(
    map: TileMap,
    used: Set<number>,
    heroSpawn: Cell,
    floor: number,
    random: IRandom,
  ): EnemySpawn[] {
    const kinds = (Object.keys(ENEMY_WEIGHTS) as EnemyKind[])
      .filter((kind) => ENEMY_WEIGHTS[kind] > 0 && BALANCE.enemies[kind].fromFloor <= floor)
      .map((kind) => ({ value: kind, weight: ENEMY_WEIGHTS[kind] }))
    const safe = BALANCE.floor.safeRadiusCells
    const cells = this.pickCells(
      map,
      used,
      enemiesForFloor(floor),
      random,
      (cell) => cell.r !== heroSpawn.r || ringDistance(cell.c, heroSpawn.c, map.cols) > safe,
    )
    return cells.map((cell) => ({ ...cell, kind: random.weighted(kinds) }))
  }

  private isSolvable(blueprint: LevelBlueprint): boolean {
    const nav = new NavGrid(blueprint.map)
    const reach = nav.reachableFrom(blueprint.heroSpawn)
    const ok = (cell: Cell): boolean => reach[nav.indexOf(cell)] === 1
    if (!ok(blueprint.exit)) return false
    if (!blueprint.keys.every(ok)) return false
    if (!blueprint.pearls.every(ok)) return false
    if (!blueprint.powerUps.every(ok)) return false
    return this.alwaysAscends(blueprint, nav)
  }

  private alwaysAscends(blueprint: LevelBlueprint, nav: NavGrid): boolean {
    const map = blueprint.map
    const exit = nav.indexOf(blueprint.exit)
    for (const tierRow of blueprint.tierRows) {
      const r = tierRow - 1
      for (let c = 0; c < map.cols; c++) {
        if (!map.canStand(c, r)) continue
        if (nav.reachableFrom({ c, r }, r)[exit] !== 1) return false
      }
    }
    return true
  }
}
