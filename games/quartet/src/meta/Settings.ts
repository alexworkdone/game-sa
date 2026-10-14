import { Signal } from '@sa/core'
import type { IStorage } from '@sa/core'

export interface SettingsState {
  readonly sound: boolean
  readonly vibration: boolean
  readonly theme: string
  readonly tutorialSeen: boolean
}

const KEY = 'v1.settings'

const DEFAULTS: SettingsState = {
  sound: true,
  vibration: true,
  theme: 'cosmos',
  tutorialSeen: false,
}

export class Settings {
  readonly onChange = new Signal<void>()

  private readonly storage: IStorage
  private state: SettingsState

  constructor(storage: IStorage) {
    this.storage = storage
    this.state = { ...DEFAULTS, ...storage.get<Partial<SettingsState>>(KEY, {}) }
  }

  get values(): SettingsState {
    return this.state
  }

  update(patch: Partial<SettingsState>): void {
    this.state = { ...this.state, ...patch }
    this.storage.set(KEY, this.state)
    this.onChange.emit()
  }
}
