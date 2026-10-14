export const mixColor = (a, b, t) => {
  const r = (a & 255) + (((b & 255) - (a & 255)) * t)
  const g = ((a >> 8) & 255) + ((((b >> 8) & 255) - ((a >> 8) & 255)) * t)
  const bl = ((a >> 16) & 255) + ((((b >> 16) & 255) - ((a >> 16) & 255)) * t)
  return ((bl | 0) << 16) | ((g | 0) << 8) | (r | 0)
}

export const lighten = (color, t) => mixColor(color, 0xffffff, t)
