import { Signal } from '@sa/core'
import type { IDisposable } from '@sa/core'
import type { Puzzle, PuzzleGroup } from './Puzzle.js'

export const MAX_MISTAKES = 4
export const GROUP_SIZE = 4

export type GuessVerdict = 'correct' | 'one-away' | 'wrong' | 'repeat'

export interface GuessResult {
  readonly verdict: GuessVerdict
  readonly words: readonly string[]
  readonly group: PuzzleGroup | null
}

export interface HintResult {
  readonly group: PuzzleGroup
  readonly revealedTitle: boolean
  readonly word: string | null
}

export type SessionStatus = 'playing' | 'won' | 'lost'

export class PuzzleSession implements IDisposable {
  readonly puzzle: Puzzle
  readonly onChange = new Signal<void>()
  readonly onGuess = new Signal<GuessResult>()
  readonly onFinish = new Signal<SessionStatus>()

  private tiles: string[]
  private readonly selection = new Set<string>()
  private readonly solvedGroups: PuzzleGroup[] = []
  private readonly guesses = new Set<string>()
  private readonly titleHints = new Set<string>()
  private readonly wordHints = new Set<string>()
  private mistakeCount = 0
  private bonusLives = 0
  private state: SessionStatus = 'playing'
  private readonly now: () => number
  private readonly startedAt: number
  private finishedAt: number | null = null

  constructor(puzzle: Puzzle, now: () => number = Date.now) {
    this.puzzle = puzzle
    this.tiles = [...puzzle.tiles]
    this.now = now
    this.startedAt = now()
  }

  get status(): SessionStatus {
    return this.state
  }

  get remaining(): readonly string[] {
    return this.tiles
  }

  get selected(): ReadonlySet<string> {
    return this.selection
  }

  get solved(): readonly PuzzleGroup[] {
    return this.solvedGroups
  }

  get mistakes(): number {
    return this.mistakeCount
  }

  get lives(): number {
    return MAX_MISTAKES + this.bonusLives - this.mistakeCount
  }

  get maxLives(): number {
    return MAX_MISTAKES + this.bonusLives
  }

  get hintsUsed(): number {
    return this.titleHints.size + this.wordHints.size
  }

  get hintedTitles(): readonly PuzzleGroup[] {
    return this.puzzle.groups.filter(
      (group) => this.titleHints.has(group.categoryId) && !this.solvedGroups.includes(group),
    )
  }

  get hintedWords(): ReadonlySet<string> {
    return this.wordHints
  }

  get elapsedMs(): number {
    return (this.finishedAt ?? this.now()) - this.startedAt
  }

  get canSubmit(): boolean {
    return this.state === 'playing' && this.selection.size === GROUP_SIZE
  }

  toggle(word: string): boolean {
    if (this.state !== 'playing' || !this.tiles.includes(word)) return false
    if (this.selection.has(word)) {
      this.selection.delete(word)
    } else {
      if (this.selection.size >= GROUP_SIZE) return false
      this.selection.add(word)
    }
    this.onChange.emit()
    return true
  }

  clearSelection(): void {
    if (this.selection.size === 0) return
    this.selection.clear()
    this.onChange.emit()
  }

  shuffle(random: () => number = Math.random): void {
    const tiles = this.tiles
    for (let i = tiles.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1))
      const swap = tiles[i] as string
      tiles[i] = tiles[j] as string
      tiles[j] = swap
    }
    this.onChange.emit()
  }

  submit(): GuessResult | null {
    if (!this.canSubmit) return null
    const words = [...this.selection]
    const key = [...words].sort().join('|')

    if (this.guesses.has(key)) {
      const result: GuessResult = { verdict: 'repeat', words, group: null }
      this.onGuess.emit(result)
      return result
    }
    this.guesses.add(key)

    const match = this.unsolved().find((group) => words.every((word) => group.words.includes(word)))
    if (match) {
      this.solve(match)
      const result: GuessResult = { verdict: 'correct', words, group: match }
      this.onGuess.emit(result)
      this.afterSolve()
      return result
    }

    this.mistakeCount++
    const best = Math.max(
      ...this.unsolved().map((group) => words.filter((word) => group.words.includes(word)).length),
    )
    const result: GuessResult = {
      verdict: best === GROUP_SIZE - 1 ? 'one-away' : 'wrong',
      words,
      group: null,
    }
    this.onGuess.emit(result)
    if (this.lives <= 0) this.finish('lost')
    else this.onChange.emit()
    return result
  }

  hint(): HintResult | null {
    if (this.state !== 'playing') return null
    const group = this.unsolved().find(
      (candidate) =>
        !this.titleHints.has(candidate.categoryId) ||
        candidate.words.some((word) => !this.wordHints.has(word)),
    )
    if (!group) return null
    if (!this.titleHints.has(group.categoryId)) {
      this.titleHints.add(group.categoryId)
      this.onChange.emit()
      return { group, revealedTitle: true, word: null }
    }
    const word = group.words.find((candidate) => !this.wordHints.has(candidate)) ?? null
    if (word) this.wordHints.add(word)
    this.onChange.emit()
    return { group, revealedTitle: false, word }
  }

  grantLife(): void {
    if (this.state !== 'lost') return
    this.bonusLives++
    this.state = 'playing'
    this.finishedAt = null
    this.onChange.emit()
  }

  revealAll(): readonly PuzzleGroup[] {
    return this.unsolved()
  }

  private unsolved(): PuzzleGroup[] {
    return this.puzzle.groups.filter((group) => !this.solvedGroups.includes(group))
  }

  private solve(group: PuzzleGroup): void {
    this.solvedGroups.push(group)
    this.tiles = this.tiles.filter((word) => !group.words.includes(word))
    this.selection.clear()
  }

  private afterSolve(): void {
    const rest = this.unsolved()
    if (rest.length === 1) {
      const last = rest[0] as PuzzleGroup
      this.solve(last)
      this.onGuess.emit({ verdict: 'correct', words: [...last.words], group: last })
    }
    if (this.unsolved().length === 0) this.finish('won')
    else this.onChange.emit()
  }

  private finish(status: SessionStatus): void {
    this.state = status
    this.finishedAt = this.now()
    this.selection.clear()
    this.onChange.emit()
    this.onFinish.emit(status)
  }

  dispose(): void {
    this.onChange.dispose()
    this.onGuess.dispose()
    this.onFinish.dispose()
  }
}
