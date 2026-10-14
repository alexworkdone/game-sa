import { mod } from '../core/math.js'

const impact = (ground, x, y, z, dx, dy, dz) => {
  let low = 0
  let high = 1
  for (let k = 0; k < 8; k++) {
    const t = (low + high) / 2
    if (z + dz * t <= ground.groundAt(x + dx * t, y + dy * t)) high = t
    else low = t
  }
  return low
}

export const FLYING = 1
export const BURSTING = 2

export class ProjectilePool {
  #worldSize
  #burstTime

  constructor(size, worldSize, burstTime) {
    this.capacity = size
    this.#worldSize = worldSize
    this.#burstTime = burstTime
    this.state = new Uint8Array(size)
    this.spell = new Uint8Array(size)
    this.x = new Float32Array(size)
    this.y = new Float32Array(size)
    this.z = new Float32Array(size)
    this.vx = new Float32Array(size)
    this.vy = new Float32Array(size)
    this.vz = new Float32Array(size)
    this.age = new Float32Array(size)
    this.life = new Float32Array(size)
  }

  get burstTime() {
    return this.#burstTime
  }

  spawn(spell, life, x, y, z, vx, vy, vz) {
    const slot = this.state.indexOf(0)
    if (slot < 0) return -1
    this.state[slot] = FLYING
    this.spell[slot] = spell
    this.x[slot] = x
    this.y[slot] = y
    this.z[slot] = z
    this.vx[slot] = vx
    this.vy[slot] = vy
    this.vz[slot] = vz
    this.age[slot] = 0
    this.life[slot] = life
    return slot
  }

  update(dt, ground, hooks) {
    const size = this.#worldSize
    for (let i = 0; i < this.capacity; i++) {
      const state = this.state[i]
      if (state === 0) continue
      this.age[i] += dt
      if (state === BURSTING) {
        if (this.age[i] >= this.#burstTime) this.state[i] = 0
        continue
      }
      hooks.guide?.(this, i, dt)
      const x = this.x[i]
      const y = this.y[i]
      const z = this.z[i]
      const stepX = this.vx[i] * dt
      const stepY = this.vy[i] * dt
      const stepZ = this.vz[i] * dt
      if (z + stepZ <= ground.groundAt(x + stepX, y + stepY)) {
        const t = impact(ground, x, y, z, stepX, stepY, stepZ)
        this.x[i] = mod(x + stepX * t, size)
        this.y[i] = mod(y + stepY * t, size)
        this.z[i] = z + stepZ * t
        this.#burst(i)
        hooks.impact(this.spell[i], this.x[i], this.y[i], this.z[i])
        continue
      }
      this.x[i] = mod(x + stepX, size)
      this.y[i] = mod(y + stepY, size)
      this.z[i] = z + stepZ
      if (hooks.touch(this.spell[i], this.x[i], this.y[i], this.z[i])) {
        this.#burst(i)
        continue
      }
      if (this.age[i] >= this.life[i]) this.#burst(i)
    }
  }

  #burst(i) {
    this.state[i] = BURSTING
    this.age[i] = 0
  }
}
