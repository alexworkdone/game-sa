import type { IRandom } from '@sa/core'
import { BALANCE } from './balance.js'

export type FloorVariant = 'dark' | 'keyCrab'

export interface VariantDef {
  readonly id: FloorVariant
  readonly title: string
  readonly hint: string
  readonly weight: number
  readonly fromFloor: number
}

export const FLOOR_VARIANTS: readonly VariantDef[] = [
  { id: 'keyCrab', title: 'Краб-ключник', hint: 'Один ключ несе прудкий краб — збий його', weight: 3, fromFloor: 3 },
  { id: 'dark', title: 'Темний поверх', hint: 'Світла мало — ключі мерехтять у темряві', weight: 2, fromFloor: 4 },
]

export const variantDef = (id: FloorVariant): VariantDef =>
  FLOOR_VARIANTS.find((def) => def.id === id) as VariantDef

export const pickVariant = (floor: number, guardian: boolean, random: IRandom): FloorVariant | null => {
  if (guardian || floor < BALANCE.variants.fromFloor || !random.bool(BALANCE.variants.chance)) return null
  const options = FLOOR_VARIANTS.filter((def) => floor >= def.fromFloor).map((def) => ({ value: def.id, weight: def.weight }))
  return options.length > 0 ? random.weighted(options) : null
}
