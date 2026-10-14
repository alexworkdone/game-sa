import { BALANCE } from '../config/balance.js'
import { upgradeValue } from '../config/upgrades.js'
import type { UpgradeId } from '../config/upgrades.js'
import type { GunStats } from '../entities/Gun.js'

export type UpgradeLevels = Readonly<Record<UpgradeId, number>>

export interface HeroStats {
  readonly maxHp: number
  readonly speedScale: number
  readonly magnet: number
  readonly waterTimeScale: number
  readonly maxAir: number
  readonly gun: GunStats
}

export const resolveStats = (levels: UpgradeLevels): HeroStats => ({
  maxHp: Math.max(BALANCE.hero.baseHp, upgradeValue('maxHp', levels.heart)),
  speedScale: upgradeValue('speed', levels.boots),
  magnet: upgradeValue('magnet', levels.magnet),
  waterTimeScale: upgradeValue('waterTime', levels.pump),
  maxAir: upgradeValue('air', levels.lungs),
  gun: {
    damage: upgradeValue('damage', levels.caliber),
    cooldown: upgradeValue('cooldown', levels.trigger),
    magazine: upgradeValue('magazine', levels.drum),
    reload: upgradeValue('reload', levels.drum),
    volley: upgradeValue('volley', levels.volley),
  },
})
