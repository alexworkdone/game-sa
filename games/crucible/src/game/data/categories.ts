import type { ElementId } from './elements.js'

export type CategoryId =
  | 'base'
  | 'sky'
  | 'water'
  | 'depths'
  | 'stone'
  | 'life'
  | 'people'
  | 'craft'
  | 'machine'
  | 'space'
  | 'myth'

export interface CategoryDef {
  readonly id: CategoryId
  readonly label: string
  readonly icon: ElementId
}

export const CATEGORIES: readonly CategoryDef[] = [
  { id: 'base', label: 'Стихії', icon: 'fire' },
  { id: 'sky', label: 'Небо', icon: 'cloud' },
  { id: 'water', label: 'Вода', icon: 'sea' },
  { id: 'depths', label: 'Надра', icon: 'lava' },
  { id: 'stone', label: 'Камінь', icon: 'stone' },
  { id: 'life', label: 'Живе', icon: 'plant' },
  { id: 'people', label: 'Люди', icon: 'human' },
  { id: 'craft', label: 'Ремесло', icon: 'book' },
  { id: 'machine', label: 'Машини', icon: 'robot' },
  { id: 'space', label: 'Космос', icon: 'star' },
  { id: 'myth', label: 'Міфи', icon: 'dragon' },
]
