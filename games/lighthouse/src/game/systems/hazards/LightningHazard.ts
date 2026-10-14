import { BALANCE } from '../../config/balance.js'
import { ringDelta } from '../../level/Ring.js'
import type { HazardHost, IHazard } from './IHazard.js'

export class LightningHazard implements IHazard {
  warning = false
  x = 0
  timer: number = BALANCE.lightning.intervalMin
  flash = 0
  strikeX = 0

  get warnProgress(): number {
    return this.warning ? 1 - this.timer / BALANCE.lightning.telegraph : 0
  }

  update(dt: number, host: HazardHost): void {
    const config = BALANCE.lightning
    this.flash = Math.max(0, this.flash - dt)
    if (!host.active) {
      this.warning = false
      return
    }
    this.timer -= dt
    if (this.timer > 0) return
    if (!this.warning) {
      const map = host.map
      const col = map.colAt(host.hero.x) + host.random.int(-config.aimSpread, config.aimSpread + 1)
      this.x = map.centerX(map.wrapCol(col))
      this.warning = true
      this.timer = config.telegraph
      host.listener.onLightningWarn(this.x)
      return
    }
    this.strike(host)
    this.warning = false
    this.timer = host.random.float(config.intervalMin, config.intervalMax)
  }

  private strike(host: HazardHost): void {
    const config = BALANCE.lightning
    const width = host.map.width
    this.flash = config.flash
    this.strikeX = this.x
    host.listener.onLightningStrike(this.x)
    const hero = host.hero
    if (hero.alive && Math.abs(ringDelta(this.x, hero.x, width)) < config.width / 2 + hero.width / 2 - 4) {
      if (host.powerUps.active('rod')) host.listener.onShieldBlock()
      else host.hurtHero('lightning')
    }
    for (const enemy of host.enemies) {
      if (!enemy.alive || !enemy.canBeHit) continue
      if (Math.abs(ringDelta(this.x, enemy.x, width)) < config.width / 2 + enemy.width / 2) {
        host.hurtEnemy(enemy, config.enemyDamage)
      }
    }
  }
}
