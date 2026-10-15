import { svg } from '../dom.js'

const stops = (pairs) => pairs.map(([offset, color, opacity = 1]) => svg('stop', { offset, 'stop-color': color, 'stop-opacity': opacity }))

const TONGUES = [
  { angle: 0, length: 34, width: 15, phase: 0 },
  { angle: -32, length: 26, width: 12, phase: 1.7 },
  { angle: 32, length: 27, width: 12, phase: 3.1 },
  { angle: -62, length: 19, width: 10, phase: 4.4 },
  { angle: 62, length: 20, width: 10, phase: 5.6 },
  { angle: -14, length: 24, width: 9, phase: 2.3 },
  { angle: 16, length: 23, width: 9, phase: 0.9 },
]

const tongue = (length, width) =>
  `M${-width / 2} 0 C${-width / 2} ${-length * 0.45} ${-width * 0.15} ${-length * 0.7} 0 ${-length} C${width * 0.15} ${-length * 0.7} ${width / 2} ${-length * 0.45} ${width / 2} 0 Z`

export class FireOrb {
  #tongues
  #inner

  constructor(id) {
    this.defs = [
      svg('radialGradient', { id: `${id}-core` }, stops([[0, '#fffdf2'], [0.35, '#ffe78a'], [0.75, '#ffa02e'], [1, '#ff6a12']])),
      svg('linearGradient', { id: `${id}-flame`, x1: 0, y1: 1, x2: 0, y2: 0 }, stops([[0, '#ffb02e'], [0.55, '#ff6a12'], [1, '#d8360c', 0]])),
      svg('linearGradient', { id: `${id}-flame-inner`, x1: 0, y1: 1, x2: 0, y2: 0 }, stops([[0, '#fffbe0'], [0.6, '#ffd75a'], [1, '#ffa02e', 0]])),
    ]
    this.#tongues = TONGUES.map((spec) => ({ ...spec, element: svg('path', { d: tongue(spec.length, spec.width), fill: `url(#${id}-flame)` }) }))
    this.#inner = TONGUES.slice(0, 3).map((spec) => ({
      ...spec,
      element: svg('path', { d: tongue(spec.length * 0.62, spec.width * 0.6), fill: `url(#${id}-flame-inner)` }),
    }))
    this.element = svg('g', {}, [
      ...this.#tongues.map((entry) => entry.element),
      svg('circle', { cx: 0, cy: 0, r: 17, fill: `url(#${id}-core)` }),
      ...this.#inner.map((entry) => entry.element),
    ])
    this.glow = ['#ff8a2a', '#ffb347']
  }

  update(time) {
    for (const entry of [...this.#tongues, ...this.#inner]) {
      const flicker = 0.78 + 0.18 * Math.sin(time * 11 + entry.phase) + 0.08 * Math.sin(time * 27 + entry.phase * 2.3)
      const sway = entry.angle + Math.sin(time * 6 + entry.phase) * 5
      entry.element.setAttribute('transform', `rotate(${sway.toFixed(1)}) translate(0 -8) scale(1 ${flicker.toFixed(3)})`)
    }
  }
}

const SWIRLS = [
  { radius: 22, width: 3.2, span: 200, speed: 2.2, phase: 0 },
  { radius: 27, width: 2.2, span: 150, speed: -1.6, phase: 2.1 },
  { radius: 17, width: 2.6, span: 120, speed: 3.1, phase: 4.2 },
]

const arc = (radius, span) => {
  const end = (span * Math.PI) / 180
  return `M${radius} 0 A${radius} ${radius} 0 ${span > 180 ? 1 : 0} 1 ${(Math.cos(end) * radius).toFixed(2)} ${(Math.sin(end) * radius).toFixed(2)}`
}

export class PossessionOrb {
  #swirls
  #sparks

  constructor(id) {
    this.defs = [
      svg('radialGradient', { id: `${id}-core` }, stops([[0, '#ffffff'], [0.35, '#ffd2f2'], [0.75, '#e05bbd'], [1, '#8e1c78']])),
    ]
    this.#swirls = SWIRLS.map((spec) => ({
      ...spec,
      element: svg('path', { d: arc(spec.radius, spec.span), fill: 'none', stroke: '#f6a6e2', 'stroke-width': spec.width, 'stroke-linecap': 'round', opacity: 0.85 }),
    }))
    this.#sparks = Array.from({ length: 5 }, (_, i) => ({
      phase: (i / 5) * Math.PI * 2,
      element: svg('circle', { r: 2.2, fill: '#fff0fb' }),
    }))
    this.element = svg('g', {}, [
      ...this.#swirls.map((swirl) => swirl.element),
      svg('circle', { cx: 0, cy: 0, r: 14, fill: `url(#${id}-core)` }),
      ...this.#sparks.map((spark) => spark.element),
    ])
    this.glow = ['#c43c9e', '#ff9be3']
  }

  update(time) {
    for (const swirl of this.#swirls) {
      swirl.element.setAttribute('transform', `rotate(${(((time * swirl.speed + swirl.phase) * 180) / Math.PI).toFixed(1)})`)
    }
    for (const spark of this.#sparks) {
      const angle = time * 1.8 + spark.phase
      const reach = 24 + Math.sin(time * 3 + spark.phase) * 5
      spark.element.setAttribute('cx', (Math.cos(angle) * reach).toFixed(1))
      spark.element.setAttribute('cy', (Math.sin(angle) * reach).toFixed(1))
    }
  }
}

