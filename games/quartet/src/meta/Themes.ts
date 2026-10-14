import type { Galaxy } from '../forge/Galaxy.js'

export type ThemeId = 'cosmos' | 'aurora' | 'sunset' | 'abyss'

export interface ThemeDef {
  readonly id: ThemeId
  readonly requiredTypes: number
  readonly requiresSecret: boolean
}

export const THEMES: readonly ThemeDef[] = [
  { id: 'cosmos', requiredTypes: 0, requiresSecret: false },
  { id: 'aurora', requiredTypes: 4, requiresSecret: false },
  { id: 'sunset', requiredTypes: 8, requiresSecret: false },
  { id: 'abyss', requiredTypes: 0, requiresSecret: true },
]

export class ThemeUnlocks {
  private readonly galaxy: Galaxy

  constructor(galaxy: Galaxy) {
    this.galaxy = galaxy
  }

  isUnlocked(theme: ThemeDef): boolean {
    const types = this.galaxy.discoveredTypes()
    if (theme.requiresSecret) return types.has('blackhole')
    return types.size >= theme.requiredTypes
  }

  unlocked(): readonly ThemeDef[] {
    return THEMES.filter((theme) => this.isUnlocked(theme))
  }
}
