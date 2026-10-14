import { svg } from './dom.js'

const EYE = 1.1
const NEAR = 0.15
const FRONT = 1.6
const HALF_WIDTH = 1
const TASSELS = 17
const MEDALLIONS = [1.08, 0.55]

export class CarpetView {
  #root
  #group
  #layers
  #fringe
  #night
  #medallions
  #width = 0
  #height = 0

  constructor(parent) {
    this.#layers = [
      { inset: 0, className: 'carpet__border' },
      { inset: 0.09, className: 'carpet__field' },
      { inset: 0.15, className: 'carpet__stripe' },
      { inset: 0.2, className: 'carpet__heart' },
    ].map((layer) => ({ ...layer, element: svg('path', { class: layer.className }) }))
    this.#fringe = svg('path', { class: 'carpet__fringe' })
    this.#night = svg('path', { class: 'carpet__night' })
    this.#medallions = MEDALLIONS.map(() => svg('path', { class: 'carpet__medallion' }))
    this.#group = svg('g', {}, [
      this.#fringe,
      ...this.#layers.map((layer) => layer.element),
      ...this.#medallions,
      this.#night,
    ])
    this.#root = svg('svg', { class: 'carpet', 'aria-hidden': 'true' }, [this.#group])
    parent.append(this.#root)
  }

  resize(width, height) {
    this.#width = width
    this.#height = height
    this.#root.setAttribute('viewBox', `0 0 ${width} ${height}`)
  }

  update(camera, brightness) {
    const width = this.#width
    const height = this.#height
    const focal = (height * 0.5) / Math.tan(camera.verticalFov / 2)
    const horizon = height * 0.5 + Math.tan(camera.pitch) * focal
    const project = (f, s, up = 0) => {
      const depth = f < NEAR ? NEAR : f
      return [width * 0.5 + (s / depth) * focal, horizon + ((EYE - up) / depth) * focal]
    }
    const path = (points) => `M${points.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join(' L')} Z`

    if (project(FRONT, 0)[1] > height) {
      this.#group.style.display = 'none'
      return
    }
    this.#group.style.display = ''

    const outline = (inset) => {
      const half = HALF_WIDTH - inset
      const edge = FRONT - inset
      return path([project(NEAR, -half), project(edge, -half), project(edge, half), project(NEAR, half)])
    }

    for (const layer of this.#layers) layer.element.setAttribute('d', outline(layer.inset))
    this.#night.setAttribute('d', outline(0))
    this.#night.setAttribute('opacity', Math.max(0, Math.min(0.85, 1 - brightness)).toFixed(2))

    MEDALLIONS.forEach((f, index) => {
      this.#medallions[index].setAttribute(
        'd',
        path([project(f + 0.2, 0), project(f, 0.24), project(f - 0.2, 0), project(f, -0.24)]),
      )
    })

    let fringe = ''
    for (let i = 0; i < TASSELS; i++) {
      const s = -HALF_WIDTH + 0.06 + ((2 * HALF_WIDTH - 0.12) * i) / (TASSELS - 1)
      const root = project(FRONT, s)
      const tip = project(FRONT + 0.1, s, -0.04)
      fringe += `M${root[0].toFixed(1)} ${root[1].toFixed(1)} L${tip[0].toFixed(1)} ${tip[1].toFixed(1)} `
    }
    this.#fringe.setAttribute('d', fringe)
  }
}
