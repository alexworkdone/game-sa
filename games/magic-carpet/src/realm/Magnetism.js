import { wrapDelta } from '../core/math.js'
import { manaRadius } from './ManaField.js'

export class Magnetism {
  #mana
  #ground
  #config
  #hover
  #sizeScale
  #size
  pulls = []

  constructor({ mana, ground, config, hover, sizeScale, worldSize }) {
    this.#mana = mana
    this.#ground = ground
    this.#config = config
    this.#hover = hover
    this.#sizeScale = sizeScale
    this.#size = worldSize
  }

  get radius() {
    return this.#config.radius
  }

  pearlNear(x, y, z, reach) {
    const mana = this.#mana
    let best = -1
    let bestGap = reach
    for (let i = 0; i < mana.capacity; i++) {
      if (!mana.isFree(i)) continue
      const distance = Math.hypot(wrapDelta(mana.x[i] - x, this.#size), wrapDelta(mana.y[i] - y, this.#size), mana.z[i] - z)
      const gap = distance - manaRadius(mana.value[i], this.#sizeScale)
      if (gap < bestGap) {
        bestGap = gap
        best = i
      }
    }
    return best
  }

  attract(target) {
    const mana = this.#mana
    const radius = this.#config.radius
    const busy = new Set(this.pulls.flatMap((pull) => [pull.target, ...pull.members]))
    const members = []
    for (let i = 0; i < mana.capacity; i++) {
      if (i === target || !mana.isFree(i) || busy.has(i) || mana.value[i] > mana.value[target]) continue
      const distance = Math.hypot(wrapDelta(mana.x[i] - mana.x[target], this.#size), wrapDelta(mana.y[i] - mana.y[target], this.#size))
      if (distance <= radius) members.push(i)
    }
    this.pulls.push({ target, members, speeds: members.map(() => 0), age: 0, x: mana.x[target], y: mana.y[target], z: mana.z[target] })
    return members.length
  }

  update(dt) {
    const mana = this.#mana
    const config = this.#config
    for (const pull of this.pulls) {
      pull.age += dt
      const target = pull.target
      if (!mana.isFree(target)) {
        pull.members.length = 0
        continue
      }
      pull.x = mana.x[target]
      pull.y = mana.y[target]
      pull.z = mana.z[target]
      for (let k = pull.members.length - 1; k >= 0; k--) {
        const i = pull.members[k]
        if (!mana.isFree(i)) {
          pull.members.splice(k, 1)
          pull.speeds.splice(k, 1)
          continue
        }
        const dx = wrapDelta(mana.x[target] - mana.x[i], this.#size)
        const dy = wrapDelta(mana.y[target] - mana.y[i], this.#size)
        const dz = mana.z[target] - mana.z[i]
        const distance = Math.hypot(dx, dy, dz)
        const contact = manaRadius(mana.value[target], this.#sizeScale) + manaRadius(mana.value[i], this.#sizeScale)
        if (distance <= contact) {
          mana.merge(target, i)
          this.#rest(target)
          pull.members.splice(k, 1)
          pull.speeds.splice(k, 1)
          continue
        }
        pull.speeds[k] = Math.min(config.maxSpeed, pull.speeds[k] + config.pull * dt)
        const step = Math.min(distance - contact * 0.5, pull.speeds[k] * dt) / distance
        mana.x[i] = (((mana.x[i] + dx * step) % this.#size) + this.#size) % this.#size
        mana.y[i] = (((mana.y[i] + dy * step) % this.#size) + this.#size) % this.#size
        const floor = this.#ground.groundAt(mana.x[i], mana.y[i]) + this.#hover + manaRadius(mana.value[i], this.#sizeScale)
        mana.z[i] = Math.max(floor, mana.z[i] + dz * step)
      }
    }
    this.pulls = this.pulls.filter((pull) => pull.members.length > 0 || pull.age < config.ring)
  }

  #rest(target) {
    const mana = this.#mana
    const floor = this.#ground.groundAt(mana.x[target], mana.y[target]) + this.#hover + manaRadius(mana.value[target], this.#sizeScale)
    mana.z[target] = Math.max(mana.z[target], floor)
  }
}
