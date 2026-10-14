import type { CategoryData } from '../CategoryData.js'
import { TIER1 } from './tier1.js'
import { TIER2 } from './tier2.js'
import { TIER3 } from './tier3.js'
import { TIER4 } from './tier4.js'

export const CATEGORIES: readonly CategoryData[] = [...TIER1, ...TIER2, ...TIER3, ...TIER4]
