import { Signal } from '@sa/core'
import type { IStorage } from '@sa/core'

export interface StatsState {
  readonly played: number
  readonly won: number
  readonly perfect: number
  readonly bestScore: number
  readonly totalScore: number
  readonly winStreak: number
  readonly bestWinStreak: number
  readonly hintsUsed: number
  readonly fastestMs: number | null
}

const KEY = 'v1.stats'

const EMPTY: StatsState = {
  played: 0,
  won: 0,
  perfect: 0,
  bestScore: 0,
  totalScore: 0,
  winStreak: 0,
  bestWinStreak: 0,
  hintsUsed: 0,
  fastestMs: null,
}

export interface GameRecord {
  readonly won: boolean
  readonly perfect: boolean
  readonly score: number
  readonly hintsUsed: number
  readonly elapsedMs: number
}

export class Stats {
  readonly onChange = new Signal<void>()

  private readonly storage: IStorage
  private state: StatsState

  constructor(storage: IStorage) {
    this.storage = storage
    this.state = { ...EMPTY, ...storage.get<Partial<StatsState>>(KEY, {}) }
  }

  get snapshot(): StatsState {
    return this.state
  }

  get winRate(): number {
    return this.state.played === 0 ? 0 : this.state.won / this.state.played
  }

  record(game: GameRecord): void {
    const winStreak = game.won ? this.state.winStreak + 1 : 0
    const fastest =
      game.won && (this.state.fastestMs === null || game.elapsedMs < this.state.fastestMs)
        ? game.elapsedMs
        : this.state.fastestMs
    this.state = {
      played: this.state.played + 1,
      won: this.state.won + (game.won ? 1 : 0),
      perfect: this.state.perfect + (game.perfect ? 1 : 0),
      bestScore: Math.max(this.state.bestScore, game.score),
      totalScore: this.state.totalScore + game.score,
      winStreak,
      bestWinStreak: Math.max(this.state.bestWinStreak, winStreak),
      hintsUsed: this.state.hintsUsed + game.hintsUsed,
      fastestMs: fastest,
    }
    this.storage.set(KEY, this.state)
    this.onChange.emit()
  }
}
