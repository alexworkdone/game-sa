import { mod, wrapDelta } from '../core/math.js'
import { SeededRandom } from '../core/SeededRandom.js'

export const WANDER = 0
export const AIM = 1
export const FALLING = 2
export const GONE = 3

export class Crowd {
  #mesh
  #config
  #size
  #random
  #onFall
  #seen = { dx: 0, dy: 0, dz: 0 }
  people = []

  constructor({ mesh, terrain, config, seed, onFall }) {
    this.#mesh = mesh
    this.#config = config
    this.#size = terrain.size
    this.#random = new SeededRandom(seed ^ 0x9e09e0)
    this.#onFall = onFall
    for (const camp of this.#camps(terrain)) {
      for (let n = 0; n < config.perCamp; n++) this.people.push(this.#person(camp, n))
    }
  }

  update(dt, carpet, shots) {
    const config = this.#config
    for (const person of this.people) {
      person.clock += dt
      if (person.state === GONE) {
        person.timer -= dt
        if (person.timer <= 0 && this.#distance(person.camp, carpet) > config.respawnDistance) this.#revive(person)
        continue
      }
      if (person.state === FALLING) {
        person.timer += dt
        if (person.timer >= config.fallTime) {
          person.state = GONE
          person.alive = false
          person.timer = config.respawn
        }
        continue
      }
      person.flash = Math.max(0, person.flash - dt)
      const dx = wrapDelta(carpet.x - person.x, this.#size)
      const dy = wrapDelta(carpet.y - person.y, this.#size)
      const reach = Math.hypot(dx, dy)
      if (reach < config.aggro) {
        person.state = AIM
        person.heading = Math.atan2(dy, dx)
        person.cooldown -= dt
        if (person.cooldown <= 0 && reach < config.range) this.#shoot(person, carpet, shots)
        continue
      }
      person.state = WANDER
      this.#walk(person, dt)
    }
  }

  hit(x, y, z, radius) {
    let struck = false
    for (const person of this.people) {
      if (!person.alive || person.state === FALLING) continue
      const distance = Math.hypot(wrapDelta(person.x - x, this.#size), wrapDelta(person.y - y, this.#size), person.z + this.#config.height * 0.5 - z)
      if (distance > radius + this.#config.hitRadius) continue
      person.state = FALLING
      person.timer = 0
      struck = true
      const [low, high] = this.#config.drop
      this.#onFall(person.x, person.y, Math.round(this.#random.range(low, high)))
    }
    return struck
  }

  findTarget(x, y, z, ux, uy, uz, range, cosCone) {
    const middle = this.#config.height * 0.5
    let best = null
    let bestScore = Infinity
    for (const person of this.people) {
      if (person.state === FALLING || person.state === GONE) continue
      const dx = wrapDelta(person.x - x, this.#size)
      const dy = wrapDelta(person.y - y, this.#size)
      const dz = person.z + middle - z
      const distance = Math.hypot(dx, dy, dz)
      if (distance > range || distance < 1e-3) continue
      const facing = (dx * ux + dy * uy + dz * uz) / distance
      if (facing < cosCone) continue
      const score = distance * (2 - facing)
      if (score < bestScore) {
        bestScore = score
        best = person
      }
    }
    if (!best) return null
    this.#seen.dx = wrapDelta(best.x - x, this.#size)
    this.#seen.dy = wrapDelta(best.y - y, this.#size)
    this.#seen.dz = best.z + middle - z
    return this.#seen
  }

  #shoot(person, carpet, shots) {
    const config = this.#config
    const random = this.#random
    const shot = shots.spell
    const sx = person.x
    const sy = person.y
    const sz = person.z + config.height * 0.85
    let tx = wrapDelta(carpet.x - sx, this.#size)
    let ty = wrapDelta(carpet.y - sy, this.#size)
    let tz = carpet.z - sz
    const travel = Math.hypot(tx, ty, tz) / shot.speed
    tx += carpet.vx * travel * config.lead
    ty += carpet.vy * travel * config.lead
    tz += carpet.vz * travel * config.lead
    const length = Math.hypot(tx, ty, tz) || 1
    const vx = (tx / length + random.range(-config.spread, config.spread)) * shot.speed
    const vy = (ty / length + random.range(-config.spread, config.spread)) * shot.speed
    const vz = (tz / length + random.range(-config.spread, config.spread)) * shot.speed
    shots.pool.spawn(0, shot.life, sx, sy, sz, vx, vy, vz)
    person.cooldown = random.range(config.cooldown[0], config.cooldown[1])
    person.flash = config.aimTime * 0.4
  }

  #walk(person, dt) {
    const config = this.#config
    const dx = wrapDelta(person.targetX - person.x, this.#size)
    const dy = wrapDelta(person.targetY - person.y, this.#size)
    const distance = Math.hypot(dx, dy)
    if (distance < 1.5 || person.clock > person.patience) {
      this.#retarget(person)
      return
    }
    const step = Math.min(distance, config.walkSpeed * dt)
    const nx = mod(person.x + (dx / distance) * step, this.#size)
    const ny = mod(person.y + (dy / distance) * step, this.#size)
    const ground = this.#mesh.groundAt(nx, ny)
    if (ground < this.#mesh.seaLevel + 0.6 || Math.abs(ground - person.z) > step * 1.2 + 0.05) {
      this.#retarget(person)
      return
    }
    person.x = nx
    person.y = ny
    person.z = ground
    person.heading = Math.atan2(dy, dx)
    person.stride += step
  }

  #retarget(person) {
    const random = this.#random
    const radius = this.#config.campRadius
    const angle = random.range(0, Math.PI * 2)
    const reach = random.range(0.2, 1) * radius
    person.targetX = mod(person.camp.x + Math.cos(angle) * reach, this.#size)
    person.targetY = mod(person.camp.y + Math.sin(angle) * reach, this.#size)
    person.clock = 0
    person.patience = random.range(6, 14)
  }

  #revive(person) {
    const spot = this.#spot(person.camp)
    person.x = spot.x
    person.y = spot.y
    person.z = spot.z
    person.state = WANDER
    person.alive = true
    person.cooldown = this.#random.range(...this.#config.cooldown)
    this.#retarget(person)
  }

  #person(camp, index) {
    const config = this.#config
    const random = this.#random
    const spot = this.#spot(camp)
    const person = {
      ...spot,
      camp,
      heading: random.range(0, Math.PI * 2),
      state: WANDER,
      alive: true,
      timer: 0,
      clock: 0,
      patience: 0,
      stride: random.range(0, 10),
      flash: 0,
      cooldown: random.range(config.cooldown[0], config.cooldown[1]),
      tunic: config.tunics[(index + Math.floor(random.next() * config.tunics.length)) % config.tunics.length],
      targetX: spot.x,
      targetY: spot.y,
    }
    this.#retarget(person)
    return person
  }

  #spot(camp) {
    const random = this.#random
    for (let attempt = 0; attempt < 12; attempt++) {
      const angle = random.range(0, Math.PI * 2)
      const reach = random.range(0, this.#config.campRadius * 0.6)
      const x = mod(camp.x + Math.cos(angle) * reach, this.#size)
      const y = mod(camp.y + Math.sin(angle) * reach, this.#size)
      const z = this.#mesh.groundAt(x, y)
      if (z > this.#mesh.seaLevel + 0.6) return { x, y, z }
    }
    return { x: camp.x, y: camp.y, z: this.#mesh.groundAt(camp.x, camp.y) }
  }

  #camps(terrain) {
    const config = this.#config
    const random = this.#random
    const mesh = this.#mesh
    const camps = []
    for (let attempt = 0; attempt < 600 && camps.length < config.camps; attempt++) {
      const x = random.range(0, this.#size)
      const y = random.range(0, this.#size)
      const z = mesh.surfaceAt(x, y)
      if (z < terrain.seaLevel + 3) continue
      const slope = Math.abs(mesh.surfaceAt(x + 8, y) - mesh.surfaceAt(x - 8, y)) + Math.abs(mesh.surfaceAt(x, y + 8) - mesh.surfaceAt(x, y - 8))
      if (slope > 12) continue
      if (this.#distance({ x, y }, terrain.spawn) < config.safeStart) continue
      if (terrain.castles.some((castle) => this.#distance({ x, y }, castle) < castle.plaza + config.campRadius)) continue
      if (camps.some((camp) => this.#distance({ x, y }, camp) < config.campSpacing)) continue
      camps.push({ x, y })
    }
    return camps
  }

  #distance(a, b) {
    return Math.hypot(wrapDelta(a.x - b.x, this.#size), wrapDelta(a.y - b.y, this.#size))
  }
}
