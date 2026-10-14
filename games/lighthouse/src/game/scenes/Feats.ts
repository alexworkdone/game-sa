import type { Achievements } from '../systems/Achievements.js'
import type { AchievementToast } from '../ui/AchievementToast.js'

export interface Feats {
  readonly achievements: Achievements
  readonly toast: AchievementToast
}
