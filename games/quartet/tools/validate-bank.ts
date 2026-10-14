import { DailySeed } from '@sa/core'
import { CATEGORIES } from '../src/content/data/categories.js'
import { CategoryBank } from '../src/content/CategoryBank.js'
import { matchesRule, normalizeWord } from '../src/content/WordRules.js'
import type { Tier } from '../src/content/CategoryData.js'
import { PuzzleGenerator } from '../src/puzzle/PuzzleGenerator.js'
import { LevelPuzzleSource } from '../src/puzzle/LevelPuzzleSource.js'
import { DailyPuzzleSource } from '../src/puzzle/DailyPuzzleSource.js'
import { LevelSchedule } from '../src/puzzle/LevelSchedule.js'

const LEVELS = Number(process.env.LEVELS ?? 200)
const DAYS = Number(process.env.DAYS ?? 365)
const MAX_WORD = 11
const MIN_WORDS = 6
const ALLOWED = /^[А-ЩЬЮЯҐЄІЇʼ-]+$/u

const errors: string[] = []
const warnings: string[] = []

const ids = new Set<string>()
for (const category of CATEGORIES) {
  const where = `[${category.id}]`
  if (ids.has(category.id)) errors.push(`${where} duplicate id`)
  ids.add(category.id)
  if (!category.title.trim()) errors.push(`${where} empty title`)
  if (category.title.length > 30) warnings.push(`${where} long title (${category.title.length})`)
  if (category.words.length < MIN_WORDS) errors.push(`${where} only ${category.words.length} words`)
  const seen = new Set<string>()
  for (const raw of [...category.words, ...(category.accepts ?? [])]) {
    const word = normalizeWord(raw)
    if (word !== raw) errors.push(`${where} "${raw}" is not normalized (expected "${word}")`)
    if (!ALLOWED.test(word)) errors.push(`${where} "${raw}" has characters outside Ukrainian uppercase`)
    if (seen.has(word)) errors.push(`${where} "${raw}" listed twice`)
    seen.add(word)
  }
  for (const word of category.words) {
    if (word.length > MAX_WORD) errors.push(`${where} "${word}" longer than ${MAX_WORD}`)
    if (category.rule && !matchesRule(category.rule, word))
      errors.push(`${where} "${word}" breaks own rule`)
  }
}

const bank = new CategoryBank(CATEGORIES)
const tiers: Tier[] = [1, 2, 3, 4]
const tierCounts = tiers.map((tier) => `${tier}:${bank.byTier(tier).length}`).join('  ')

const crossFits = new Map<string, string[]>()
for (const category of CATEGORIES) {
  for (const word of category.words) {
    const others = CATEGORIES.filter((other) => other.id !== category.id && bank.fits(other, word))
    if (others.length) crossFits.set(`${word} (${category.id})`, others.map((other) => other.id))
  }
}

const cross = [...crossFits.entries()]
if (process.env.FORMAT_ONLY) {
  console.log(`categories: ${CATEGORIES.length}   tiers ${tierCounts}`)
  if (process.env.CROSS) for (const [word, others] of cross) console.log(`  ${word} → ${others.join(', ')}`)
  for (const warning of warnings) console.log(`warn  ${warning}`)
  for (const error of errors) console.log(`ERROR ${error}`)
  console.log(errors.length ? `\n${errors.length} errors` : '\nFORMAT OK')
  process.exit(errors.length ? 1 : 0)
}

const generator = new PuzzleGenerator(bank)
const levels = new LevelPuzzleSource(bank, generator, new LevelSchedule())
const daily = new DailyPuzzleSource(bank, generator)
const usage = new Map<string, number>()
const decoyHistogram = new Map<number, number>()
let generated = 0
const started = Date.now()

const record = (label: string, build: () => ReturnType<typeof levels.get>): void => {
  try {
    const puzzle = build()
    generated++
    decoyHistogram.set(puzzle.decoys, (decoyHistogram.get(puzzle.decoys) ?? 0) + 1)
    for (const group of puzzle.groups) usage.set(group.categoryId, (usage.get(group.categoryId) ?? 0) + 1)
  } catch (error) {
    errors.push(`${label}: ${(error as Error).message}`)
  }
}

for (let level = 1; level <= LEVELS; level++) record(`level ${level}`, () => levels.get(level))
const NEAR = 3
let nearRepeats = 0
for (let level = 1; level <= LEVELS; level++) {
  const ids = new Set(levels.get(level).groups.map((group) => group.categoryId))
  for (let next = level + 1; next <= Math.min(LEVELS, level + NEAR); next++) {
    for (const group of levels.get(next).groups) if (ids.has(group.categoryId)) nearRepeats++
  }
}
const seeds = new DailySeed({ prefix: 'quartet', epochIsoDate: '2026-09-01' })
for (let day = 0; day < DAYS; day++) {
  const date = new Date(Date.UTC(2026, 8, 1 + day))
  record(`daily ${seeds.isoDate(date)}`, () => daily.get(seeds.seedFor(date)))
}
const elapsed = Date.now() - started

const unused = CATEGORIES.filter((category) => !usage.has(category.id)).map((category) => category.id)

console.log(`categories: ${CATEGORIES.length}   tiers ${tierCounts}`)
console.log(`generated ${generated} puzzles in ${elapsed} ms`)
console.log(`category repeats within ${NEAR} levels: ${nearRepeats}`)
console.log(
  `decoys: ${[...decoyHistogram.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([count, times]) => `${count}→${times}`)
    .join('  ')}`,
)
if (unused.length) console.log(`never used: ${unused.join(', ')}`)
if (process.env.CROSS) {
  console.log(`\ncross-fits (${crossFits.size}):`)
  for (const [word, others] of crossFits) console.log(`  ${word} → ${others.join(', ')}`)
}
if (process.env.SAMPLE) {
  for (let level = 1; level <= Number(process.env.SAMPLE); level++) {
    const puzzle = levels.get(level)
    console.log(`\nlevel ${level} (decoys ${puzzle.decoys})`)
    for (const group of puzzle.groups)
      console.log(`  ${group.color.padEnd(6)} ${group.title}: ${group.words.join(', ')}`)
  }
}
for (const warning of warnings) console.log(`warn  ${warning}`)
for (const error of errors) console.log(`ERROR ${error}`)
console.log(errors.length ? `\n${errors.length} errors` : '\nOK')
process.exit(errors.length ? 1 : 0)
