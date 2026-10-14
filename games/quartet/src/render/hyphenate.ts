const VOWELS = new Set('АЕЄИІЇОУЮЯ')
const NO_LINE_START = new Set(['Ь', 'Й', 'ʼ', '-'])
const DIGRAPHS = new Set(['ДЖ', 'ДЗ'])
const LIQUIDS = new Set(['Р', 'Л'])
const S_CLUSTERS = new Set(['СТ', 'СК', 'СП'])

const hasVowel = (part: string): boolean => [...part].some((char) => VOWELS.has(char))

const opensSyllable = (word: string, index: number): boolean => {
  const first = word[index] ?? ''
  const second = word[index + 1] ?? ''
  if (VOWELS.has(second)) return true
  if (DIGRAPHS.has(first + second)) return VOWELS.has(word[index + 2] ?? '')
  return (LIQUIDS.has(second) && !LIQUIDS.has(first)) || S_CLUSTERS.has(first + second)
}

export const hyphenPoints = (word: string): number[] => {
  const hyphen = word.indexOf('-')
  if (hyphen > 0) return [hyphen + 1]
  const points: number[] = []
  for (let index = 2; index <= word.length - 2; index++) {
    const before = word[index - 1] ?? ''
    const after = word[index] ?? ''
    if (NO_LINE_START.has(after) || VOWELS.has(after)) continue
    if (DIGRAPHS.has(before + after)) continue
    if (VOWELS.has(before) && !opensSyllable(word, index)) continue
    if (!hasVowel(word.slice(0, index)) || !hasVowel(word.slice(index))) continue
    points.push(index)
  }
  return points
}

export const splitAt = (word: string, point: number): [string, string] => {
  const head = word.slice(0, point)
  return [head.endsWith('-') ? head : `${head}-`, word.slice(point)]
}
