export interface Palette {
  background: string
  backdrop: string
  track: string
  trackLit: string
  frame: string
  ink: string
  inkMuted: string
  beam: string
  spark: string
  alert: string
}

export type ThemeId = 'night' | 'coal' | 'forest' | 'plum'

export interface ThemeDef {
  readonly id: ThemeId
  readonly colors: Palette
}

export const THEMES: readonly ThemeDef[] = [
  {
    id: 'night',
    colors: {
      background: '#080a12',
      backdrop: '#0d1120',
      track: '#1d2438',
      trackLit: '#33405e',
      frame: '#2a3350',
      ink: '#f0f3ff',
      inkMuted: '#6d7897',
      beam: '#7c8cff',
      spark: '#c9d4ff',
      alert: '#ff5f78',
    },
  },
  {
    id: 'coal',
    colors: {
      background: '#0c0c0e',
      backdrop: '#141417',
      track: '#242428',
      trackLit: '#3a3a41',
      frame: '#31313a',
      ink: '#f4f4f6',
      inkMuted: '#8a8a94',
      beam: '#9aa6c4',
      spark: '#dcdfe8',
      alert: '#ff6b6b',
    },
  },
  {
    id: 'forest',
    colors: {
      background: '#06100c',
      backdrop: '#0c1a14',
      track: '#183024',
      trackLit: '#2c5440',
      frame: '#234636',
      ink: '#eefaf2',
      inkMuted: '#6f9482',
      beam: '#4fd39a',
      spark: '#b8f5d8',
      alert: '#ff7a6b',
    },
  },
  {
    id: 'plum',
    colors: {
      background: '#100813',
      backdrop: '#1a0f20',
      track: '#2e1c38',
      trackLit: '#4a2d5a',
      frame: '#3d2749',
      ink: '#fbf0ff',
      inkMuted: '#9b7fa8',
      beam: '#c77dff',
      spark: '#f0d6ff',
      alert: '#ff6f91',
    },
  },
]

export const PALETTE: Palette = { ...(THEMES[0] as ThemeDef).colors }

export const applyTheme = (id: ThemeId): void => {
  const theme = THEMES.find((item) => item.id === id) ?? THEMES[0]
  if (theme) Object.assign(PALETTE, theme.colors)
}

export const themeAccent = (id: ThemeId): string =>
  (THEMES.find((item) => item.id === id) ?? (THEMES[0] as ThemeDef)).colors.beam

export const themeBackground = (id: ThemeId): string =>
  (THEMES.find((item) => item.id === id) ?? (THEMES[0] as ThemeDef)).colors.backdrop
