import type { ModeId } from '../content/modes.js'

export interface BoardTile {
  readonly label: string
  readonly found: boolean
}

export interface TaskStrip {
  readonly items: readonly string[]
  readonly at: number
}

export interface TaskView {
  readonly lead: string
  readonly glyph: string
  readonly tail: string | null
  readonly strip: TaskStrip | null
}

export interface RoundBonus {
  readonly amount: number
  readonly text: string
}

export type TapKind = 'hit' | 'miss' | 'ignore'
export type BoardChange = 'none' | 'tile' | 'board'

export interface TapResult {
  readonly kind: TapKind
  readonly extraBase: number
  readonly bonus: RoundBonus | null
  readonly change: BoardChange
}

export const MISS: TapResult = { kind: 'miss', extraBase: 0, bonus: null, change: 'none' }
export const IGNORE: TapResult = { kind: 'ignore', extraBase: 0, bonus: null, change: 'none' }

export interface IRoundMode {
  readonly id: ModeId
  readonly columns: number
  readonly waveDelayMs: number
  readonly tiles: readonly BoardTile[]
  start(): void
  tap(index: number): TapResult
  advance(): void
  hintIndex(): number
  task(): TaskView
}
