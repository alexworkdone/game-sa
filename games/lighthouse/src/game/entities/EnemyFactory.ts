import { BALANCE, enemyHpScale, enemySpeedScale, guardianHp } from '../config/balance.js'
import { tierGuardianScale } from '../config/tiers.js'
import type { EnemyKind } from '../level/LevelBlueprint.js'
import { Crab } from './Crab.js'
import type { CarrierLoot, Enemy, EnemyDef } from './Enemy.js'
import { Guardian } from './Guardian.js'
import { Jelly } from './Jelly.js'
import { Octopus } from './Octopus.js'
import { Urchin } from './Urchin.js'

export interface IEnemyFactory {
  create(kind: EnemyKind, floor: number, tier?: number): Enemy
  createCarrier(loot: CarrierLoot, floor: number, lootValue: number): Enemy
}

const LEVEL_TWO_TIER = 2

const tough = (def: EnemyDef, floor: number): EnemyDef => ({ ...def, hp: Math.ceil(def.hp * enemyHpScale(floor)) })

export class EnemyFactory implements IEnemyFactory {
  create(kind: EnemyKind, floor: number, tier = 1): Enemy {
    const scale = enemySpeedScale(floor)
    const levelTwo = tier >= LEVEL_TWO_TIER
    switch (kind) {
      case 'crab':
        return new Crab(tough(BALANCE.enemies.crab, floor), scale)
      case 'jelly':
        return new Jelly(tough(BALANCE.enemies.jelly, floor), scale, levelTwo)
      case 'octopus':
        return new Octopus(tough(BALANCE.enemies.octopus, floor), scale, levelTwo)
      case 'urchin':
        return new Urchin(tough(BALANCE.enemies.urchin, floor), scale)
      case 'guardian':
        return new Guardian(
          { ...BALANCE.enemies.guardian, hp: Math.round(guardianHp(floor) * tierGuardianScale(tier)) },
          floor,
        )
    }
  }

  createCarrier(loot: CarrierLoot, floor: number, lootValue: number): Enemy {
    const scale = enemySpeedScale(floor)
    if (loot === 'shell') {
      return new Crab(tough(BALANCE.bigCrab, floor), scale, { big: true, loot, lootValue })
    }
    const def = BALANCE.enemies.crab
    const carrier = { ...def, hp: def.hp + BALANCE.keyCrab.hpBonus }
    return new Crab(tough(carrier, floor), scale * BALANCE.keyCrab.speedBoost, { loot, lootValue })
  }
}
