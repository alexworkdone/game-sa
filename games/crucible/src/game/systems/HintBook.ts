import { RECIPES } from '../data/recipes.js'
import type { ElementId } from '../data/elements.js'
import type { Discovery } from './Discovery.js'
import type { Settings } from './Settings.js'

export class HintBook {
  private target: ElementId | null = null

  get pending(): ElementId | null {
    return this.target
  }

  text(settings: Settings): string | null {
    return this.target ? settings.hint(this.target) : null
  }

  pick(discovery: Discovery, settings: Settings): boolean {
    if (this.target) return false
    const candidate = RECIPES.find(
      (recipe) =>
        !discovery.has(recipe.output) &&
        settings.hint(recipe.output) !== null &&
        recipe.inputs.every((id) => discovery.has(id)),
    )
    if (!candidate) return false
    this.target = candidate.output
    return true
  }

  resolve(id: ElementId): boolean {
    if (this.target !== id) return false
    this.target = null
    return true
  }

  reset(): void {
    this.target = null
  }
}
