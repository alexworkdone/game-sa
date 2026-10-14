export type AlphabetId = 'uk' | 'en'

const LETTERS: Readonly<Record<AlphabetId, string>> = {
  uk: 'АБВГҐДЕЄЖЗИІЇЙКЛМНОПРСТУФХЦЧШЩЬЮЯ',
  en: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
}

const LOOKALIKES: Readonly<Record<AlphabetId, readonly string[]>> = {
  uk: ['ШЩЦ', 'ЕЄЗ', 'ИЙНП', 'ІЇТ', 'БВРЬ', 'ОСЮ', 'ГҐТП', 'ЖХК', 'ДЛА', 'УЧ', 'МНИ', 'ЯРФ'],
  en: ['OQCGD', 'EFLT', 'PRB', 'MNWV', 'UVY', 'IJ', 'KXY', 'SZ', 'HN'],
}

const MIXED_CASE_CLASHES: Readonly<Record<AlphabetId, Readonly<Record<string, string>>>> = {
  uk: {},
  en: { I: 'L', L: 'I' },
}

export const toLower = (letter: string): string => letter.toLocaleLowerCase('uk')

export class Alphabet {
  readonly id: AlphabetId
  readonly letters: readonly string[]

  constructor(id: AlphabetId) {
    this.id = id
    this.letters = [...LETTERS[id]]
  }

  similarTo(letter: string): string[] {
    const found = new Set<string>()
    for (const group of LOOKALIKES[this.id]) {
      if (group.includes(letter)) for (const other of group) found.add(other)
    }
    found.delete(letter)
    return [...found]
  }

  mixedCaseClash(letter: string): string | null {
    return MIXED_CASE_CLASHES[this.id][letter] ?? null
  }
}
