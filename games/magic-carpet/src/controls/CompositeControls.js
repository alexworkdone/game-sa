export class CompositeControls {
  #parts
  #intent = { thrust: 0, strafe: 0, lift: 0 }
  #triggers = [false, false]

  constructor(parts) {
    this.#parts = parts
  }

  #primary() {
    return this.#parts.find((part) => part.active) ?? this.#parts[0]
  }

  resize(width, height) {
    for (const part of this.#parts) part.resize?.(width, height)
  }

  centerCursor() {
    for (const part of this.#parts) part.centerCursor?.()
  }

  show() {
    for (const part of this.#parts) part.show?.()
  }

  hide() {
    for (const part of this.#parts) part.hide?.()
  }

  showSpell(handIndex, makeIcon) {
    for (const part of this.#parts) part.showSpell?.(handIndex, makeIcon)
  }

  readFlight() {
    const intent = this.#intent
    intent.thrust = 0
    intent.strafe = 0
    intent.lift = 0
    for (const part of this.#parts) {
      const flight = part.readFlight()
      intent.thrust += flight.thrust
      intent.strafe += flight.strafe
      intent.lift += flight.lift
    }
    intent.thrust = Math.max(-1, Math.min(1, intent.thrust))
    intent.strafe = Math.max(-1, Math.min(1, intent.strafe))
    intent.lift = Math.max(-1, Math.min(1, intent.lift))
    return intent
  }

  readCursor() {
    let chosen = null
    for (const part of this.#parts) {
      const cursor = part.readCursor()
      if (part === this.#primary()) chosen = cursor
    }
    return chosen
  }

  cursorPixels() {
    return this.#primary().cursorPixels()
  }

  readTriggers() {
    this.#triggers[0] = false
    this.#triggers[1] = false
    for (const part of this.#parts) {
      const triggers = part.readTriggers()
      this.#triggers[0] ||= triggers[0]
      this.#triggers[1] ||= triggers[1]
    }
    return this.#triggers
  }

  pickedSpell(count) {
    for (const part of this.#parts) {
      const picked = part.pickedSpell(count)
      if (picked >= 0) return picked
    }
    return -1
  }

  isHeld(action) {
    return this.#parts.some((part) => part.isHeld(action))
  }

  wasPressed(action) {
    return this.#parts.some((part) => part.wasPressed(action))
  }

  endFrame() {
    for (const part of this.#parts) part.endFrame()
  }
}
