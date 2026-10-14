export class Caster {
  #pool
  #spells
  #config
  #ground
  #reserve
  #rules
  #notify
  #cooldowns
  #listeners = new Set()
  #target = { x: 0, y: 0, z: 0 }
  hands

  constructor(pool, spells, config, ground, { hands, reserve, rules = {}, notify = () => {} }) {
    this.#pool = pool
    this.#spells = spells
    this.#config = config
    this.#ground = ground
    this.#reserve = reserve
    this.#rules = rules
    this.#notify = notify
    this.#cooldowns = spells.map(() => 0)
    this.hands = hands.map((hand) => ({ side: hand.side, fixed: hand.fixed, spell: spells.findIndex((spell) => spell.id === hand.spell) }))
  }

  select(handIndex, spellIndex) {
    const hand = this.hands[handIndex]
    if (!hand || hand.fixed || hand.spell === spellIndex) return false
    hand.spell = spellIndex
    return true
  }

  onCast(listener) {
    this.#listeners.add(listener)
    return () => this.#listeners.delete(listener)
  }

  readiness(handIndex) {
    const index = this.hands[handIndex].spell
    const spell = this.#spells[index]
    const cooling = 1 - this.#cooldowns[index] / spell.cooldown
    return this.#reserve.value >= spell.cost ? cooling : cooling * 0.35
  }

  update(dt, triggers, camera, aim) {
    for (let index = 0; index < this.#cooldowns.length; index++) {
      this.#cooldowns[index] = Math.max(0, this.#cooldowns[index] - dt)
    }
    this.hands.forEach((hand, handIndex) => {
      const index = hand.spell
      const spell = this.#spells[index]
      if (!triggers[handIndex] || this.#cooldowns[index] > 0) return
      this.#cooldowns[index] = spell.cooldown
      const target = this.#aimPoint(camera, aim)
      const rules = this.#rules[spell.id]
      const refusal = rules?.refuse(target)
      if (refusal) {
        this.#notify(refusal)
        return
      }
      const cost = rules?.cost(target) ?? spell.cost
      if (!this.#reserve.spend(cost)) {
        this.#notify(`Замало мани: «${spell.title}» коштує ${cost}`)
        return
      }
      this.#launch(index, spell, hand.side, camera, target)
      this.#listeners.forEach((listener) => listener(handIndex, spell))
    })
  }

  #launch(index, spell, side, camera, target) {
    const config = this.#config
    const fX = Math.cos(camera.yaw)
    const fY = Math.sin(camera.yaw)
    const rX = -fY
    const rY = fX
    const startX = camera.x + fX * config.handForward + rX * side * config.handSide
    const startY = camera.y + fY * config.handForward + rY * side * config.handSide
    const startZ = camera.z - config.handDrop
    let dx = target.x - startX
    let dy = target.y - startY
    let dz = target.z - startZ
    const length = Math.hypot(dx, dy, dz) || 1
    dx /= length
    dy /= length
    dz /= length
    this.#pool.spawn(index, spell.life, startX, startY, startZ, dx * spell.speed, dy * spell.speed, dz * spell.speed)
  }

  #aimPoint(camera, aim) {
    const config = this.#config
    const fX = Math.cos(camera.yaw)
    const fY = Math.sin(camera.yaw)
    let dirX = fX - fY * aim.u
    let dirY = fY + fX * aim.u
    let dirZ = aim.v
    const length = Math.hypot(dirX, dirY, dirZ)
    dirX /= length
    dirY /= length
    dirZ /= length
    const target = this.#target
    const step = config.aimDistance / config.aimSteps
    const below = (distance) =>
      camera.z + dirZ * distance <= this.#ground.groundAt(camera.x + dirX * distance, camera.y + dirY * distance)
    let reach = config.aimDistance
    for (let s = 1; s <= config.aimSteps; s++) {
      if (!below(s * step)) continue
      let near = (s - 1) * step
      let far = s * step
      for (let k = 0; k < 10; k++) {
        const middle = (near + far) / 2
        if (below(middle)) far = middle
        else near = middle
      }
      reach = far
      break
    }
    target.x = camera.x + dirX * reach
    target.y = camera.y + dirY * reach
    target.z = camera.z + dirZ * reach
    return target
  }
}
