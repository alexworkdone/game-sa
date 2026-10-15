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

  update(dt, castle, waiting) {
    if (!castle || castle.rising) return
    const config = this.#config
    const wanted = config.perLevel[castle.level] ?? 0
    while (this.balloons.length < wanted) this.balloons.push(this.#launch(castle, this.balloons.length))
    for (const balloon of this.balloons) {
      balloon.capacity = config.capacity[castle.level] ?? balloon.capacity
      this.#steer(balloon, castle, waiting, dt)
    }
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
      capacity: this.#config.capacity[castle.level] ?? 50,
      sway: index * 1.7,
    }
  }

  #claim(balloon, range) {
    const mana = this.#mana
    const target = mana.nearest(balloon.x, balloon.y, balloon.z, range, (i) => mana.owner[i] === PLAYER && !mana.reserved[i])
    if (target < 0) return false
    mana.reserved[target] = 1
    balloon.target = target
    balloon.state = OUTBOUND
    return true
  }

  #returnHome(balloon) {
    balloon.target = -1
    balloon.state = balloon.cargo > 0 ? INBOUND : HOME
  }

  #steer(balloon, castle, waiting, dt) {
    const mana = this.#mana
    if (balloon.state === HOME) {
      if (waiting || !this.#claim(balloon, Infinity)) this.#hover(balloon, castle, dt)
      return
    }

    if (balloon.state === OUTBOUND) {
      const target = balloon.target
      if (waiting) {
        mana.reserved[target] = 0
        this.#returnHome(balloon)
        return
      }
      if (!mana.isFree(target) || mana.owner[target] !== PLAYER) {
        if (!this.#claim(balloon, this.#config.detour)) this.#returnHome(balloon)
        return
      }
      const arrived = this.#fly(balloon, mana.x[target], mana.y[target], mana.z[target] + 4, dt, 1)
      if (!arrived) return
      balloon.cargo += mana.drain(target, balloon.capacity - balloon.cargo)
      mana.reserved[target] = 0
      const full = balloon.cargo >= balloon.capacity - 0.5
      if (full || !this.#claim(balloon, this.#config.detour)) this.#returnHome(balloon)
      return
    }

    const arrived = this.#fly(balloon, castle.x, castle.y, castle.plateau + 36, dt, 1)
    if (arrived) {
      castle.mana += balloon.cargo
      balloon.cargo = 0
      balloon.state = HOME
    }
  }

  #hover(balloon, castle, dt) {
    const reach = this.#config.hoverRing
    const x = castle.x + Math.cos(balloon.sway) * reach
    const y = castle.y + Math.sin(balloon.sway) * reach
    this.#fly(balloon, x, y, castle.plateau + 34, dt, 0.4)
  }

  #fly(balloon, x, y, z, dt, pace) {
    const config = this.#config
    const dx = wrapDelta(x - balloon.x, this.#size)
    const dy = wrapDelta(y - balloon.y, this.#size)
    const distance = Math.hypot(dx, dy)
    const load = 1 - 0.3 * (balloon.cargo / balloon.capacity)
    const step = Math.min(distance, config.speed * pace * load * dt)
    if (distance > 1e-3) {
      balloon.x = mod(balloon.x + (dx / distance) * step, this.#size)
      balloon.y = mod(balloon.y + (dy / distance) * step, this.#size)
    }
    const ground = this.#ground.groundAt(balloon.x, balloon.y)
    const lowest = ground + 6
    const goal = Math.max(distance > 24 ? Math.max(ground + config.cruise, z) : z, lowest)
    balloon.z = damp(balloon.z, goal, 1.6, dt)
    return distance < config.pickupRange && Math.abs(balloon.z - Math.max(z, lowest)) < 3
  }
}
