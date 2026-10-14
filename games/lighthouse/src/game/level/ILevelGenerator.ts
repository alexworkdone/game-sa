import type { IRandom } from '@sa/core'
import type { LevelBlueprint } from './LevelBlueprint.js'

export interface ILevelGenerator {
  generate(floor: number, random: IRandom): LevelBlueprint
}
