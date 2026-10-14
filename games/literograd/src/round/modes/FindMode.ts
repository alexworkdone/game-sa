import type { IRandom } from '@sa/core'
import { toLower } from '../../content/alphabets.js'
import type { Alphabet } from '../../content/alphabets.js'
import type { ModeId } from '../../content/modes.js'
import { UK } from '../../i18n/uk.js'
import { IGNORE, MISS } from '../IRoundMode.js'
import type { IRoundMode, TapResult, TaskView } from '../IRoundMode.js'

interface FindTile {
  readonly label: string
  readonly target: boolean
  found: boolean
}

const SMALL_BOARD = 16
const LARGE_BOARD = 20
const SMALL_WAVES = 3
const MIN_TARGETS = 3
const MAX_TARGETS = 5
const LOOKALIKE_SHARE = 0.55
const WAVE_BONUS = 3

export class FindMode implements IRoundMode {
  readonly id: ModeId = 'find'
  readonly waveDelayMs = 420

  columns = 4
  tiles: FindTile[] = []

  private readonly alphabet: Alphabet
  private readonly lowercase: boolean
  private readonly random: IRandom
  private target = ''
  private left = 0
  private wave = 0

  constructor(alphabet: Alphabet, lowercase: boolean, random: IRandom) {
    this.alphabet = alphabet
    this.lowercase = lowercase
    this.random = random
  }

  start(): void {
    this.wave = 0
    this.build()
  }

  advance(): void {
    this.wave++
    this.build()
  }

  tap(index: number): TapResult {
    const tile = this.tiles[index]
    if (!tile || tile.found) return IGNORE
    if (!tile.target) return MISS
    tile.found = true
    this.left--
    if (this.left > 0) return { kind: 'hit', extraBase: 0, bonus: null, change: 'none' }
    return { kind: 'hit', extraBase: 0, bonus: { amount: WAVE_BONUS, text: UK.game.allFound }, change: 'board' }
  }

  hintIndex(): number {
    return this.tiles.findIndex((tile) => tile.target && !tile.found)
  }

  task(): TaskView {
    const glyph = this.lowercase ? `${this.target} ${toLower(this.target)}` : this.target
    return { lead: UK.game.findLead, glyph, tail: UK.game.left(this.left), strip: null }
  }

  private build(): void {
    const letters = this.alphabet.letters
    let target = this.random.pick(letters)
    while (target === this.target && letters.length > 1) target = this.random.pick(letters)
    this.target = target

    const size = this.wave < SMALL_WAVES ? SMALL_BOARD : LARGE_BOARD
    const targets = this.random.int(MIN_TARGETS, MAX_TARGETS + 1)
    let near = this.alphabet.similarTo(target)
    let others = letters.filter((letter) => letter !== target)
    const clash = this.lowercase ? this.alphabet.mixedCaseClash(target) : null
    if (clash) {
      near = near.filter((letter) => letter !== clash)
      others = others.filter((letter) => letter !== clash)
    }

    const letterSet: { letter: string; target: boolean }[] = []
    for (let i = 0; i < targets; i++) letterSet.push({ letter: target, target: true })
    while (letterSet.length < size) {
      const pool = near.length > 0 && this.random.bool(LOOKALIKE_SHARE) ? near : others
      letterSet.push({ letter: this.random.pick(pool), target: false })
    }
    this.tiles = this.random.shuffle(letterSet).map((item) => ({
      label: this.lowercase && this.random.bool(0.5) ? toLower(item.letter) : item.letter,
      target: item.target,
      found: false,
    }))
    this.left = targets
    this.columns = size === SMALL_BOARD ? 4 : 5
  }
}
