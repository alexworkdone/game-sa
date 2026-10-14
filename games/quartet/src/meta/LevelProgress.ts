import { Signal } from '@sa/core'
import type { IStorage } from '@sa/core'

export const CHAPTER_SIZE = 10
export const CHEST_STARS = 24

interface ProgressState {
  readonly stars: Record<string, number>
  readonly unlocked: number
  readonly chests: readonly number[]
}

export interface LevelRecord {
  readonly firstClear: boolean
  readonly previousStars: number
  readonly stars: number
}

export interface ChapterInfo {
  readonly index: number
  readonly first: number
  readonly last: number
  readonly stars: number
  readonly maxStars: number
  readonly chestReady: boolean
  readonly chestClaimed: boolean
  readonly unlocked: boolean
}

const KEY = 'v1.levels'

export class LevelProgress {
  readonly onChange = new Signal<void>()

  private readonly storage: IStorage
  private state: ProgressState

  constructor(storage: IStorage) {
    this.storage = storage
    const saved = storage.get<ProgressState | null>(KEY, null)
    this.state = {
      stars: { ...(saved?.stars ?? {}) },
      unlocked: saved?.unlocked ?? 1,
      chests: [...(saved?.chests ?? [])],
    }
  }

  get current(): number {
    return this.state.unlocked
  }

  get totalStars(): number {
    return Object.values(this.state.stars).reduce((sum, stars) => sum + stars, 0)
  }

  starsFor(level: number): number {
    return this.state.stars[level] ?? 0
  }

  isUnlocked(level: number): boolean {
    return level <= this.state.unlocked
  }

  record(level: number, stars: number): LevelRecord {
    const previousStars = this.starsFor(level)
    const firstClear = stars > 0 && level >= this.state.unlocked
    const next: ProgressState = {
      ...this.state,
      stars: { ...this.state.stars, [level]: Math.max(previousStars, stars) },
      unlocked: stars > 0 ? Math.max(this.state.unlocked, level + 1) : this.state.unlocked,
    }
    this.commit(next)
    return { firstClear, previousStars, stars }
  }

  chapterOf(level: number): number {
    return Math.floor((level - 1) / CHAPTER_SIZE)
  }

  chapter(index: number): ChapterInfo {
    const first = index * CHAPTER_SIZE + 1
    const last = first + CHAPTER_SIZE - 1
    let stars = 0
    for (let level = first; level <= last; level++) stars += this.starsFor(level)
    const chestClaimed = this.state.chests.includes(index)
    return {
      index,
      first,
      last,
      stars,
      maxStars: CHAPTER_SIZE * 3,
      chestReady: stars >= CHEST_STARS && !chestClaimed,
      chestClaimed,
      unlocked: this.isUnlocked(first),
    }
  }

  claimChest(index: number): boolean {
    if (!this.chapter(index).chestReady) return false
    this.commit({ ...this.state, chests: [...this.state.chests, index] })
    return true
  }

  reset(): void {
    this.commit({ stars: {}, unlocked: 1, chests: [] })
  }

  private commit(next: ProgressState): void {
    this.state = next
    this.storage.set(KEY, next)
    this.onChange.emit()
  }
}
