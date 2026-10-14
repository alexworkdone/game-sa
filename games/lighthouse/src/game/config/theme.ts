import { defaultTheme } from '@sa/core'
import type { UiTheme } from '@sa/core'
import { PALETTE } from './palette.js'

export const UI_THEME: UiTheme = {
  ...defaultTheme,
  text: PALETTE.ink,
  textMuted: PALETTE.inkMuted,
  surface: PALETTE.surface,
  surfaceActive: PALETTE.surfaceActive,
  accent: PALETTE.accent,
  radius: 12,
}

export const UI_SECONDARY_THEME: UiTheme = {
  ...UI_THEME,
  surface: PALETTE.surfaceActive,
  surfaceActive: PALETTE.surfaceRaised,
}

export const UI_PRIMARY_THEME: UiTheme = {
  ...UI_THEME,
  text: PALETTE.night,
  surface: PALETTE.accent,
  surfaceActive: PALETTE.coatShade,
}

export const UI_DANGER_THEME: UiTheme = {
  ...UI_THEME,
  text: PALETTE.danger,
  surfaceActive: PALETTE.danger,
}
