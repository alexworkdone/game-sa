import { Signal } from '@sa/core'
import type { IStorage } from '@sa/core'
import type { AlphabetId } from '../content/alphabets.js'
import type { Direction, NumberPattern } from '../content/modes.js'
import type { Perks } from './Perks.js'

export type TabId = 'town' | 'play' | 'build' | 'album'

export const TABS: readonly TabId[] = ['town', 'play', 'build', 'album']

export interface PreferencesState {
  readonly alphabet: AlphabetId
  readonly lowercase: boolean
  readonly direction: Direction
  readonly numbers: NumberPattern
  readonly tab: TabId
}

const KEY = 'v1.prefs'

const DEFAULTS: PreferencesState = {
  alphabet: 'uk',
  lowercase: false,
  direction: 'forward',
  numbers: 'one',
  tab: 'town',
}

export class Preferences {
  readonly onChange = new Signal<void>()

  private readonly storage: IStorage
  private readonly perks: Perks
  private state: PreferencesState

  constructor(storage: IStorage, perks: Perks) {
    this.storage = storage
    this.perks = perks
    this.state = this.sanitize({ ...DEFAULTS, ...storage.get<Partial<PreferencesState>>(KEY, {}) })
  }

  get values(): PreferencesState {
    return this.state
  }

  update(patch: Partial<PreferencesState>): void {
    this.commit(this.sanitize({ ...this.state, ...patch }))
  }

  enforce(): void {
    const next = this.sanitize(this.state)
    if (JSON.stringify(next) !== JSON.stringify(this.state)) this.commit(next)
  }

  reset(): void {
    this.commit({ ...DEFAULTS, tab: this.state.tab })
  }

  private sanitize(state: PreferencesState): PreferencesState {
    const perks = this.perks
    const numbers: NumberPattern =
      state.numbers === 'two' && perks.has('byTwo') ? 'two' : state.numbers === 'down' && perks.has('countdown') ? 'down' : 'one'
    return {
      alphabet: state.alphabet === 'en' && perks.has('latin') ? 'en' : 'uk',
      lowercase: state.lowercase === true && perks.has('lowercase'),
      direction: state.direction === 'reverse' && perks.has('reverse') ? 'reverse' : 'forward',
      numbers,
      tab: TABS.includes(state.tab) ? state.tab : 'town',
    }
  }

  private commit(next: PreferencesState): void {
    this.state = next
    this.storage.set(KEY, next)
    this.onChange.emit()
  }
}
