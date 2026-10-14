import { SeededRandom } from '@sa/core'
import type { IRandom } from '@sa/core'
import type { PlanetTypeId, Rarity } from '../forge/Planet.js'
import { adjust } from './color.js'
import type { IPlanetPainter, PaintOptions, PlanetLike } from './IPlanetPainter.js'

const C = 100
const R = 54
const SPAN = R * 2
const LEFT = C - R
const COPIES = [-SPAN, 0, SPAN]

interface Palette {
  readonly light: string
  readonly base: string
  readonly dark: string
  readonly accents: readonly string[]
  readonly glow: string
}

const PALETTES: Readonly<Record<PlanetTypeId, Palette>> = {
  desert: { light: '#ffe3a3', base: '#e8b65a', dark: '#8f5019', accents: ['#f6cf7a', '#c98a36', '#fff0c4', '#b0702c'], glow: '#ffc861' },
  jungle: { light: '#9ff0a9', base: '#2fae5b', dark: '#0b4a29', accents: ['#1b7a40', '#79d86a', '#a8803f', '#135f33'], glow: '#5cf0a0' },
  ocean: { light: '#a3d6ff', base: '#2d84e4', dark: '#0a2a72', accents: ['#56c27a', '#e6d28c', '#3f9a5c'], glow: '#6cc0ff' },
  crystal: { light: '#ead8ff', base: '#9a62ff', dark: '#351083', accents: ['#c9a6ff', '#7a3cf0', '#f2e8ff', '#5a24c8', '#b384ff'], glow: '#c28bff' },
  savanna: { light: '#f2e99c', base: '#b5c049', dark: '#4f5c19', accents: ['#d9c35c', '#8fa83a', '#e8d98a', '#6f8a2a'], glow: '#e2e070' },
  gas: { light: '#ffe8cc', base: '#dc9d62', dark: '#5f3224', accents: ['#f3d2a4', '#d98b52', '#8fb7e8', '#c46d3f', '#f7e3c9', '#6f9ad6'], glow: '#ffc49a' },
  volcanic: { light: '#76588a', base: '#352140', dark: '#0f0814', accents: ['#ff7a2f', '#ffb14a', '#ff4f6d'], glow: '#ff7a4a' },
  cloud: { light: '#bafff4', base: '#33b8ae', dark: '#0b4f5d', accents: ['#effffc', '#93f1e4', '#5fd6c8'], glow: '#7df3e6' },
  toxic: { light: '#d8ff9c', base: '#72cc36', dark: '#351772', accents: ['#b04dff', '#e2ff5c', '#6a2bd9', '#9cff3a'], glow: '#b8ff5a' },
  ice: { light: '#ffffff', base: '#bcd6ff', dark: '#5468c2', accents: ['#8aa9ff', '#e8f2ff', '#a9c2ff'], glow: '#cfe4ff' },
  pearl: { light: '#fff8fc', base: '#f0d7ea', dark: '#9487c6', accents: ['#ffb3d9', '#b3ffe0', '#b3d9ff', '#dcc2ff', '#fff0b3'], glow: '#ffd6f0' },
  blackhole: { light: '#2a1d4a', base: '#07050f', dark: '#000000', accents: ['#ffd08a', '#ff7a5c', '#c45cff', '#fff3d6'], glow: '#9a6bff' },
}

interface Look {
  readonly ring: boolean
  readonly moons: number
  readonly glow: boolean
  readonly sparkles: number
}

const LOOK: Readonly<Record<Rarity, (random: IRandom) => Look>> = {
  common: (random) => ({ ring: random.bool(0.15), moons: random.bool(0.3) ? 1 : 0, glow: false, sparkles: 0 }),
  rare: (random) => ({ ring: random.bool(0.55), moons: random.int(1, 3), glow: random.bool(0.4), sparkles: 0 }),
  epic: (random) => ({ ring: random.bool(0.8), moons: random.int(1, 3), glow: true, sparkles: 3 }),
  legendary: () => ({ ring: true, moons: 2, glow: true, sparkles: 7 }),
}

