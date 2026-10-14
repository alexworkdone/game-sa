import { html } from '../ui/dom.js'

const clamp = (value, min, max) => (value < min ? min : value > max ? max : value)

export class TouchControls {
  #config
  #root
  #stickZone
  #aimZone
  #base
  #knob
  #buttons = new Map()
  #held = new Set()
  #pressed = new Set()
  #move = null
  #aim = null
  #intent = { thrust: 0, strafe: 0, lift: 0 }
  #triggers = [false, false]
  #normalized = { x: 0, y: 0 }
  #pixels = { x: 0, y: 0 }
  #target = { x: 0, y: 0 }
  #width = 1
  #height = 1
  #lastRead = 0
  #used = false
  #pointerActions = new Map()

  constructor(parent, config) {
    this.#config = config
    this.#knob = html('span', { class: 'touch__knob' })
    this.#base = html('span', { class: 'touch__stick' }, [this.#knob])
    this.#stickZone = html('div', { class: 'touch__zone touch__zone--move' }, [this.#base])
    this.#aimZone = html('div', { class: 'touch__zone touch__zone--aim' })
    const button = (action, className, label, content = '') => {
      const element = html('button', { class: `touch__button ${className}`, type: 'button', 'aria-label': label }, content)
      this.#buttons.set(element, action)
      return element
    }
    this.#root = html('div', { class: 'touch', hidden: true }, [
      this.#stickZone,
      this.#aimZone,
      button('up', 'touch__button--up', 'Вгору', '▲'),
      button('down', 'touch__button--down', 'Вниз', '▼'),
      button('castLeft', 'touch__button--fire', 'Вогняна куля'),
      button('castRight', 'touch__button--spell', 'Чари правої руки'),
      button('pause', 'touch__button--pause', 'Пауза', 'II'),
    ])
    parent.prepend(this.#root)
    this.#root.addEventListener('pointerdown', this.#onDown)
    window.addEventListener('pointermove', this.#onMove)
    window.addEventListener('pointerup', this.#onUp)
    window.addEventListener('pointercancel', this.#onUp)
    this.#root.addEventListener('contextmenu', (event) => event.preventDefault())
  }

  get active() {
    return this.#used
  }

  show() {
    this.#root.hidden = false
  }

  hide() {
    this.#root.hidden = true
    this.#release()
  }

  resize(width, height) {
    this.#width = width
    this.#height = height
    this.centerCursor()
  }

  centerCursor() {
    this.#pixels.x = this.#width / 2
    this.#pixels.y = this.#height / 2
    this.#target.x = this.#pixels.x
    this.#target.y = this.#pixels.y
  }

  readFlight() {
    const intent = this.#intent
    const radius = this.#config.stickRadius
    if (this.#move) {
      intent.strafe = clamp((this.#move.x - this.#move.x0) / radius, -1, 1)
      intent.thrust = clamp(-(this.#move.y - this.#move.y0) / radius, -1, 1)
    } else {
      intent.strafe = 0
      intent.thrust = 0
    }
    intent.lift = (this.#held.has('up') ? 1 : 0) - (this.#held.has('down') ? 1 : 0)
    return intent
  }

  readCursor() {
    const now = performance.now()
    const dt = Math.min(0.1, (now - (this.#lastRead || now)) / 1000)
    this.#lastRead = now
    const follow = this.#aim ? 1 : 1 - Math.exp(-this.#config.aimReturn * dt)
    this.#pixels.x += (this.#target.x - this.#pixels.x) * follow
    this.#pixels.y += (this.#target.y - this.#pixels.y) * follow
    this.#normalized.x = (this.#pixels.x / this.#width) * 2 - 1
    this.#normalized.y = (this.#pixels.y / this.#height) * 2 - 1
    return this.#normalized
  }

  cursorPixels() {
    return this.#pixels
  }

  readTriggers() {
    this.#triggers[0] = this.#held.has('castLeft')
    this.#triggers[1] = this.#held.has('castRight')
    return this.#triggers
  }

  pickedSpell() {
    return -1
  }

  isHeld(action) {
    return this.#held.has(action)
  }

  wasPressed(action) {
    return this.#pressed.has(action)
  }

  endFrame() {
    this.#pressed.clear()
  }

  showSpell(handIndex, makeIcon) {
    const wanted = handIndex === 0 ? 'castLeft' : 'castRight'
    for (const [element, action] of this.#buttons) {
      if (action === wanted) element.replaceChildren(makeIcon())
    }
  }

  #onDown = (event) => {
    event.preventDefault()
    this.#used = true
    const action = this.#buttons.get(event.target.closest('.touch__button'))
    if (action) {
      this.#held.add(action)
      this.#pressed.add(action)
      if ((action === 'castLeft' || action === 'castRight') && !this.#aim) this.#startAim(event)
      this.#track(event, action)
      return
    }
    if (event.target === this.#stickZone && !this.#move) {
      this.#move = { id: event.pointerId, x0: event.clientX, y0: event.clientY, x: event.clientX, y: event.clientY }
      this.#placeStick()
      this.#track(event, null)
      return
    }
    if (event.target === this.#aimZone && !this.#aim) {
      this.#startAim(event)
      this.#track(event, null)
    }
  }

  #onMove = (event) => {
    if (this.#move?.id === event.pointerId) {
      this.#move.x = event.clientX
      this.#move.y = event.clientY
      this.#placeStick()
    }
    if (this.#aim?.id === event.pointerId) {
      const gain = this.#config.aimGain
      this.#target.x = clamp(this.#width / 2 + (event.clientX - this.#aim.x0) * gain, 0, this.#width)
      this.#target.y = clamp(this.#height / 2 + (event.clientY - this.#aim.y0) * gain, 0, this.#height)
    }
  }

  #onUp = (event) => {
    const action = this.#pointerActions.get(event.pointerId)
    this.#pointerActions.delete(event.pointerId)
    if (action) this.#held.delete(action)
    if (this.#move?.id === event.pointerId) {
      this.#move = null
      this.#placeStick()
    }
    if (this.#aim?.id === event.pointerId) {
      this.#aim = null
      this.#target.x = this.#width / 2
      this.#target.y = this.#height / 2
    }
  }

  #track(event, action) {
    this.#pointerActions.set(event.pointerId, action)
  }

  #startAim(event) {
    this.#aim = { id: event.pointerId, x0: event.clientX - (this.#pixels.x - this.#width / 2) / this.#config.aimGain, y0: event.clientY - (this.#pixels.y - this.#height / 2) / this.#config.aimGain }
  }

  #placeStick() {
    const radius = this.#config.stickRadius
    if (!this.#move) {
      this.#base.classList.remove('touch__stick--active')
      this.#base.style.removeProperty('left')
      this.#base.style.removeProperty('top')
      this.#knob.style.transform = ''
      return
    }
    const zone = this.#stickZone.getBoundingClientRect()
    this.#base.classList.add('touch__stick--active')
    this.#base.style.left = `${this.#move.x0 - zone.left}px`
    this.#base.style.top = `${this.#move.y0 - zone.top}px`
    const dx = this.#move.x - this.#move.x0
    const dy = this.#move.y - this.#move.y0
    const length = Math.hypot(dx, dy)
    const k = length > radius ? radius / length : 1
    this.#knob.style.transform = `translate(${(dx * k).toFixed(1)}px, ${(dy * k).toFixed(1)}px)`
  }

  #release() {
    this.#held.clear()
    this.#pointerActions.clear()
    this.#move = null
    this.#aim = null
    this.centerCursor()
    this.#placeStick()
  }
}
