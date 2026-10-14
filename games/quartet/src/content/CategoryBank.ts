import type { CategoryData, Tier } from './CategoryData.js'
import { matchesRule, normalizeWord } from './WordRules.js'

export interface ICategoryBank {
  readonly all: readonly CategoryData[]
  byId(id: string): CategoryData | undefined
  byTier(tier: Tier): readonly CategoryData[]
  fits(category: CategoryData, word: string): boolean
}

export class CategoryBank implements ICategoryBank {
  readonly all: readonly CategoryData[]

  private readonly index = new Map<string, CategoryData>()
  private readonly tiers = new Map<Tier, CategoryData[]>()
  private readonly members = new Map<string, ReadonlySet<string>>()

  constructor(categories: readonly CategoryData[]) {
    this.all = categories
    for (const category of categories) {
      this.index.set(category.id, category)
      const bucket = this.tiers.get(category.tier) ?? []
      bucket.push(category)
      this.tiers.set(category.tier, bucket)
      this.members.set(
        category.id,
        new Set([...category.words, ...(category.accepts ?? [])].map(normalizeWord)),
      )
    }
  }

  byId(id: string): CategoryData | undefined {
    return this.index.get(id)
  }

  byTier(tier: Tier): readonly CategoryData[] {
    return this.tiers.get(tier) ?? []
  }

  fits(category: CategoryData, word: string): boolean {
    if (this.members.get(category.id)?.has(normalizeWord(word))) return true
    return category.rule ? matchesRule(category.rule, word) : false
  }
}
