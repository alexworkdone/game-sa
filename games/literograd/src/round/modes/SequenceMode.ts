import type { IRandom } from '@sa/core'
import type { ModeId } from '../../content/modes.js'
import { UK } from '../../i18n/uk.js'
import { IGNORE, MISS } from '../IRoundMode.js'
import type { IRoundMode, TapResult, TaskView } from '../IRoundMode.js'
import type { ISequence } from '../sequences.js'

interface SequenceTile {
  label: string
  index: number
  readonly found: false
}

const WINDOW = 12

export class SequenceMode implements IRoundMode {
  readonly id: ModeId
  readonly columns = 4
  readonly waveDelayMs = 0

  tiles: SequenceTile[] = []

  private readonly sequence: ISequence
  private readonly random: IRandom
  private position = 0

  constructor(id: ModeId, sequence: ISequence, random: IRandom) {
    this.id = id
    this.sequence = sequence
    this.random = random
  }

  start(): void {
    this.position = 0
    this.tiles = this.random.shuffle(
      Array.from({ length: WINDOW }, (_, index) => ({ label: this.sequence.item(index), index, found: false as const })),
    )
  }

  advance(): void {}

  tap(index: number): TapResult {
    const tile = this.tiles[index]
    if (!tile) return IGNORE
    if (tile.index !== this.position) return MISS
    this.position++
    tile.index += WINDOW
    tile.label = this.sequence.item(tile.index)
    const lapDone = this.position % this.sequence.lapLength === 0
    return {
      kind: 'hit',
      extraBase: 0,
      bonus: lapDone ? { amount: this.sequence.lapBonus, text: this.sequence.lapText } : null,
      change: 'tile',
    }
  }

  hintIndex(): number {
    return this.tiles.findIndex((tile) => tile.index === this.position)
  }

  task(): TaskView {
    const strip = this.sequence.strip
    return {
      lead: UK.game.tapLead,
      glyph: this.sequence.item(this.position),
      tail: null,
      strip: strip ? { items: strip, at: this.position % this.sequence.lapLength } : null,
    }
  }
}
