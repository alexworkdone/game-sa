export class KeyboardMouseControls {
  #input
  #bindings
  #intent = { thrust: 0, strafe: 0, lift: 0 }
  #cursor = { x: 0, y: 0 }
  #triggers = [false, false]
  #pixels = { x: 0, y: 0 }
  #doubleTap
  #taps = { forward: -Infinity, back: -Infinity }

  constructor(input, bindings, { doubleTap }) {
    this.#input = input
    this.#bindings = bindings
    this.#doubleTap = doubleTap
  }

  resize(width, height) {
    this.#input.resize(width, height)
  }

  centerCursor() {
    this.#input.centerCursor()
  }

  cursorPixels() {
    this.#pixels.x = this.#input.cursorX
    this.#pixels.y = this.#input.cursorY
    return this.#pixels
  }

  readFlight() {
    const intent = this.#intent
    intent.thrust = this.#axis('back', 'forward')
    intent.strafe = this.#axis('left', 'right')
    intent.lift = this.#axis('down', 'up')
    return intent
  }

  readCursor() {
    const input = this.#input
    const cursor = this.#cursor
    cursor.x = (input.cursorX / input.width) * 2 - 1
    cursor.y = (input.cursorY / input.height) * 2 - 1
    return cursor
  }

  readTriggers() {
    this.#triggers[0] = this.isHeld('castLeft')
    this.#triggers[1] = this.isHeld('castRight')
    return this.#triggers
  }

  readGearShift(now) {
    return this.#tappedTwice('forward', now) - this.#tappedTwice('back', now)
  }

  pickedSpell(count) {
    for (let slot = 1; slot <= count; slot++) if (this.wasPressed(`spell${slot}`)) return slot - 1
    return -1
  }

  isHeld(action) {
    return this.#input.anyDown(this.#bindings[action])
  }

  wasPressed(action) {
    return this.#input.anyPressed(this.#bindings[action])
  }

  endFrame() {
    this.#input.endFrame()
  }

  #tappedTwice(action, now) {
    if (!this.wasPressed(action)) return 0
    const quick = now - this.#taps[action] <= this.#doubleTap
    this.#taps[action] = quick ? -Infinity : now
    return quick ? 1 : 0
  }

  #axis(negative, positive) {
    return (this.isHeld(positive) ? 1 : 0) - (this.isHeld(negative) ? 1 : 0)
  }
}
