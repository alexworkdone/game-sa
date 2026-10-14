export class KeyboardMouseInput {
  #element
  #captured
  #down = new Set()
  #pressed = new Set()
  #lockListeners = new Set()
  #width = 1
  #height = 1
  cursorX = 0
  cursorY = 0

  constructor(element, capturedCodes = []) {
    this.#element = element
    this.#captured = new Set(capturedCodes)
  }

  attach() {
    window.addEventListener('keydown', this.#onKeyDown)
    window.addEventListener('keyup', this.#onKeyUp)
    window.addEventListener('blur', this.#onBlur)
    window.addEventListener('mousemove', this.#onMouseMove)
    window.addEventListener('mouseup', this.#onMouseUp)
    this.#element.addEventListener('mousedown', this.#onMouseDown)
    this.#element.addEventListener('contextmenu', this.#onContextMenu)
    document.addEventListener('pointerlockchange', this.#onLockChange)
  }

  detach() {
    window.removeEventListener('keydown', this.#onKeyDown)
    window.removeEventListener('keyup', this.#onKeyUp)
    window.removeEventListener('blur', this.#onBlur)
    window.removeEventListener('mousemove', this.#onMouseMove)
    window.removeEventListener('mouseup', this.#onMouseUp)
    this.#element.removeEventListener('mousedown', this.#onMouseDown)
    this.#element.removeEventListener('contextmenu', this.#onContextMenu)
    document.removeEventListener('pointerlockchange', this.#onLockChange)
  }

  resize(width, height) {
    this.#width = width
    this.#height = height
    this.centerCursor()
  }

  centerCursor() {
    this.cursorX = this.#width / 2
    this.cursorY = this.#height / 2
  }

  get width() {
    return this.#width
  }

  get height() {
    return this.#height
  }

  anyDown(codes) {
    return codes.some((code) => this.#down.has(code))
  }

  anyPressed(codes) {
    return codes.some((code) => this.#pressed.has(code))
  }

  endFrame() {
    this.#pressed.clear()
  }

  get pointerLocked() {
    return document.pointerLockElement === this.#element
  }

  requestPointerLock() {
    try {
      const request = this.#element.requestPointerLock()
      if (request && typeof request.catch === 'function') request.catch(() => {})
    } catch {
      return
    }
  }

  releasePointerLock() {
    if (this.pointerLocked) document.exitPointerLock()
  }

  onPointerLockChange(listener) {
    this.#lockListeners.add(listener)
    return () => this.#lockListeners.delete(listener)
  }

  #press(code) {
    if (!this.#down.has(code)) this.#pressed.add(code)
    this.#down.add(code)
  }

  #onKeyDown = (event) => {
    if (this.#captured.has(event.code)) event.preventDefault()
    if (!event.repeat) this.#pressed.add(event.code)
    this.#down.add(event.code)
  }

  #onKeyUp = (event) => {
    this.#down.delete(event.code)
  }

  #onBlur = () => {
    this.#down.clear()
  }

  #onMouseDown = (event) => {
    event.preventDefault()
    this.#press(`Mouse${event.button}`)
  }

  #onMouseUp = (event) => {
    this.#down.delete(`Mouse${event.button}`)
  }

  #onMouseMove = (event) => {
    if (this.pointerLocked) {
      this.cursorX = Math.min(this.#width, Math.max(0, this.cursorX + event.movementX))
      this.cursorY = Math.min(this.#height, Math.max(0, this.cursorY + event.movementY))
      return
    }
    const rect = this.#element.getBoundingClientRect()
    this.cursorX = Math.min(this.#width, Math.max(0, event.clientX - rect.left))
    this.cursorY = Math.min(this.#height, Math.max(0, event.clientY - rect.top))
  }

  #onContextMenu = (event) => {
    event.preventDefault()
  }

  #onLockChange = () => {
    const locked = this.pointerLocked
    this.#lockListeners.forEach((listener) => listener(locked))
  }
}
