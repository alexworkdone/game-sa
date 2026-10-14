export class FixedStepLoop {
  #target
  #step
  #maxFrame
  #accumulator = 0
  #last = 0
  #handle = 0
  #running = false

  constructor(target, { step = 1 / 120, maxFrame = 0.25 } = {}) {
    this.#target = target
    this.#step = step
    this.#maxFrame = maxFrame
  }

  get running() {
    return this.#running
  }

  start() {
    if (this.#running) return
    this.#running = true
    this.#last = performance.now()
    this.#handle = requestAnimationFrame(this.#frame)
  }

  stop() {
    this.#running = false
    cancelAnimationFrame(this.#handle)
  }

  advance(seconds) {
    this.#tick(Math.min(seconds, this.#maxFrame))
  }

  #frame = (now) => {
    if (!this.#running) return
    const dt = Math.min((now - this.#last) / 1000, this.#maxFrame)
    this.#last = now
    this.#tick(dt)
    this.#handle = requestAnimationFrame(this.#frame)
  }

  #tick(dt) {
    this.#target.beginFrame(dt)
    this.#accumulator += dt
    while (this.#accumulator >= this.#step) {
      this.#target.update(this.#step)
      this.#accumulator -= this.#step
    }
    this.#target.render(this.#accumulator / this.#step, dt)
  }
}
