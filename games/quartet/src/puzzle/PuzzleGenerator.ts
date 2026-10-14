import { SeededRandom } from '@sa/core'
import type { IRandom } from '@sa/core'
import type { CategoryData } from '../content/CategoryData.js'
import type { ICategoryBank } from '../content/CategoryBank.js'
import { normalizeWord } from '../content/WordRules.js'
import { PARTICLE_COLORS } from '../shared/ParticleColor.js'
import { PartitionSolver } from './PartitionSolver.js'
import type { IPuzzleGenerator, Puzzle, PuzzleGroup, PuzzleRequest } from './Puzzle.js'

const GROUP_SIZE = 4
const CATEGORY_ATTEMPTS = 80
const WORD_ATTEMPTS = 30
const DECOY_SEARCH = 12
const NEIGHBOUR_MARGIN = 6

export class PuzzleGenerator implements IPuzzleGenerator {
  private readonly bank: ICategoryBank
  private readonly solver: PartitionSolver

  constructor(bank: ICategoryBank, solver: PartitionSolver = new PartitionSolver()) {
    this.bank = bank
    this.solver = solver
  }

  generate(request: PuzzleRequest): Puzzle | null {
    const random = new SeededRandom(request.seed)
    let fallback: Puzzle | null = null
    for (let attempt = 0; attempt < CATEGORY_ATTEMPTS; attempt++) {
      if (fallback && attempt >= DECOY_SEARCH) return fallback
      const categories = this.pickCategories(request.slots, attempt, random)
      if (!categories) continue
      for (let sample = 0; sample < WORD_ATTEMPTS; sample++) {
        const biased = request.decoys.min > 0 && sample % 2 === 0
        const puzzle = this.tryWords(request, categories, random, biased)
        if (!puzzle) continue
        if (puzzle.decoys >= request.decoys.min) return puzzle
        fallback ??= puzzle
      }
    }
    return fallback
  }

  private candidateOffsets(length: number, attempt: number, random: IRandom): number[] {
    if (attempt === 0) return [0]
    const margin = Math.min(NEIGHBOUR_MARGIN, Math.floor(length / 4))
    const far = random.shuffle(
      Array.from({ length: Math.max(0, length - margin * 2) }, (_, index) => index + margin),
    )
    return [0, ...far].slice(0, Math.min(length, 1 + attempt))
  }

  private pickCategories(
    slots: readonly (readonly string[])[],
    attempt: number,
    random: IRandom,
  ): CategoryData[] | null {
    const chosen: CategoryData[] = []
    const families = new Set<string>()
    for (const slot of slots) {
      const offsets = random.shuffle(this.candidateOffsets(slot.length, attempt, random))
      const picked = offsets
        .map((offset) => this.bank.byId(slot[offset] ?? ''))
        .find(
          (category): category is CategoryData =>
            category !== undefined &&
            !families.has(category.family) &&
            !chosen.some((other) => other.id === category.id),
        )
      if (!picked) return null
      chosen.push(picked)
      families.add(picked.family)
    }
    return chosen
  }

  private tryWords(
    request: PuzzleRequest,
    categories: readonly CategoryData[],
    random: IRandom,
    biased: boolean,
  ): Puzzle | null {
    const used = new Set<string>()
    const wantsClean = request.decoys.max === 0
    const picks: string[][] = []

    for (const category of categories) {
      const pool = random
        .shuffle([...new Set(category.words.map(normalizeWord))])
        .filter((word) => !used.has(word))
      const clean = pool.filter((word) => this.crossFits(word, category, categories) === 0)
      const dirty = pool.filter((word) => !clean.includes(word))
      const source = wantsClean ? clean : biased ? [...dirty.slice(0, random.int(0, 3)), ...clean, ...dirty] : pool
      if (source.length < GROUP_SIZE) return null
      const words = source.slice(0, GROUP_SIZE)
      for (const word of words) used.add(word)
      picks.push(words)
    }

    const flat = picks.flatMap((words, group) => words.map((word) => ({ word, group })))
    const fits = flat.map(({ word }) =>
      categories.flatMap((category, index) => (this.bank.fits(category, word) ? [index] : [])),
    )
    const decoys = fits.filter((options) => options.length > 1).length
    if (decoys > request.decoys.max) return null

    const solutions = this.solver.countSolutions({
      groupCount: categories.length,
      groupSize: GROUP_SIZE,
      fits,
    })
    if (solutions !== 1) return null

    return this.assemble(request.seed, categories, picks, decoys, random)
  }

  private crossFits(
    word: string,
    owner: CategoryData,
    categories: readonly CategoryData[],
  ): number {
    return categories.filter((category) => category.id !== owner.id && this.bank.fits(category, word))
      .length
  }

  private assemble(
    seed: string,
    categories: readonly CategoryData[],
    picks: readonly string[][],
    decoys: number,
    random: IRandom,
  ): Puzzle {
    const ordered = categories
      .map((category, index) => ({ category, words: picks[index] ?? [] }))
      .sort((a, b) => a.category.tier - b.category.tier)
    const groups: PuzzleGroup[] = ordered.map(({ category, words }, index) => ({
      categoryId: category.id,
      title: category.title,
      tier: category.tier,
      color: PARTICLE_COLORS[index] ?? 'purple',
      words,
    }))
    const tiles = random.shuffle(groups.flatMap((group) => [...group.words]))
    return { id: seed, groups, tiles, decoys }
  }
}
