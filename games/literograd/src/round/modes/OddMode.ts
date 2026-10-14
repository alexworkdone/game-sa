import type { IRandom } from '@sa/core'
import { toLower } from '../../content/alphabets.js'
import type { Alphabet } from '../../content/alphabets.js'
import type { ModeId } from '../../content/modes.js'
import { UK } from '../../i18n/uk.js'
import { IGNORE, MISS } from '../IRoundMode.js'
import type { IRoundMode, TapResult, TaskView } from '../IRoundMode.js'

interface OddTile {
  readonly label: string
  readonly target: boolean
  found: boolean
}

interface BoardStep {
  readonly fromWave: number
  readonly size: number
  readonly extraBase: number
}

const BOARD_STEPS: readonly BoardStep[] = [
  { fromWave: 7, size: 36, extraBase: 2 },
  { fromWave: 3, size: 25, extraBase: 1 },
  { fromWave: 0, size: 16, extraBase: 0 },
]

export class OddMode implements IRoundMode {
  readonly id: ModeId = 'odd'
  readonly waveDelayMs = 260

  columns = 4
  tiles: OddTile[] = []

  private readonly alphabet: Alphabet
  private readonly lowercase: boolean
  private readonly random: IRandom
  private base = ''
  private wave = 0
  private extraBase = 0

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
    return { kind: 'hit', extraBase: this.extraBase, bonus: null, change: 'board' }
  }

  hintIndex(): number {
    return this.tiles.findIndex((tile) => tile.target && !tile.found)
  }

  task(): TaskView {
    return { lead: UK.game.oddLead, glyph: this.show(this.base), tail: UK.game.oddTail(this.wave + 1), strip: null }
  }

  private build(): void {
    const letters = this.alphabet.letters
    let base = this.random.pick(letters)
    while (base === this.base && letters.length > 1) base = this.random.pick(letters)
    this.base = base

    const near = this.alphabet.similarTo(base)
    const odd = near.length > 0 ? this.random.pick(near) : this.random.pick(letters.filter((letter) => letter !== base))
    const step = BOARD_STEPS.find((item) => this.wave >= item.fromWave) ?? { fromWave: 0, size: 16, extraBase: 0 }
    const oddIndex = this.random.int(0, step.size)

    this.tiles = Array.from({ length: step.size }, (_, index) =>
      index === oddIndex
        ? { label: this.show(odd), target: true, found: false }
        : { label: this.show(base), target: false, found: false },
    )
    this.columns = Math.round(Math.sqrt(step.size))
    this.extraBase = step.extraBase
  }

  private show(letter: string): string {
    return this.lowercase ? toLower(letter) : letter
  }
}
