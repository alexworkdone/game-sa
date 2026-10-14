import { Signal } from '@sa/core'
import type { IStorage } from '@sa/core'
import { BUILDING_IDS, DECOR_IDS, DECOR_SLOTS, MAX_LEVEL } from '../content/buildings.js'
import type { BuildingId, DecorId } from '../content/buildings.js'

export type Levels = Readonly<Record<BuildingId, number>>

export interface TownSnapshot {
  readonly levels: Levels
  readonly decor: readonly DecorId[]
}

export interface AlbumEntry extends TownSnapshot {
  readonly book: number
  readonly finishedAt: number
}

interface CityState {
  readonly book: number
  readonly levels: Levels
  readonly decor: readonly DecorId[]
  readonly album: readonly AlbumEntry[]
}

const KEY = 'v1.city'

const emptyLevels = (): Record<BuildingId, number> =>
  Object.fromEntries(BUILDING_IDS.map((id) => [id, 0])) as Record<BuildingId, number>

const fullLevels = (): Levels =>
  Object.fromEntries(BUILDING_IDS.map((id) => [id, MAX_LEVEL])) as Record<BuildingId, number>

const isDecor = (value: unknown): value is DecorId => DECOR_IDS.includes(value as DecorId)

const readDecor = (value: unknown): DecorId[] =>
  Array.isArray(value) ? value.filter(isDecor).slice(0, DECOR_SLOTS.length) : []

const readLevels = (value: unknown): Levels => {
  const levels = emptyLevels()
  const source = value && typeof value === 'object' ? (value as Record<string, unknown>) : {}
  for (const id of BUILDING_IDS) {
    const raw = Number(source[id])
    levels[id] = Number.isFinite(raw) ? Math.min(MAX_LEVEL, Math.max(0, Math.round(raw))) : 0
  }
  return levels
}

const readAlbum = (value: unknown): AlbumEntry[] =>
  Array.isArray(value)
    ? value
        .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object')
        .map((item) => ({
          book: Math.max(1, Math.round(Number(item.book) || 1)),
          finishedAt: Number(item.finishedAt) || 0,
          levels: fullLevels(),
          decor: readDecor(item.decor),
        }))
    : []

const freshState = (): CityState => ({ book: 1, levels: emptyLevels(), decor: [], album: [] })

export class City {
  readonly onChange = new Signal<void>()

  private readonly storage: IStorage
  private state: CityState

  constructor(storage: IStorage) {
    this.storage = storage
    const saved = storage.get<Partial<Record<keyof CityState, unknown>> | null>(KEY, null)
    this.state = saved
      ? {
          book: Math.max(1, Math.round(Number(saved.book) || 1)),
          levels: readLevels(saved.levels),
          decor: readDecor(saved.decor),
          album: readAlbum(saved.album),
        }
      : freshState()
  }

  get book(): number {
    return this.state.book
  }

  get album(): readonly AlbumEntry[] {
    return this.state.album
  }

  get snapshot(): TownSnapshot {
    return { levels: this.state.levels, decor: this.state.decor }
  }

  get decor(): readonly DecorId[] {
    return this.state.decor
  }

  get freeSlots(): number {
    return DECOR_SLOTS.length - this.state.decor.length
  }

  get levelSum(): number {
    return BUILDING_IDS.reduce((sum, id) => sum + this.state.levels[id], 0)
  }

  get maxLevels(): number {
    return BUILDING_IDS.length * MAX_LEVEL
  }

  get builtCount(): number {
    return BUILDING_IDS.filter((id) => this.state.levels[id] > 0).length
  }

  get complete(): boolean {
    return this.levelSum >= this.maxLevels
  }

  level(id: BuildingId): number {
    return this.state.levels[id]
  }

  raise(id: BuildingId): number {
    const next = Math.min(MAX_LEVEL, this.state.levels[id] + 1)
    this.commit({ ...this.state, levels: { ...this.state.levels, [id]: next } })
    return next
  }

  place(decor: DecorId): boolean {
    if (this.freeSlots <= 0) return false
    this.commit({ ...this.state, decor: [...this.state.decor, decor] })
    return true
  }

  closeBook(finishedAt: number): void {
    const entry: AlbumEntry = { book: this.state.book, finishedAt, levels: fullLevels(), decor: this.state.decor }
    this.commit({ book: this.state.book + 1, levels: emptyLevels(), decor: [], album: [...this.state.album, entry] })
  }

  reset(): void {
    this.commit(freshState())
  }

  private commit(next: CityState): void {
    this.state = next
    this.storage.set(KEY, next)
    this.onChange.emit()
  }
}
