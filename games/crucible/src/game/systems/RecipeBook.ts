import { RECIPES } from '../data/recipes.js'
import type { RecipeDef } from '../data/recipes.js'
import type { ElementId } from '../data/elements.js'

const keyOf = (ids: readonly ElementId[]): string => [...ids].sort().join('+')

export class RecipeBook {
  private readonly byKey = new Map<string, ElementId>()
  private readonly byOutput = new Map<ElementId, readonly ElementId[]>()
  private readonly sortedInputs: string[][] = []

  private readonly usage = new Map<ElementId, number>()
  private readonly depths = new Map<ElementId, number>()

  readonly maxInputs: number

  constructor(recipes: readonly RecipeDef[] = RECIPES) {
    let longest = 2
    for (const recipe of recipes) {
      this.byKey.set(keyOf(recipe.inputs), recipe.output)
      this.byOutput.set(recipe.output, recipe.inputs)
      this.sortedInputs.push([...recipe.inputs].sort())
      longest = Math.max(longest, recipe.inputs.length)
      for (const input of recipe.inputs) {
        this.usage.set(input, (this.usage.get(input) ?? 0) + 1)
      }
    }
    this.maxInputs = longest
    for (const recipe of recipes) this.depthOf(recipe.output)
  }

  craftableNow(has: (id: ElementId) => boolean): ElementId[] {
    const out: ElementId[] = []
    for (const [output, inputs] of this.byOutput) {
      if (has(output) || out.includes(output)) continue
      if (inputs.every((id) => has(id))) out.push(output)
    }
    return out
  }

  usageOf(id: ElementId): number {
    return this.usage.get(id) ?? 0
  }

  depthOf(id: ElementId, guard = new Set<ElementId>()): number {
    const known = this.depths.get(id)
    if (known !== undefined) return known
    const inputs = this.byOutput.get(id)
    if (!inputs || guard.has(id)) {
      this.depths.set(id, 0)
      return 0
    }
    guard.add(id)
    let deepest = 0
    for (const input of inputs) deepest = Math.max(deepest, this.depthOf(input, guard))
    guard.delete(id)
    const depth = deepest + 1
    this.depths.set(id, depth)
    return depth
  }

  resolve(ids: readonly ElementId[]): ElementId | null {
    if (ids.length < 2) return null
    return this.byKey.get(keyOf(ids)) ?? null
  }

  inputsOf(output: ElementId): readonly ElementId[] | null {
    return this.byOutput.get(output) ?? null
  }

  canExtend(ids: readonly ElementId[]): boolean {
    if (ids.length >= this.maxInputs) return false
    const partial = [...ids].sort()
    return this.sortedInputs.some((inputs) => RecipeBook.contains(inputs, partial))
  }

  private static contains(inputs: readonly string[], partial: readonly string[]): boolean {
    if (partial.length >= inputs.length) return false
    const pool = [...inputs]
    for (const id of partial) {
      const index = pool.indexOf(id)
      if (index < 0) return false
      pool.splice(index, 1)
    }
    return true
  }
}
