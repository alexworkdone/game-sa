import { defaultTheme } from '@sa/core'
import type { UiTheme } from '@sa/core'
import { PALETTE } from './palette.js'

export const UI_THEME: UiTheme = {
  ...defaultTheme,
  text: PALETTE.ink,
  textMuted: PALETTE.inkMuted,
  surface: PALETTE.surface,
  surfaceActive: PALETTE.grid,
  accent: PALETTE.friendly,
}