let instance = 0

const f = (value: number): string => value.toFixed(1)

export class SvgPlanetPainter implements IPlanetPainter {
  paint(planet: PlanetLike, options: PaintOptions = {}): string {
    if (options.silhouette) return this.silhouette()
    const random = new SeededRandom(planet.seed)
    const id = `pl${(instance++).toString(36)}`
    const palette = this.jitter(PALETTES[planet.type], random)
    const look = this.look(planet, random)
    const animated = options.animated ?? true
    return planet.type === 'blackhole'
      ? this.blackhole(id, palette, look, random, planet.rarity, animated)
      : this.world(id, planet, palette, look, random, animated)
  }

  private look(planet: PlanetLike, random: IRandom): Look {
    const look = LOOK[planet.rarity](random)
    if (planet.type === 'gas') return { ...look, ring: true }
    return look
  }

  private jitter(palette: Palette, random: IRandom): Palette {
    const hue = random.float(-12, 12)
    const light = random.float(-0.04, 0.04)
    return {
      light: adjust(palette.light, hue, light),
      base: adjust(palette.base, hue, light),
      dark: adjust(palette.dark, hue, light),
      accents: palette.accents.map((accent) => adjust(accent, hue + random.float(-6, 6), light)),
      glow: adjust(palette.glow, hue),
    }
  }

  private world(
    id: string,
    planet: PlanetLike,
    palette: Palette,
    look: Look,
    random: IRandom,
    animated: boolean,
  ): string {
    const tilt = random.float(-22, 22)
    const spin = random.float(28, 60)
    const surface = this.surface(planet.type, palette, random)
    const clouds = this.clouds(planet.type, palette, random)
    const fixed = this.fixedLayer(planet.type, palette, random)
    const ringColors = [random.pick(palette.accents), palette.light]

    return [
      `<svg class="planet planet--${planet.rarity}${animated ? ' planet--animated' : ''}" viewBox="0 0 200 200" aria-hidden="true">`,
      '<defs>',
      this.sphereGradient(`${id}b`, palette),
      this.shadeGradient(`${id}s`),
      this.highlightGradient(`${id}h`),
      this.glowGradient(`${id}g`, palette.glow),
      `<linearGradient id="${id}r" x1="0" x2="1"><stop offset="0" stop-color="${ringColors[0]}" stop-opacity=".2"/><stop offset=".5" stop-color="${ringColors[1]}" stop-opacity=".9"/><stop offset="1" stop-color="${ringColors[0]}" stop-opacity=".2"/></linearGradient>`,
      `<clipPath id="${id}c"><circle cx="${C}" cy="${C}" r="${R}"/></clipPath>`,
      `<clipPath id="${id}f"><rect x="0" y="${C}" width="200" height="100"/></clipPath>`,
      planet.type === 'pearl' ? this.shimmerGradient(`${id}p`, palette, animated) : '',
      '</defs>',
      look.glow ? `<circle cx="${C}" cy="${C}" r="96" fill="url(#${id}g)"/>` : '',
      look.ring ? this.ring(id, tilt, 'back') : '',
      `<circle cx="${C}" cy="${C}" r="${R}" fill="url(#${id}b)"/>`,
      `<g clip-path="url(#${id}c)">`,
      `<g class="planet__surface" style="--spin:${f(spin)}s">${surface}</g>`,
      fixed,
      clouds ? `<g class="planet__clouds" style="--spin:${f(spin * 0.62)}s">${clouds}</g>` : '',
      planet.type === 'pearl' ? `<circle cx="${C}" cy="${C}" r="${R}" fill="url(#${id}p)" opacity=".55"/>` : '',
      `<circle cx="${C}" cy="${C}" r="${R}" fill="url(#${id}h)"/>`,
      `<circle cx="${C}" cy="${C}" r="${R}" fill="url(#${id}s)"/>`,
      '</g>',
      `<circle cx="${C}" cy="${C}" r="${R - 0.6}" fill="none" stroke="${palette.glow}" stroke-opacity=".35" stroke-width="1.2"/>`,
      look.ring ? this.ring(id, tilt, 'front') : '',
      this.moons(look.moons, palette, random),
      this.sparkles(look.sparkles, random),
      '</svg>',
    ].join('')
  }

