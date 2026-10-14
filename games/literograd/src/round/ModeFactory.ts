import type { IRandom } from '@sa/core'
import { Alphabet, toLower } from '../content/alphabets.js'
import type { ModeId } from '../content/modes.js'
import type { PreferencesState } from '../meta/Preferences.js'
import type { IRoundMode } from './IRoundMode.js'
import { FindMode } from './modes/FindMode.js'
import { OddMode } from './modes/OddMode.js'
import { SequenceMode } from './modes/SequenceMode.js'
import { LetterSequence, NumberSequence } from './sequences.js'

export interface IModeFactory {
  create(mode: ModeId, prefs: PreferencesState): IRoundMode
}

export class ModeFactory implements IModeFactory {
  private readonly random: IRandom

  constructor(random: IRandom) {
    this.random = random
  }

  create(mode: ModeId, prefs: PreferencesState): IRoundMode {
    const alphabet = new Alphabet(prefs.alphabet)
    switch (mode) {
      case 'find':
        return new FindMode(alphabet, prefs.lowercase, this.random)
      case 'odd':
        return new OddMode(alphabet, prefs.lowercase, this.random)
      case 'abc': {
        const letters = alphabet.letters.map((letter) => (prefs.lowercase ? toLower(letter) : letter))
        if (prefs.direction === 'reverse') letters.reverse()
        return new SequenceMode('abc', new LetterSequence(letters), this.random)
      }
      case 'num':
        return new SequenceMode('num', new NumberSequence(prefs.numbers), this.random)
    }
  }
}
