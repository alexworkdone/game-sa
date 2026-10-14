import { Button } from '@sa/core'
import type { UiTheme } from '@sa/core'
import { UI_PRIMARY_THEME, UI_SECONDARY_THEME, UI_THEME } from '../config/theme.js'

export type ButtonRole = 'primary' | 'secondary' | 'ghost'
export type ButtonSize = 'lg' | 'md' | 'sm'

export const BUTTON_SIZES: Readonly<Record<ButtonSize, { readonly height: number; readonly fontSize: number }>> = {
  lg: { height: 54, fontSize: 20 },
  md: { height: 46, fontSize: 17 },
  sm: { height: 38, fontSize: 15 },
}

const ROLE_THEMES: Readonly<Record<ButtonRole, UiTheme>> = {
  primary: UI_PRIMARY_THEME,
  secondary: UI_SECONDARY_THEME,
  ghost: UI_THEME,
}

export const createButton = (
  label: string,
  role: ButtonRole,
  size: ButtonSize,
  width: number,
  fontSize: number = BUTTON_SIZES[size].fontSize,
): Button =>
  new Button({
    x: 0,
    y: 0,
    width,
    label,
    height: BUTTON_SIZES[size].height,
    fontSize,
    theme: ROLE_THEMES[role],
    variant: role === 'ghost' ? 'ghost' : 'solid',
  })