  private blackhole(
    id: string,
    palette: Palette,
    look: Look,
    random: IRandom,
    rarity: Rarity,
    animated: boolean,
  ): string {
    const tilt = random.float(-16, 16)
    const [warm, hot, violet, white] = [
      palette.accents[0] ?? '#ffd08a',
      palette.accents[1] ?? '#ff7a5c',
      palette.accents[2] ?? '#c45cff',
      palette.accents[3] ?? '#fff3d6',
    ]
    const disk = (half: 'back' | 'front'): string => {
      const body = [
        `<ellipse cx="${C}" cy="${C}" rx="86" ry="20" fill="none" stroke="url(#${id}d)" stroke-width="12" opacity=".85"/>`,
        `<ellipse class="planet__disk" cx="${C}" cy="${C}" rx="72" ry="16" fill="none" stroke="${white}" stroke-width="2" stroke-dasharray="6 10" opacity=".7"/>`,
        `<ellipse cx="${C}" cy="${C}" rx="62" ry="13" fill="none" stroke="${hot}" stroke-width="5" opacity=".75"/>`,
      ].join('')
      const clip = half === 'front' ? ` clip-path="url(#${id}f)"` : ''
      return `<g transform="rotate(${f(tilt)} ${C} ${C})"><g${clip}>${body}</g></g>`
    }
    return [
      `<svg class="planet planet--${rarity}${animated ? ' planet--animated' : ''}" viewBox="0 0 200 200" aria-hidden="true">`,
      '<defs>',
      this.glowGradient(`${id}g`, palette.glow),
      `<linearGradient id="${id}d" x1="0" x2="1"><stop offset="0" stop-color="${violet}" stop-opacity=".2"/><stop offset=".35" stop-color="${hot}"/><stop offset=".5" stop-color="${white}"/><stop offset=".65" stop-color="${warm}"/><stop offset="1" stop-color="${violet}" stop-opacity=".2"/></linearGradient>`,
      `<radialGradient id="${id}e"><stop offset=".6" stop-color="#000"/><stop offset=".86" stop-color="#000"/><stop offset=".93" stop-color="${warm}" stop-opacity=".9"/><stop offset="1" stop-color="${violet}" stop-opacity="0"/></radialGradient>`,
      `<clipPath id="${id}f"><rect x="0" y="${C}" width="200" height="100"/></clipPath>`,
      '</defs>',
      `<circle cx="${C}" cy="${C}" r="96" fill="url(#${id}g)"/>`,
      disk('back'),
      `<circle cx="${C}" cy="${C}" r="46" fill="url(#${id}e)"/>`,
      `<circle cx="${C}" cy="${C}" r="38" fill="#000"/>`,
      disk('front'),
      this.sparkles(Math.max(look.sparkles, 2), random),
      '</svg>',
    ].join('')
  }

  private silhouette(): string {
    return [
      '<svg class="planet planet--silhouette" viewBox="0 0 200 200" aria-hidden="true">',
      `<circle cx="${C}" cy="${C}" r="${R}" fill="currentColor" opacity=".08"/>`,
      `<circle cx="${C}" cy="${C}" r="${R}" fill="none" stroke="currentColor" stroke-opacity=".3" stroke-width="2" stroke-dasharray="4 7"/>`,
      `<text x="${C}" y="${C + 15}" text-anchor="middle" font-size="44" font-weight="800" fill="currentColor" opacity=".45">?</text>`,
      '</svg>',
    ].join('')
  }

