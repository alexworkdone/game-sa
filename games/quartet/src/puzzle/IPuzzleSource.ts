import type { Puzzle } from './Puzzle.js'

export interface IPuzzleSource<TKey> {
  get(key: TKey): Puzzle
}
