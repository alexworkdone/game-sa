export type ModeId = 'find' | 'odd' | 'abc' | 'num'
export type Direction = 'forward' | 'reverse'
export type NumberPattern = 'one' | 'two' | 'down'

export interface ModeInfo {
  readonly id: ModeId
  readonly name: string
  readonly text: string
}

export const MODES: readonly ModeInfo[] = [
  { id: 'find', name: 'Знайди літеру', text: 'Однакові літери сховалися серед схожих. Знайди всі — і з’явиться нове поле.' },
  { id: 'odd', name: 'Знайди зайву', text: 'Усе поле з однієї літери, і лише одна — інша. Знайди її якнайшвидше: поле щоразу більшає.' },
  { id: 'abc', name: 'Абетка по черзі', text: 'Натискай літери за абеткою. На місці знайденої з’являється наступна, а вся абетка дає великий бонус.' },
  { id: 'num', name: 'Числа по черзі', text: 'Натискай числа по порядку. Кожні пройдені 10 чисел дають бонус.' },
]

export const MODE_NAMES: Readonly<Record<ModeId, string>> = {
  find: 'Знайди літеру',
  odd: 'Знайди зайву',
  abc: 'Абетка по черзі',
  num: 'Числа по черзі',
}

export const NUMBER_PATTERN_NAMES: Readonly<Record<NumberPattern, string>> = {
  one: 'по одному',
  two: 'двійками',
  down: 'від 30 до 1',
}