export class CastleOrb {
  #ring
  #rays

  constructor(id) {
    this.defs = [
      svg('radialGradient', { id: `${id}-core` }, stops([[0, '#ffffff'], [0.35, '#fff3c0'], [0.75, '#f2c14e'], [1, '#b07a1a']])),
    ]
    this.#rays = svg(
      'g',
      { stroke: '#ffe7a0', 'stroke-width': 2.4, 'stroke-linecap': 'round', opacity: 0.8 },
      Array.from({ length: 8 }, (_, i) => {
        const angle = (i / 8) * Math.PI * 2
        return svg('line', {
          x1: (Math.cos(angle) * 19).toFixed(1),
          y1: (Math.sin(angle) * 19).toFixed(1),
          x2: (Math.cos(angle) * 27).toFixed(1),
          y2: (Math.sin(angle) * 27).toFixed(1),
        })
      }),
    )
    this.#ring = svg('rect', { x: -11, y: -11, width: 22, height: 22, fill: 'none', stroke: '#fff6d2', 'stroke-width': 2 })
    this.element = svg('g', {}, [
      this.#rays,
      svg('circle', { cx: 0, cy: 0, r: 15, fill: `url(#${id}-core)` }),
      this.#ring,
      svg('path', { d: 'M-6 7 L-6 -2 L-3 -2 L-3 -5 L-1 -5 L-1 -2 L1 -2 L1 -5 L3 -5 L3 -2 L6 -2 L6 7 Z', fill: '#8a5a12', opacity: 0.85 }),
    ])
    this.glow = ['#d89a2a', '#ffe28a']
  }

  update(time) {
    this.#rays.setAttribute('transform', `rotate(${((time * 40) % 360).toFixed(1)})`)
    this.#ring.setAttribute('transform', `rotate(${((-time * 60) % 360).toFixed(1)})`)
  }
}

export class MagnetOrb {
  #pearls
  #field

  constructor(id) {
    this.defs = [
      svg('radialGradient', { id: `${id}-core` }, stops([[0, '#ffffff'], [0.35, '#d6f3ff'], [0.75, '#5cb8f0'], [1, '#14527e']])),
      svg('radialGradient', { id: `${id}-pearl` }, stops([[0, '#fffbe6'], [0.5, '#f2c14e'], [1, '#9a6a12']])),
    ]
    this.#field = svg(
      'g',
      { fill: 'none', stroke: '#a8e4ff', 'stroke-width': 1.6, opacity: 0.7 },
      [0, 120, 240].map((angle) => svg('path', { d: arc(23, 70), transform: `rotate(${angle})` })),
    )
    this.#pearls = Array.from({ length: 4 }, (_, i) => ({ phase: i / 4, element: svg('circle', { r: 3, fill: `url(#${id}-pearl)` }) }))
    this.element = svg('g', {}, [
      this.#field,
      svg('circle', { cx: 0, cy: 0, r: 14, fill: `url(#${id}-core)` }),
      svg('path', { d: 'M-5 -6 V0 A5 5 0 0 0 5 0 V-6', fill: 'none', stroke: '#0f3d63', 'stroke-width': 2.6, 'stroke-linecap': 'round' }),
      ...this.#pearls.map((pearl) => pearl.element),
    ])
    this.glow = ['#3a9ad8', '#a8e4ff']
  }

  update(time) {
    this.#field.setAttribute('transform', `rotate(${((time * 50) % 360).toFixed(1)})`)
    for (const pearl of this.#pearls) {
      const cycle = (time * 0.7 + pearl.phase) % 1
      const reach = 30 - cycle * 16
      const angle = pearl.phase * Math.PI * 2 + cycle * 2.4
      pearl.element.setAttribute('cx', (Math.cos(angle) * reach).toFixed(1))
      pearl.element.setAttribute('cy', (Math.sin(angle) * reach).toFixed(1))
      pearl.element.setAttribute('r', (3.2 - cycle * 1.6).toFixed(2))
    }
  }
}