  private sphereGradient(id: string, palette: Palette): string {
    return `<radialGradient id="${id}" cx="38%" cy="32%" r="78%"><stop offset="0" stop-color="${palette.light}"/><stop offset=".45" stop-color="${palette.base}"/><stop offset="1" stop-color="${palette.dark}"/></radialGradient>`
  }

  private shadeGradient(id: string): string {
    return `<radialGradient id="${id}" cx="36%" cy="30%" r="82%"><stop offset=".42" stop-color="#05031a" stop-opacity="0"/><stop offset=".78" stop-color="#05031a" stop-opacity=".42"/><stop offset="1" stop-color="#05031a" stop-opacity=".82"/></radialGradient>`
  }

  private highlightGradient(id: string): string {
    return `<radialGradient id="${id}" cx="32%" cy="26%" r="38%"><stop offset="0" stop-color="#fff" stop-opacity=".42"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>`
  }

  private glowGradient(id: string, color: string): string {
    return `<radialGradient id="${id}"><stop offset=".52" stop-color="${color}" stop-opacity=".5"/><stop offset=".7" stop-color="${color}" stop-opacity=".16"/><stop offset="1" stop-color="${color}" stop-opacity="0"/></radialGradient>`
  }

  private shimmerGradient(id: string, palette: Palette, animated: boolean): string {
    const stops = palette.accents
      .map((color, index) => `<stop offset="${f((index / (palette.accents.length - 1)) * 100)}%" stop-color="${color}"/>`)
      .join('')
    const motion = animated
      ? '<animateTransform attributeName="gradientTransform" type="rotate" from="0 .5 .5" to="360 .5 .5" dur="9s" repeatCount="indefinite"/>'
      : ''
    return `<linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1">${stops}${motion}</linearGradient>`
  }

  private ring(id: string, tilt: number, half: 'back' | 'front'): string {
    const clip = half === 'front' ? ` clip-path="url(#${id}f)"` : ''
    return [
      `<g transform="rotate(${f(tilt)} ${C} ${C})"><g${clip}>`,
      `<ellipse cx="${C}" cy="${C}" rx="90" ry="19" fill="none" stroke="url(#${id}r)" stroke-width="7"/>`,
      `<ellipse cx="${C}" cy="${C}" rx="76" ry="15.5" fill="none" stroke="url(#${id}r)" stroke-width="3" opacity=".7"/>`,
      '</g></g>',
    ].join('')
  }

  private repeat(markup: string): string {
    return COPIES.map((dx) => `<g transform="translate(${dx} 0)">${markup}</g>`).join('')
  }

  private surface(type: PlanetTypeId, palette: Palette, random: IRandom): string {
    switch (type) {
      case 'desert':
        return this.waves(palette.accents, random, 9, 0.9, 2.2) + this.repeat(this.spots(palette.accents, random, 5, 2, 5, 0.35))
      case 'jungle':
        return this.repeat(this.blobs(palette.accents, random, 7, 10, 22, 0.9))
      case 'ocean':
        return this.repeat(this.blobs(palette.accents, random, 5, 5, 12, 0.95))
      case 'crystal':
        return this.repeat(this.facets(palette, random))
      case 'savanna':
        return this.waves(palette.accents, random, 7, 0.7, 5) + this.repeat(this.blobs(palette.accents, random, 5, 6, 13, 0.55))
      case 'gas':
        return this.bands(palette.accents, random) + this.repeat(this.storm(palette, random))
      case 'volcanic':
        return this.repeat(this.spots([palette.light], random, 6, 3, 8, 0.35) + this.cracks(palette.accents, random))
      case 'cloud':
        return this.waves(palette.accents, random, 6, 0.55, 6)
      case 'toxic':
        return this.repeat(this.blobs(palette.accents, random, 9, 7, 16, 0.75)) + this.waves(palette.accents, random, 4, 0.35, 3)
      case 'ice':
        return this.repeat(this.cracks(palette.accents, random, 0.8))
      case 'pearl':
        return this.repeat(this.blobs(palette.accents, random, 8, 12, 24, 0.5))
      case 'blackhole':
        return ''
    }
  }

