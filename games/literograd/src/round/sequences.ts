import type { NumberPattern } from '../content/modes.js'
import { UK } from '../i18n/uk.js'

export interface ISequence {
  readonly lapLength: number
  readonly lapBonus: number
  readonly lapText: string
  readonly strip: readonly string[] | null
  item(index: number): string
}

const ALPHABET_BONUS = 15
const TEN_LENGTH = 10
const TEN_BONUS = 5
const COUNTDOWN_FROM = 30

export class LetterSequence implements ISequence {
  readonly lapLength: number
  readonly lapBonus = ALPHABET_BONUS
  readonly lapText = UK.game.alphabetDone
  readonly strip: readonly string[]

  constructor(letters: readonly string[]) {
    this.strip = letters
    this.lapLength = letters.length
  }

  item(index: number): string {
    return this.strip[index % this.lapLength] ?? ''
  }
}

export class NumberSequence implements ISequence {
  readonly lapLength = TEN_LENGTH
  readonly lapBonus = TEN_BONUS
  readonly lapText = UK.game.ten
  readonly strip = null

  private readonly pattern: NumberPattern

  constructor(pattern: NumberPattern) {
    this.pattern = pattern
  }

  item(index: number): string {
    if (this.pattern === 'two') return String(2 * (index + 1))
    if (this.pattern === 'down') return String(COUNTDOWN_FROM - (index % COUNTDOWN_FROM))
    return String(index + 1)
  }
}
