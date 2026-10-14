import { svg } from '../dom.js'
import {
  BACK,
  BRACELET,
  FINGERS,
  RING,
  SLEEVE,
  TENDONS,
  THUMB,
  VIEW,
  WRIST,
  along,
  digitPath,
  knuckle,
  knuckleWrinkles,
  nail,
} from './handGeometry.js'

const SKIN = {
  light: '#f6d1ae',
  mid: '#e3aa84',
  deep: '#c28462',
  line: '#99583e',
}

const stops = (pairs) =>
  pairs.map(([offset, color, opacity = 1]) => svg('stop', { offset, 'stop-color': color, 'stop-opacity': opacity }))

const ellipse = ({ cx, cy, rx, ry, angle }, attributes) =>
  svg('ellipse', { cx, cy, rx, ry, transform: `rotate(${angle.toFixed(1)} ${cx.toFixed(1)} ${cy.toFixed(1)})`, ...attributes })

const halfRing = ({ cx, cy, rx, ry }, front) => `M${cx - rx} ${cy} A${rx} ${ry} 0 0 ${front ? 0 : 1} ${cx + rx} ${cy}`

export const createHandArt = (id, gem) => {
  const url = (name) => `url(#${id}-${name})`
  const defs = svg('defs', {}, [
    svg('linearGradient', { id: `${id}-sleeve`, x1: 0, y1: 0, x2: 0, y2: 1 }, stops([[0, '#3b2c8e'], [0.5, '#2a1f72'], [1, '#160f44']])),
    svg('linearGradient', { id: `${id}-sleeve-side`, x1: 0, y1: 0, x2: 1, y2: 0 }, stops([[0, '#000', 0.45], [0.28, '#000', 0], [0.62, '#fff', 0.08], [1, '#000', 0.5]])),
    svg('radialGradient', { id: `${id}-lining`, cx: 0.5, cy: 0.35, r: 0.65 }, stops([[0, '#1a030a'], [1, '#6e1528']])),
    svg('linearGradient', { id: `${id}-gold`, x1: 0, y1: 0, x2: 0, y2: 1 }, stops([[0, '#ffe9a8'], [0.45, '#e0a440'], [1, '#93601e']])),
    svg('linearGradient', { id: `${id}-wrist`, x1: 0, y1: 1, x2: 0, y2: 0 }, stops([[0, '#7d4e3a'], [0.5, SKIN.deep], [1, SKIN.mid]])),
    svg('radialGradient', { id: `${id}-back`, cx: 0.55, cy: 0.3, r: 0.8 }, stops([[0, SKIN.light], [0.5, SKIN.mid], [1, SKIN.deep]])),
    svg('linearGradient', { id: `${id}-edge`, x1: 0, y1: 0, x2: 1, y2: 0 }, stops([[0, '#8a4e36', 0.35], [0.25, '#8a4e36', 0], [1, '#8a4e36', 0]])),
    svg('linearGradient', { id: `${id}-digit`, x1: 0, y1: 0, x2: 1, y2: 0 }, stops([[0, SKIN.deep], [0.35, SKIN.light], [0.7, SKIN.mid], [1, SKIN.deep]])),
    svg('linearGradient', { id: `${id}-nail`, x1: 0, y1: 1, x2: 0, y2: 0 }, stops([[0, '#e8a99a'], [0.7, '#f7d3c8'], [1, '#fff4ee']])),
    svg('radialGradient', { id: `${id}-gem`, cx: 0.35, cy: 0.3, r: 0.75 }, stops([[0, '#ffffff'], [0.3, gem[0]], [1, gem[1]]])),
  ])

  const opening = SLEEVE.opening
  const finger = (shape, bulge) => [
    svg('path', { d: digitPath(shape, bulge), fill: url('digit'), stroke: SKIN.line, 'stroke-width': 1.3, 'stroke-opacity': 0.55 }),
    ...knuckleWrinkles(shape).map((d) =>
      svg('path', { d, fill: 'none', stroke: SKIN.line, 'stroke-width': 1.1, 'stroke-opacity': 0.4, 'stroke-linecap': 'round' }),
    ),
    ellipse(nail(shape), { fill: url('nail'), stroke: '#c98a7a', 'stroke-width': 0.8, 'stroke-opacity': 0.6 }),
  ]
  const ringSpot = along(FINGERS[RING.finger], RING.at)

  return svg('svg', { class: 'hand__art', viewBox: `0 0 ${VIEW.width} ${VIEW.height}`, 'aria-hidden': 'true' }, [
    defs,
    svg('path', { d: SLEEVE.body, fill: url('sleeve') }),
    svg('path', { d: SLEEVE.body, fill: url('sleeve-side') }),
    ...SLEEVE.folds.map((d) =>
      svg('path', { d, fill: 'none', stroke: '#110b36', 'stroke-width': 3.5, 'stroke-opacity': 0.5, 'stroke-linecap': 'round' }),
    ),
    svg('path', { d: SLEEVE.shine, fill: 'none', stroke: '#8f7fe0', 'stroke-width': 10, 'stroke-opacity': 0.18, 'stroke-linecap': 'round' }),
    svg('ellipse', { ...opening, fill: url('lining') }),
    svg('path', { d: halfRing(opening, false), fill: 'none', stroke: url('gold'), 'stroke-width': 7 }),
    svg('path', { d: WRIST, fill: url('wrist') }),
    ...finger(THUMB, 2.4),
    ...FINGERS.flatMap((shape) => finger(shape, 1.6)),
    svg('path', { d: BACK, fill: url('back'), stroke: SKIN.line, 'stroke-width': 1.3, 'stroke-opacity': 0.5 }),
    svg('path', { d: BACK, fill: url('edge') }),
    ...TENDONS.map((d) => svg('path', { d, fill: 'none', stroke: '#ffe6cf', 'stroke-width': 4, 'stroke-opacity': 0.16, 'stroke-linecap': 'round' })),
    ...FINGERS.map((shape) => ellipse(knuckle(shape), { fill: '#fbe1c6', opacity: 0.38 })),
    svg('path', { d: BRACELET.band, fill: url('gold'), stroke: '#6e4414', 'stroke-width': 1 }),
    svg('path', { d: BRACELET.shine, fill: 'none', stroke: '#fff3c4', 'stroke-width': 1.6, 'stroke-opacity': 0.75, 'stroke-linecap': 'round' }),
    svg('circle', { cx: BRACELET.gem[0], cy: BRACELET.gem[1], r: 7.5, fill: url('gold') }),
    svg('circle', { cx: BRACELET.gem[0], cy: BRACELET.gem[1], r: 5.4, fill: url('gem') }),
    ellipse(
      { cx: ringSpot.center[0], cy: ringSpot.center[1], rx: ringSpot.width * 0.56, ry: 3.4, angle: ringSpot.angle - 90 },
      { fill: url('gold'), stroke: '#6e4414', 'stroke-width': 0.8 },
    ),
    svg('circle', { cx: ringSpot.center[0], cy: ringSpot.center[1], r: 3.6, fill: url('gem') }),
    svg('path', { d: halfRing(opening, true), fill: 'none', stroke: url('gold'), 'stroke-width': 9 }),
    svg('path', {
      d: halfRing({ ...opening, rx: opening.rx - 1, ry: opening.ry - 1 }, true),
      fill: 'none',
      stroke: '#8a5a1c',
      'stroke-width': 2.2,
      'stroke-dasharray': '2 6',
      'stroke-linecap': 'round',
    }),
  ])
}