  private clouds(type: PlanetTypeId, palette: Palette, random: IRandom): string {
    const counts: Partial<Record<PlanetTypeId, number>> = {
      jungle: 6,
      ocean: 7,
      cloud: 9,
      savanna: 3,
      toxic: 3,
      ice: 2,
    }
    const count = counts[type] ?? 0
    if (count === 0) return ''
    const color = type === 'toxic' ? palette.light : '#ffffff'
    let markup = ''
    for (let i = 0; i < count; i++) {
      const cx = random.float(LEFT, LEFT + SPAN)
      const cy = random.float(C - R * 0.85, C + R * 0.85)
      const rx = random.float(8, 20)
      const ry = random.float(2.5, 5.5)
      markup += `<ellipse cx="${f(cx)}" cy="${f(cy)}" rx="${f(rx)}" ry="${f(ry)}" fill="${color}" opacity="${f(random.float(0.35, 0.75))}"/>`
    }
    return this.repeat(markup)
  }

  private fixedLayer(type: PlanetTypeId, palette: Palette, random: IRandom): string {
    if (type === 'ice') {
      const top = random.float(12, 20)
      const bottom = random.float(8, 16)
      return [
        `<ellipse cx="${C}" cy="${C - R}" rx="${R}" ry="${f(top)}" fill="#ffffff" opacity=".85"/>`,
        `<ellipse cx="${C}" cy="${C + R}" rx="${R}" ry="${f(bottom)}" fill="#ffffff" opacity=".7"/>`,
      ].join('')
    }
    if (type === 'ocean' && random.bool(0.6)) {
      return `<ellipse cx="${C}" cy="${C - R}" rx="${R}" ry="${f(random.float(6, 12))}" fill="#ffffff" opacity=".75"/>`
    }
    return ''
  }

  private blobs(colors: readonly string[], random: IRandom, count: number, min: number, max: number, opacity: number): string {
    let markup = ''
    for (let i = 0; i < count; i++) {
      const cx = random.float(LEFT, LEFT + SPAN)
      const cy = random.float(C - R * 0.8, C + R * 0.8)
      const radius = random.float(min, max)
      markup += `<path d="${this.blobPath(cx, cy, radius, random)}" fill="${random.pick(colors)}" opacity="${f(opacity * random.float(0.75, 1))}"/>`
    }
    return markup
  }

