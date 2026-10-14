import { MODE_NAMES, NUMBER_PATTERN_NAMES } from '../content/modes.js'
import type { ModeId, NumberPattern } from '../content/modes.js'
import type { PreferencesState } from '../meta/Preferences.js'

export interface Variant {
  readonly key: string
  readonly multiplier: number
  readonly label: string
}

export interface VariantLabel {
  readonly mode: string
  readonly variant: string
}

const LOWERCASE_MULTIPLIER = 1.2
const HARD_MULTIPLIER = 1.5

const alphabetName = (id: string): string => (id === 'en' ? 'латинка' : 'українська абетка')
const caseName = (lowercase: boolean): string => (lowercase ? 'малі літери' : 'великі літери')
const directionName = (reverse: boolean): string => (reverse ? 'навпаки' : 'з початку')
const numberName = (pattern: string): string => NUMBER_PATTERN_NAMES[pattern as NumberPattern] ?? pattern

export const describeVariant = (mode: ModeId, prefs: PreferencesState): Variant => {
  const caseKey = prefs.lowercase ? 'l' : 'u'
  const caseMultiplier = prefs.lowercase ? LOWERCASE_MULTIPLIER : 1
  if (mode === 'find' || mode === 'odd') {
    return {
      key: `${mode}:${prefs.alphabet}:${caseKey}`,
      multiplier: caseMultiplier,
      label: `${alphabetName(prefs.alphabet)}, ${caseName(prefs.lowercase)}`,
    }
  }
  if (mode === 'abc') {
    const reverse = prefs.direction === 'reverse'
    return {
      key: `abc:${prefs.alphabet}:${prefs.direction}:${caseKey}`,
      multiplier: (reverse ? HARD_MULTIPLIER : 1) * caseMultiplier,
      label: `${alphabetName(prefs.alphabet)}, ${directionName(reverse)}, ${caseName(prefs.lowercase)}`,
    }
  }
  return {
    key: `num:${prefs.numbers}`,
    multiplier: prefs.numbers === 'one' ? 1 : HARD_MULTIPLIER,
    label: numberName(prefs.numbers),
  }
}

export const describeKey = (key: string): VariantLabel => {
  const [mode = '', a = '', b = '', c = ''] = key.split(':')
  const name = MODE_NAMES[mode as ModeId] ?? key
  if (mode === 'find' || mode === 'odd') return { mode: name, variant: `${alphabetName(a)}, ${caseName(b === 'l')}` }
  if (mode === 'abc') return { mode: name, variant: `${alphabetName(a)}, ${directionName(b === 'reverse')}, ${caseName(c === 'l')}` }
  if (mode === 'num') return { mode: name, variant: numberName(a) }
  return { mode: name, variant: '' }
}
