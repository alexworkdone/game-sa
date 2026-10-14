import { SeededRandom } from '../core/SeededRandom.js'

export class StarField {
  #count
  #directions
  #brightness
  #phase

  constructor(seed, count) {
    const random = new SeededRandom(seed ^ 0x7f4a7c15)
    this.#count = count
    this.#directions = new Float32Array(count * 3)
    this.#brightness = new Float32Array(count)
    this.#phase = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      const z = random.range(-1, 1)
      const angle = random.range(0, Math.PI * 2)
      const radius = Math.sqrt(1 - z * z)
      this.#directions[i * 3] = Math.cos(angle) * radius
      this.#directions[i * 3 + 1] = Math.sin(angle) * radius
      this.#directions[i * 3 + 2] = z
      this.#brightness[i] = Math.pow(random.next(), 2.4) * 0.85 + 0.15
      this.#phase[i] = random.range(0, Math.PI * 2)
    }
  }

  render(target, camera, view, atmosphere, day, time) {
    const alpha = atmosphere.stars
    if (alpha < 0.02) return
    const { pixels, clearSky, stride } = target
    const { width, height, focal } = view
    const horizon = height * 0.5 + Math.tan(camera.pitch) * focal
    const cx = width * 0.5
    const fX = Math.cos(camera.yaw)
    const fY = Math.sin(camera.yaw)
    const angle = day.angle
    const cosA = Math.cos(angle)
    const sinA = Math.sin(angle)
    const kY = -Math.cos(day.tilt)
    const kZ = Math.sin(day.tilt)
    const dirs = this.#directions

    for (let i = 0; i < this.#count; i++) {
      const x = dirs[i * 3]
      const y = dirs[i * 3 + 1]
      const z = dirs[i * 3 + 2]
      const dot = y * kY + z * kZ
      const crossX = kY * z - kZ * y
      const crossY = kZ * x
      const crossZ = -kY * x
      const rx = x * cosA + crossX * sinA
      const ry = y * cosA + crossY * sinA + kY * dot * (1 - cosA)
      const rz = z * cosA + crossZ * sinA + kZ * dot * (1 - cosA)
      const forward = rx * fX + ry * fY
      if (forward < 0.05) continue
      const sx = (cx + ((ry * fX - rx * fY) / forward) * focal) | 0
      const sy = (horizon - (rz / forward) * focal) | 0
      if (sx < 0 || sy < 0 || sx >= width || sy >= height) continue
      const o = sy * stride + sx
      const twinkle = 0.75 + 0.25 * Math.sin(time * 3 + this.#phase[i])
      const a = alpha * this.#brightness[i] * twinkle * clearSky[o] * 0.003921
      if (a < 0.03) continue
      blend(pixels, o, a)
      if (a > 0.55 && sx + 1 < width && sy + 1 < height) {
        blend(pixels, o + 1, a * 0.45)
        blend(pixels, o + stride, a * 0.45)
      }
    }
  }
}

const blend = (pixels, offset, amount) => {
  const color = pixels[offset]
  const r = color & 255
  const g = (color >> 8) & 255
  const b = (color >> 16) & 255
  pixels[offset] =
    0xff000000 | ((b + (255 - b) * amount) << 16) | ((g + (248 - g) * amount) << 8) | (r + (236 - r) * amount)
}
