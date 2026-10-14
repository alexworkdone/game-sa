import type { BuildingId } from '../content/buildings.js'
import type { TownSnapshot } from '../meta/City.js'

export interface TownPaintOptions {
  readonly drawing?: string | null
  readonly interactive?: boolean
  readonly still?: boolean
  readonly penClass?: string
}

export interface ITownPainter {
  town(snapshot: TownSnapshot, options?: TownPaintOptions): string
  building(id: BuildingId, level: number, drawing?: boolean): string
}
