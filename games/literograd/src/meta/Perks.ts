import { FEATURE_REQUIREMENTS, buildingSpec } from '../content/buildings.js'
import type { Feature } from '../content/buildings.js'
import { UK } from '../i18n/uk.js'
import type { City } from './City.js'

const BASE_ROUND_SECONDS = 45
const SECONDS_PER_CLOCK_LEVEL = 5
const COMBO_CAPS: readonly number[] = [2, 2.5, 3, 4]
const MILL_BONUS_PER_LEVEL = 0.2
const BOOK_BONUS = 0.25

export class Perks {
  private readonly city: City

  constructor(city: City) {
    this.city = city
  }

  get roundSeconds(): number {
    return BASE_ROUND_SECONDS + SECONDS_PER_CLOCK_LEVEL * this.city.level('clock')
  }

  get comboCap(): number {
    return COMBO_CAPS[this.city.level('fountain')] ?? 2
  }

  get hints(): number {
    return this.city.level('lighthouse')
  }

  get millLevel(): number {
    return this.city.level('mill')
  }

  get millBonus(): number {
    return MILL_BONUS_PER_LEVEL * this.millLevel
  }

  get booksDone(): number {
    return this.city.book - 1
  }

  get bookBonus(): number {
    return BOOK_BONUS * this.booksDone
  }

  has(feature: Feature): boolean {
    const requirement = FEATURE_REQUIREMENTS[feature]
    return this.city.level(requirement.building) >= requirement.level
  }

  requirementLabel(feature: Feature): string {
    const requirement = FEATURE_REQUIREMENTS[feature]
    return UK.play.requirement(buildingSpec(requirement.building).name, requirement.level)
  }
}
