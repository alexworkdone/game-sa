import type { Cell, TileMap } from './TileMap.js'

export type EnemyKind = 'crab' | 'jelly' | 'octopus' | 'urchin' | 'guardian'

export type PowerUpKind =
  | 'heart'
  | 'shield'
  | 'hourglass'
  | 'strider'
  | 'fan'
  | 'hotgun'
  | 'homing'
  | 'blast'
  | 'harpoon'
  | 'twin'
  | 'frost'
  | 'crampons'
  | 'rod'
  | 'fins'
  | 'lantern'

export interface EnemySpawn extends Cell {
  readonly kind: EnemyKind
}

export interface PowerUpSpawn extends Cell {
  readonly kind: PowerUpKind
}

export interface LevelBlueprint {
  readonly floor: number
  readonly map: TileMap
  readonly tierRows: readonly number[]
  readonly heroSpawn: Cell
  readonly exit: Cell
  readonly keys: readonly Cell[]
  readonly pearls: readonly Cell[]
  readonly powerUps: readonly PowerUpSpawn[]
  readonly enemies: readonly EnemySpawn[]
}