  private blobPath(cx: number, cy: number, radius: number, random: IRandom): string {
    const points = random.int(7, 11)
    const squash = random.float(0.55, 0.9)
    const vertices: [number, number][] = []
    for (let i = 0; i < points; i++) {
      const angle = (i / points) * Math.PI * 2
      const r = radius * random.float(0.65, 1.25)
      vertices.push([cx + Math.cos(angle) * r, cy + Math.sin(angle) * r * squash])
    }
    const mid = (a: [number, number], b: [number, number]): [number, number] => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]
    const first = vertices[0] as [number, number]
    const last = vertices[vertices.length - 1] as [number, number]
    const start = mid(last, first)
    let d = `M${f(start[0])} ${f(start[1])}`
    vertices.forEach((vertex, index) => {
      const next = vertices[(index + 1) % vertices.length] as [number, number]
      const end = mid(vertex, next)
      d += `Q${f(vertex[0])} ${f(vertex[1])} ${f(end[0])} ${f(end[1])}`
    })
    return `${d}Z`
  }

  private spots(colors: readonly string[], random: IRandom, count: number, min: number, max: number, opacity: number): string {
    let markup = ''
    for (let i = 0; i < count; i++) {
      const cx = random.float(LEFT, LEFT + SPAN)
      const cy = random.float(C - R * 0.8, C + R * 0.8)
      const r = random.float(min, max)
      markup += `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(r)}" fill="${random.pick(colors)}" opacity="${f(opacity)}"/>`
      markup += `<circle cx="${f(cx - r * 0.2)}" cy="${f(cy - r * 0.25)}" r="${f(r * 0.65)}" fill="#000" opacity=".12"/>`
    }
    return markup
  }

  private waves(colors: readonly string[], random: IRandom, count: number, opacity: number, width: number): string {
    let markup = ''
    for (let i = 0; i < count; i++) {
      const y0 = C - R + ((i + 0.5) / count) * SPAN + random.float(-4, 4)
      const amplitude = random.float(1.5, 5)
      const k = random.int(1, 4)
      const phase = random.float(0, Math.PI * 2)
      let d = ''
      for (let x = LEFT - SPAN; x <= LEFT + SPAN * 2; x += 4) {
        const y = y0 + amplitude * Math.sin(((x - LEFT) / SPAN) * Math.PI * 2 * k + phase)
        d += `${d ? 'L' : 'M'}${f(x)} ${f(y)}`
      }
      markup += `<path d="${d}" fill="none" stroke="${random.pick(colors)}" stroke-width="${f(width * random.float(0.6, 1.4))}" stroke-linecap="round" opacity="${f(opacity * random.float(0.6, 1))}"/>`
    }
    return markup
  }

  private bands(colors: readonly string[], random: IRandom): string {
    const count = random.int(7, 11)
    let markup = ''
    let y = C - R
    const step = SPAN / count
    for (let i = 0; i < count; i++) {
      const height = step * random.float(0.7, 1.4)
      const amplitude = random.float(0.8, 3)
      const k = random.int(1, 4)
      const phase = random.float(0, Math.PI * 2)
      let top = ''
      let bottom = ''
      for (let x = LEFT - SPAN; x <= LEFT + SPAN * 2; x += 6) {
        const wave = amplitude * Math.sin(((x - LEFT) / SPAN) * Math.PI * 2 * k + phase)
        top += `${top ? 'L' : 'M'}${f(x)} ${f(y + wave)}`
        bottom = `L${f(x)} ${f(y + height + wave)}${bottom}`
      }
      markup += `<path d="${top}${bottom}Z" fill="${random.pick(colors)}" opacity="${f(random.float(0.55, 0.95))}"/>`
      y += height * 0.85
    }
    return markup
  }

  private storm(palette: Palette, random: IRandom): string {
    const cx = random.float(LEFT + 10, LEFT + SPAN - 10)
    const cy = random.float(C - 12, C + 22)
    const rx = random.float(9, 14)
    const ry = rx * 0.55
    const color = palette.accents[3] ?? palette.dark
    return [
      `<ellipse cx="${f(cx)}" cy="${f(cy)}" rx="${f(rx)}" ry="${f(ry)}" fill="${color}" opacity=".9"/>`,
      `<ellipse cx="${f(cx)}" cy="${f(cy)}" rx="${f(rx * 0.6)}" ry="${f(ry * 0.55)}" fill="${palette.light}" opacity=".45"/>`,
    ].join('')
  }

  private cracks(colors: readonly string[], random: IRandom, glow = 1): string {
    let markup = ''
    const count = random.int(5, 8)
    for (let i = 0; i < count; i++) {
      let x = random.float(LEFT, LEFT + SPAN)
      let y = random.float(C - R * 0.8, C + R * 0.8)
      let angle = random.float(0, Math.PI * 2)
      let d = `M${f(x)} ${f(y)}`
      const steps = random.int(3, 7)
      for (let s = 0; s < steps; s++) {
        angle += random.float(-0.9, 0.9)
        const length = random.float(5, 11)
        x += Math.cos(angle) * length
        y += Math.sin(angle) * length
        d += `L${f(x)} ${f(y)}`
      }
      const color = random.pick(colors)
      markup += `<path d="${d}" fill="none" stroke="${color}" stroke-width="${f(4.5 * glow)}" stroke-linecap="round" stroke-linejoin="round" opacity=".28"/>`
      markup += `<path d="${d}" fill="none" stroke="${color}" stroke-width="${f(1.6 * glow)}" stroke-linecap="round" stroke-linejoin="round" opacity=".95"/>`
    }
    return markup
  }

  private facets(palette: Palette, random: IRandom): string {
    const cols = 6
    const rows = 7
    const cellW = SPAN / cols
    const cellH = SPAN / rows
    const grid: [number, number][][] = []
    for (let r = 0; r <= rows; r++) {
      const row: [number, number][] = []
      for (let c = 0; c < cols; c++) {
        row.push([LEFT + c * cellW + random.float(-4, 4), C - R + r * cellH + random.float(-4, 4)])
      }
      const first = row[0] as [number, number]
      row.push([first[0] + SPAN, first[1]])
      grid.push(row)
    }
    const colors = [...palette.accents, palette.base, palette.light]
    let markup = ''
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const a = grid[r]?.[c]
        const b = grid[r]?.[c + 1]
        const cc = grid[r + 1]?.[c]
        const d = grid[r + 1]?.[c + 1]
        if (!a || !b || !cc || !d) continue
        const tri = (p: [number, number], q: [number, number], s: [number, number]): string =>
          `<path d="M${f(p[0])} ${f(p[1])}L${f(q[0])} ${f(q[1])}L${f(s[0])} ${f(s[1])}Z" fill="${random.pick(colors)}" opacity="${f(random.float(0.55, 0.95))}" stroke="${palette.light}" stroke-opacity=".35" stroke-width=".6"/>`
        markup += tri(a, b, d) + tri(a, d, cc)
      }
    }
    return markup
  }

  private moons(count: number, palette: Palette, random: IRandom): string {
    let markup = ''
    for (let i = 0; i < count; i++) {
      const distance = 76 + i * 9 + random.float(-3, 3)
      const size = random.float(4.5, 8.5)
      const start = random.float(0, 360)
      const period = random.float(14, 30) * (i + 1)
      const tint = adjust(random.pick([palette.light, '#d9d4f2', '#f2e3c9']), 0, -0.05)
      markup += [
        `<g transform="rotate(${f(start)} ${C} ${C})">`,
        `<g class="planet__orbit" style="--orbit:${f(period)}s">`,
        `<circle cx="${f(C + distance)}" cy="${C}" r="${f(size)}" fill="${tint}"/>`,
        `<circle cx="${f(C + distance + size * 0.28)}" cy="${f(C + size * 0.22)}" r="${f(size * 0.86)}" fill="#05031a" opacity=".38"/>`,
        '</g></g>',
      ].join('')
    }
    return markup
  }

  private sparkles(count: number, random: IRandom): string {
    let markup = ''
    for (let i = 0; i < count; i++) {
      const angle = random.float(0, Math.PI * 2)
      const distance = random.float(62, 92)
      const x = C + Math.cos(angle) * distance
      const y = C + Math.sin(angle) * distance
      const s = random.float(2.5, 5.5)
      markup += `<path class="planet__sparkle" style="--delay:${f(random.float(0, 2.4))}s" d="M${f(x)} ${f(y - s)}Q${f(x)} ${f(y)} ${f(x + s)} ${f(y)}Q${f(x)} ${f(y)} ${f(x)} ${f(y + s)}Q${f(x)} ${f(y)} ${f(x - s)} ${f(y)}Q${f(x)} ${f(y)} ${f(x)} ${f(y - s)}Z" fill="#fff"/>`
    }
    return markup
  }
}
