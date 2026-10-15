import { clamp, damp, mod, wrapAngle } from '../core/math.js'

const shape = (value, deadZone, curve) => {
  const magnitude = Math.abs(value)
  if (magnitude <= deadZone) return 0
  return Math.sign(value) * Math.pow(Math.min(1, (magnitude - deadZone) / (1 - deadZone)), curve)
}

export class FlightModel {
  #config
  #aim
  #ground
  #worldSize

  constructor(config, aim, ground, worldSize) {
    this.#config = config
    this.#aim = aim
    this.#ground = ground
    this.#worldSize = worldSize
  }

  steer(carpet, cursor, dt) {
    const aim = this.#aim
    const turn = shape(cursor.x, aim.deadZone, aim.curve) * aim.turnRate
    carpet.yaw = wrapAngle(carpet.yaw + turn * dt)
    carpet.turnRate = turn
    const targetPitch = -shape(cursor.y, aim.deadZone, 1) * this.#config.maxPitch
    carpet.pitch = damp(carpet.pitch, targetPitch, aim.pitchFollow, dt)
  }

  shiftGear(carpet, delta) {
    const gear = clamp(carpet.gear + delta, 0, this.#config.gears.length - 1)
    if (gear === carpet.gear) return false
    carpet.gear = gear
    return true
  }

  speedOf(carpet) {
    return this.#config.gears[carpet.gear]
  }

  step(carpet, intent, dt) {
    const config = this.#config
    carpet.remember()

    const forwardX = Math.cos(carpet.yaw)
    const forwardY = Math.sin(carpet.yaw)
    const rightX = -forwardY
    const rightY = forwardX
    const gear = this.speedOf(carpet)
    const thrust = intent.thrust > 0 ? intent.thrust * config.thrust * gear : intent.thrust * config.reverseThrust
    const strafe = intent.strafe * config.strafe

    carpet.vx += (forwardX * thrust + rightX * strafe) * dt
    carpet.vy += (forwardY * thrust + rightY * strafe) * dt
    carpet.vz += intent.lift * config.lift * dt

    const drag = Math.exp(-config.drag * dt)
    carpet.vx *= drag
    carpet.vy *= drag
    carpet.vz *= Math.exp(-config.verticalDrag * dt)

    const speed = Math.hypot(carpet.vx, carpet.vy, carpet.vz)
    const maxSpeed = config.maxSpeed * gear
    if (speed > maxSpeed) {
      const k = maxSpeed / speed
      carpet.vx *= k
      carpet.vy *= k
      carpet.vz *= k
    }

    carpet.x = mod(carpet.x + carpet.vx * dt, this.#worldSize)
    carpet.y = mod(carpet.y + carpet.vy * dt, this.#worldSize)
    carpet.z += carpet.vz * dt

    this.#keepClear(carpet, dt)

    const lateral = carpet.vx * rightX + carpet.vy * rightY
    const targetRoll = clamp(
      carpet.turnRate * config.bankFromTurn + lateral * config.bankFromStrafe,
      -config.maxBank,
      config.maxBank,
    )
    carpet.roll = damp(carpet.roll, targetRoll, config.bankRate, dt)
  }

  #keepClear(carpet, dt) {
    const config = this.#config
    const floor = this.#ground.groundAt(carpet.x, carpet.y) + config.minClearance
    const ahead =
      this.#ground.groundAt(carpet.x + carpet.vx * config.lookAhead, carpet.y + carpet.vy * config.lookAhead) +
      config.minClearance
    if (carpet.z < ahead) carpet.vz += (ahead - carpet.z) * config.groundStiffness * 0.5 * dt
    if (carpet.z < floor) {
      carpet.z = damp(carpet.z, floor, config.groundStiffness, dt)
      if (carpet.z < floor - 2) carpet.z = floor - 2
      if (carpet.vz < 0) carpet.vz = 0
    }
    if (carpet.z > config.maxAltitude) {
      carpet.z = damp(carpet.z, config.maxAltitude, 6, dt)
      if (carpet.vz > 0) carpet.vz = 0
    }
  }
}
