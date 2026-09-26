import type { ElementId } from './elements.js'

export interface RecipeDef {
  readonly inputs: readonly ElementId[]
  readonly output: ElementId
}

export const RECIPES: readonly RecipeDef[] = [
  { inputs: ['water', 'fire'], output: 'steam' },
  { inputs: ['water', 'earth'], output: 'swamp' },
  { inputs: ['earth', 'air'], output: 'dust' },
  { inputs: ['fire', 'earth'], output: 'lava' },
  { inputs: ['fire', 'air'], output: 'energy' },
  { inputs: ['water', 'water'], output: 'sea' },
  { inputs: ['lava', 'air'], output: 'stone' },
  { inputs: ['steam', 'air'], output: 'cloud' },
  { inputs: ['fire', 'dust'], output: 'smoke' },
  { inputs: ['stone', 'water'], output: 'sand' },
  { inputs: ['cloud', 'water'], output: 'rain' },
  { inputs: ['lava', 'water'], output: 'obsidian' },
  { inputs: ['sand', 'fire'], output: 'glass' },
  { inputs: ['sand', 'sea'], output: 'beach' },
  { inputs: ['swamp', 'energy'], output: 'life' },
  { inputs: ['life', 'earth'], output: 'plant' },
  { inputs: ['plant', 'rain'], output: 'tree' },
  { inputs: ['cloud', 'water', 'energy'], output: 'storm' },
  { inputs: ['stone', 'lava', 'smoke'], output: 'volcano' },
  { inputs: ['rain', 'glass', 'energy'], output: 'rainbow' },
]
