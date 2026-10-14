interface Hsl {
  readonly h: number
  readonly s: number
  readonly l: number
}

const clamp01 = (value: number): number => Math.min(1, Math.max(0, value))

const toHsl = (hex: string): Hsl => {
  const value = parseInt(hex.slice(1), 16)
  const r = ((value >> 16) & 255) / 255
  const g = ((value >> 8) & 255) / 255
  const b = (value & 255) / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2
  if (max === min) return { h: 0, s: 0, l }
  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
  let h = 0
  if (max === r) h = (g - b) / d + (g < b ? 6 : 0)
  else if (max === g) h = (b - r) / d + 2
  else h = (r - g) / d + 4
  return { h: h * 60, s, l }
}

const toHex = ({ h, s, l }: Hsl): string => {
  const hue = ((h % 360) + 360) % 360
  const c = (1 - Math.abs(2 * l - 1)) * s
  const x = c * (1 - Math.abs(((hue / 60) % 2) - 1))
  const m = l - c / 2
  const [r, g, b] =
    hue < 60 ? [c, x, 0] : hue < 120 ? [x, c, 0] : hue < 180 ? [0, c, x] : hue < 240 ? [0, x, c] : hue < 300 ? [x, 0, c] : [c, 0, x]
  const channel = (value: number): string =>
    Math.round(clamp01(value + m) * 255)
      .toString(16)
      .padStart(2, '0')
  return `#${channel(r)}${channel(g)}${channel(b)}`
}

export const adjust = (hex: string, hue: number, lightness = 0, saturation = 0): string => {
  const hsl = toHsl(hex)
  return toHex({ h: hsl.h + hue, s: clamp01(hsl.s + saturation), l: clamp01(hsl.l + lightness) })
}
