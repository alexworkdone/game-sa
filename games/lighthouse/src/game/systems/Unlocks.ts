import type { IStorage } from '@sa/core'
import { MENU_UNLOCKS } from '../config/unlocks.js'
import type { MenuFeature, MenuUnlockDef, UnlockView } from '../config/unlocks.js'

const STORAGE_KEY = 'unlocks.v1'

export class Unlocks {
  private readonly storage: IStorage
  private readonly view: UnlockView
  private readonly introduced: Set<MenuFeature>

  constructor(storage: IStorage, view: UnlockView) {
    this.storage = storage
    this.view = view
    this.introduced = new Set(storage.get<MenuFeature[]>(STORAGE_KEY, []))
  }

  isOpen(id: MenuFeature): boolean {
    return MENU_UNLOCKS.find((def) => def.id === id)?.isOpen(this.view) ?? true
  }

  nextIntro(): MenuUnlockDef | null {
    return MENU_UNLOCKS.find((def) => !this.introduced.has(def.id) && def.isOpen(this.view)) ?? null
  }

  markIntroduced(id: MenuFeature): void {
    if (this.introduced.has(id)) return
    this.introduced.add(id)
    this.storage.set(STORAGE_KEY, [...this.introduced])
  }

  reset(): void {
    this.introduced.clear()
    this.storage.set(STORAGE_KEY, [])
  }
}
