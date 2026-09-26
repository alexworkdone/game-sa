import type { IStorage } from '@sa/core'
import { CATEGORY_NAMES, ELEMENT_NAMES, HINTS, LANGS, UI } from '../data/i18n.js'
import type { Lang, UiKey } from '../data/i18n.js'
import { THEMES, applyTheme } from '../config/palette.js'
import type { ThemeId } from '../config/palette.js'
import type { ElementId } from '../data/elements.js'
import type { CategoryId } from '../data/categories.js'

export type SortMode = 'discovery' | 'alpha' | 'category' | 'depth' | 'useful'

export const SORT_MODES: readonly SortMode[] = [
  'discovery',
  'alpha',
  'category',
  'depth',
  'useful',
]

const SORT_LABELS: Record<SortMode, UiKey> = {
  discovery: 'sortDiscovery',
  alpha: 'sortAlpha',
  category: 'sortCategory',
  depth: 'sortDepth',
  useful: 'sortUseful',
}

const THEME_LABELS: Record<ThemeId, UiKey> = {
  night: 'themeNight',
  coal: 'themeCoal',
  forest: 'themeForest',
  plum: 'themePlum',
}

const KEY = 'settings'

interface Stored {
  readonly lang: Lang
  readonly sort: SortMode
  readonly theme: ThemeId
}

export class Settings {
  private readonly storage: IStorage

  lang: Lang = 'uk'
  sort: SortMode = 'discovery'
  theme: ThemeId = 'night'

  constructor(storage: IStorage) {
    this.storage = storage
    const saved = this.storage.get<Partial<Stored>>(KEY, {})
    if (saved.lang && LANGS.includes(saved.lang)) this.lang = saved.lang
    if (saved.sort && SORT_MODES.includes(saved.sort)) this.sort = saved.sort
    if (saved.theme && THEMES.some((theme) => theme.id === saved.theme)) this.theme = saved.theme
    applyTheme(this.theme)
  }

  setLang(lang: Lang): void {
    this.lang = lang
    this.save()
  }

  setSort(sort: SortMode): void {
    this.sort = sort
    this.save()
  }

  setTheme(theme: ThemeId): void {
    this.theme = theme
    applyTheme(theme)
    this.save()
  }

  t(key: UiKey): string {
    return UI[this.lang][key]
  }

  element(id: ElementId): string {
    return ELEMENT_NAMES[this.lang][id]
  }

  category(id: CategoryId): string {
    return CATEGORY_NAMES[this.lang][id]
  }

  hint(id: ElementId): string | null {
    return HINTS[this.lang][id] ?? null
  }

  sortLabel(mode: SortMode): string {
    return this.t(SORT_LABELS[mode])
  }

  themeLabel(id: ThemeId): string {
    return this.t(THEME_LABELS[id])
  }

  private save(): void {
    this.storage.set<Stored>(KEY, { lang: this.lang, sort: this.sort, theme: this.theme })
  }
}
