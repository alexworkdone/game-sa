import { svg } from './dom.js'

export const sunIcon = () =>
  svg('g', { class: 'icon icon--sun' }, [
    svg('circle', { cx: 0, cy: 0, r: 5 }),
    ...Array.from({ length: 8 }, (_, i) => {
      const angle = (i / 8) * Math.PI * 2
      return svg('line', {
        x1: (Math.cos(angle) * 7.5).toFixed(2),
        y1: (Math.sin(angle) * 7.5).toFixed(2),
        x2: (Math.cos(angle) * 10).toFixed(2),
        y2: (Math.sin(angle) * 10).toFixed(2),
      })
    }),
  ])

export const moonIcon = () =>
  svg('g', { class: 'icon icon--moon' }, [svg('path', { d: 'M3 -8 A8.5 8.5 0 1 0 8 4 A6.5 6.5 0 1 1 3 -8 Z' })])

const SPELL_GLYPHS = [
  'M-1 -5 C3 -2 5 1 3 4 A4 4 0 1 1 -3 1 C-3 -1 -2 -3 -1 -5 Z',
  'M1 -6 L-3 1 L0 1 L-1 6 L3 -1 L0 -1 Z',
  'M0 -5 L4.5 -3 C4.5 1 3 4 0 5.5 C-3 4 -4.5 1 -4.5 -3 Z',
  'M0 -5.5 L1.6 -1.7 L5.5 -1.5 L2.5 1 L3.4 5 L0 2.8 L-3.4 5 L-2.5 1 L-5.5 -1.5 L-1.6 -1.7 Z',
  'M0 0 C1.5 -1 2.5 1 1 2.4 C-1.2 4 -4 2 -3.6 -0.8 C-3 -4 1.4 -5.4 4 -3 C6 -1 5.4 3 3.4 4.8',
  'M0 -5.5 L0 5.5 M-4.8 -2.75 L4.8 2.75 M-4.8 2.75 L4.8 -2.75',
]

const ring = (count, radius, offset) =>
  Array.from({ length: count }, (_, i) => {
    const angle = offset + (i / count) * Math.PI * 2
    return [Math.cos(angle) * radius, Math.sin(angle) * radius]
  })

const carpet = () => {
  const fringe = []
  for (let x = -20; x <= 20; x += 5) {
    fringe.push(`M${x} -33 L${x} -38`, `M${x} 33 L${x} 38`)
  }
  return svg('g', { class: 'emblem__carpet', transform: 'rotate(-16)' }, [
    svg('rect', { x: -24, y: -33, width: 48, height: 66, rx: 3, class: 'emblem__weave' }),
    svg('rect', { x: -19, y: -28, width: 38, height: 56, rx: 2, class: 'emblem__line' }),
    svg('path', { d: 'M0 -20 L7 -12 L0 -4 L-7 -12 Z', class: 'emblem__line' }),
    svg('path', { d: fringe.join(' '), class: 'emblem__line' }),
    svg('ellipse', { cx: 0, cy: 12, rx: 13, ry: 7, class: 'emblem__rider' }),
    svg('ellipse', { cx: 0, cy: 3, rx: 11, ry: 6, class: 'emblem__rider' }),
    svg('path', { d: 'M-10 2 L-17 -9 M10 2 L17 -9', class: 'emblem__line emblem__line--bold' }),
    svg('circle', { cx: -17, cy: -11, r: 2.6, class: 'emblem__rider' }),
    svg('circle', { cx: 17, cy: -11, r: 2.6, class: 'emblem__rider' }),
    svg('circle', { cx: 0, cy: 1, r: 8, class: 'emblem__rider' }),
    svg('circle', { cx: 1.5, cy: -1, r: 2.6, class: 'emblem__hat' }),
  ])
}

export const emblem = () =>
  svg('svg', { class: 'emblem', viewBox: '-64 -64 128 128', 'aria-hidden': 'true' }, [
    svg('circle', { cx: 0, cy: 0, r: 60, class: 'emblem__orbit' }),
    ...ring(SPELL_GLYPHS.length, 50, -Math.PI / 2 + Math.PI / 6).map(([x, y], i) =>
      svg('g', { transform: `translate(${x.toFixed(1)} ${y.toFixed(1)})`, class: 'emblem__spell' }, [
        svg('circle', { cx: 0, cy: 0, r: 9, class: 'emblem__badge' }),
        svg('path', { d: SPELL_GLYPHS[i] }),
      ]),
    ),
    carpet(),
  ])
