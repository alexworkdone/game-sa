import { clamp } from '../core/math.js'

export class ResolutionScaler {
  #targetMs
  #samples = 0
  #total = 0
  #min = 1
  #max = 4
  scale = 2

  constructor(targetMs) {
    this.#targetMs = targetMs
  }

  setBounds(min, max, preferred) {
    this.#min = min
    this.#max = Math.max(min, max)
    this.scale = clamp(preferred ?? this.scale, this.#min, this.#max)
  }

  record(milliseconds) {
    this.#total += milliseconds
    this.#samples++
    if (this.#samples < 20) return
    const average = this.#total / this.#samples
    this.#total = 0
    this.#samples = 0
    if (average > this.#targetMs * 1.15) this.scale = clamp(this.scale * 1.08, this.#min, this.#max)
    else if (average < this.#targetMs * 0.65) this.scale = clamp(this.scale / 1.05, this.#min, this.#max)
  }
}
