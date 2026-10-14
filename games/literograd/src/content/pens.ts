export interface PenInfo {
  readonly index: number
  readonly name: string
  readonly instrumental: string
}

const FIRST_PEN: PenInfo = { index: 1, name: 'синє', instrumental: 'синім' }

export const PENS: readonly PenInfo[] = [
  FIRST_PEN,
  { index: 2, name: 'зелене', instrumental: 'зеленим' },
  { index: 3, name: 'фіолетове', instrumental: 'фіолетовим' },
  { index: 4, name: 'коричневе', instrumental: 'коричневим' },
  { index: 5, name: 'золоте', instrumental: 'золотим' },
]

export const penFor = (book: number): PenInfo =>
  PENS[Math.min(Math.max(1, book), PENS.length) - 1] ?? FIRST_PEN
