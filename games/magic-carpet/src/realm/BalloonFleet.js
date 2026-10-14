import { damp, mod, wrapDelta } from '../core/math.js'
import { PLAYER } from './ManaField.js'

const HOME = 0
const OUTBOUND = 1
const INBOUND = 2

export class BalloonFleet {
  #config
  #mana
  #ground
  #size
  balloons = []

  constructor(config, mana, ground, worldSize) {
    this.#config = config
    this.#mana = mana
    this.#ground = ground
    this.#size = worldSize
  }

  update(dt, castle) {
    if (!castle || castle.rising) return
    const wanted = this.#config.perLevel[castle.level] ?? 0
    while (this.balloons.length < wanted) this.balloons.push(this.#launch(castle, this.balloons.length))
    for (const balloon of this.balloons) this.#steer(balloon, castle, dt)
  }

  #launch(castle, index) {
    const angle = index * 2.1
    return {
      x: castle.x + Math.cos(angle) * 8,
      y: castle.y + Math.sin(angle) * 8,
      z: castle.plateau + 34,
      state: HOME,
      target: -1,
      cargo: 0,
      sway: index * 1.7,
    }
  }

  #steer(balloon, castle, dt) {
    const mana = this.#mana
    if (balloon.state === HOME) {
      const target = mana.nearest(balloon.x, balloon.y, balloon.z, Infinity, (i) => mana.owner[i] === PLAYER && !mana.reserved[i])
      if (target >= 0) {
        mana.reserved[target] = 1
        balloon.target = target
        balloon.state = OUTBOUND
      } else {
        this.#fly(balloon, castle.x, castle.y, castle.plateau + 34, dt, 0.4)
      }
      return
    }

    if (balloon.state === OUTBOUND) {
      const target = balloon.target
      if (!mana.isFree(target) || mana.owner[target] !== PLAYER) {
        balloon.state = HOME
        return
      }
      const arrived = this.#fly(balloon, mana.x[target], mana.y[target], mana.z[target] + 4, dt, 1)
      if (arrived) {
        balloon.cargo = mana.collect(target)
        balloon.state = INBOUND
      }
      return
    }

    const arrived = this.#fly(balloon, castle.x, castle.y, castle.plateau + 36, dt, 1)
    if (arrived) {
      castle.mana += balloon.cargo
      balloon.cargo = 0
      balloon.state = HOME
    }
  }

  #fly(balloon, x, y, z, dt, pace) {
    const config = this.#config
    const dx = wrapDelta(x - balloon.x, this.#size)
    const dy = wrapDelta(y - balloon.y, this.#size)
    const distance = Math.hypot(dx, dy)
    const step = Math.min(distance, config.speed * pace * dt)
    if (distance > 1e-3) {
      balloon.x = mod(balloon.x + (dx / distance) * step, this.#size)
      balloon.y = mod(balloon.y + (dy / distance) * step, this.#size)
    }
    const cruise = this.#ground.groundAt(balloon.x, balloon.y) + config.cruise
    const height = distance > 24 ? Math.max(cruise, z) : z
    balloon.z = damp(balloon.z, Math.max(height, this.#ground.groundAt(balloon.x, balloon.y) + 6), 1.6, dt)
    return distance < config.pickupRange && Math.abs(balloon.z - z) < 3
  }
}
