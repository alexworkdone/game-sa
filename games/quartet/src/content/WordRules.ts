import type { WordRule } from './CategoryData.js'

const APOSTROPHES = /['’`ʹ]/g

export const normalizeWord = (word: string): string =>
  word.trim().toUpperCase().replace(APOSTROPHES, 'ʼ')

const lettersOnly = (word: string): string => word.replace(/[ʼ\-\s]/g, '')

export const matchesRule = (rule: WordRule, word: string): boolean => {
  const normalized = normalizeWord(word)
  switch (rule.kind) {
    case 'prefix':
      return rule.values.some((value) => normalized.startsWith(normalizeWord(value)))
    case 'suffix':
      return rule.values.some((value) => normalized.endsWith(normalizeWord(value)))
    case 'contains':
      return rule.values.some((value) => normalized.includes(normalizeWord(value)))
    case 'palindrome': {
      const letters = lettersOnly(normalized)
      return letters.length > 2 && letters === [...letters].reverse().join('')
    }
  }
}
