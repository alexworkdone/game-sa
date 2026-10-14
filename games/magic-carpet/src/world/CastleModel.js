import { packRgb } from '../core/math.js'
import { box, panel, prism, pyramid } from '../render/solids.js'

const SIDES = [
  { axis: 'x', offset: -1 },
  { axis: 'x', offset: 1, gate: true },
  { axis: 'y', offset: -1 },
  { axis: 'y', offset: 1 },
]

const CORNERS = [
  [-1, -1],
  [1, -1],
  [1, 1],
  [-1, 1],
]

const lod = (solid, level) => {
  solid.detail = level === 'detail'
  solid.coarse = level === 'coarse'
  return solid
}

export class CastleModel {
  #config

  constructor(config) {
    this.#config = config
  }

  build(castle, upTo = castle.level) {
    const config = this.#config
    const { x, y, plateau } = castle
    const base = plateau - 2
    const colors = {
      stone: packRgb(...config.stone),
      roof: packRgb(...(castle.color ?? config.roofs[castle.banner % config.roofs.length])),
      gate: packRgb(...config.gate),
      pole: packRgb(...config.pole),
    }
    const parts = { units: [], colliders: [] }
    const inner = config.inner
    const outer = config.outer
    const stage = (level, add) => {
      if (level > upTo) return
      const units = parts.units.length
      const colliders = parts.colliders.length
      add()
      parts.units.slice(units).forEach((unit) => (unit.level = level))
      parts.colliders.slice(colliders).forEach((collider) => (collider.level = level))
    }

    stage(1, () => this.#keep(parts, x, y, base, plateau + config.keepHeight, colors))
    stage(2, () => {
      for (const [sx, sy] of CORNERS) this.#tower(parts, x + sx * inner.radius, y + sy * inner.radius, base, plateau, inner, colors)
    })
    stage(3, () => {
      for (const side of SIDES) this.#wall(parts, x, y, base, plateau, inner, side, colors)
    })
    stage(4, () => {
      const gatehouse = { ...inner, towerRadius: inner.gateTower, towerHeight: inner.wallHeight + 5, roofHeight: 6 }
      for (const sx of [-1, 1]) this.#tower(parts, x + sx * (config.gateWidth / 2 + inner.gateTower), y + inner.radius, base, plateau, gatehouse, colors)
    })
    stage(5, () => {
      for (const [sx, sy] of CORNERS) this.#tower(parts, x + sx * outer.radius, y + sy * outer.radius, base, plateau, outer, colors)
    })
    stage(6, () => {
      for (const side of SIDES) this.#wall(parts, x, y, base, plateau, outer, side, colors)
    })
    stage(7, () => {
      const third = outer.radius / 3
      for (const side of SIDES) {
        for (const along of [-third, third]) {
          const across = side.offset * outer.radius
          const [tx, ty] = side.axis === 'x' ? [x + along, y + across] : [x + across, y + along]
          this.#tower(parts, tx, ty, base, plateau, { ...outer, towerRadius: outer.towerRadius * 0.85 }, colors)
        }
      }
    })
    return parts
  }

  #keep(parts, x, y, base, top, colors) {
    const config = this.#config
    const half = config.keepHalf
    const roofHalf = half + 0.8
    const apex = top + config.keepRoof
    const poleTop = apex + 7
    parts.units.push({
      x,
      y,
      radius: half * 1.5,
      bias: half,
      solids: [
        box(x - half, y - half, x + half, y + half, base, top, colors.stone),
        pyramid(x, y, roofHalf * Math.SQRT2, top, config.keepRoof, 4, colors.roof, Math.PI / 4),
        box(x - 0.3, y - 0.3, x + 0.3, y + 0.3, apex - 1, poleTop, colors.pole, true),
        panel(
          [
            [x + 0.3, y, poleTop],
            [x + 6, y, poleTop - 1.6],
            [x + 0.3, y, poleTop - 3.2],
          ],
          colors.roof,
        ),
      ],
    })
    parts.colliders.push(
      { kind: 'box', x0: x - half, y0: y - half, x1: x + half, y1: y + half, top },
      { kind: 'pyramid', x, y, half: roofHalf, base: top, height: config.keepRoof },
    )
  }

  #tower(parts, x, y, base, plateau, ring, colors) {
    const config = this.#config
    const radius = ring.towerRadius
    const roofRadius = radius + config.roofOverhang
    const top = plateau + ring.towerHeight
    parts.units.push({
      x,
      y,
      radius: roofRadius,
      bias: radius,
      solids: [
        lod(prism(x, y, radius, base, top, config.roundSegments, colors.stone), 'detail'),
        lod(pyramid(x, y, roofRadius, top, ring.roofHeight, config.roundSegments, colors.roof), 'detail'),
        lod(prism(x, y, radius, base, top, config.farSegments, colors.stone), 'coarse'),
        lod(pyramid(x, y, roofRadius, top, ring.roofHeight, config.farSegments, colors.roof), 'coarse'),
      ],
    })
    parts.colliders.push(
      { kind: 'cylinder', x, y, radius, top },
      { kind: 'cone', x, y, radius: roofRadius, base: top, height: ring.roofHeight },
    )
  }

  #wall(parts, cx, cy, base, plateau, ring, side, colors) {
    const config = this.#config
    const half = config.wallThickness / 2
    const top = plateau + ring.wallHeight
    const start = -ring.radius + ring.towerRadius * 0.6
    const end = ring.radius - ring.towerRadius * 0.6
    const segments = Math.ceil((end - start) / config.segmentLength)
    const step = (end - start) / segments
    const line = side.offset * ring.radius
    const place = (along, across) => (side.axis === 'x' ? [cx + along, cy + line + across] : [cx + line + across, cy + along])

    for (let s = 0; s < segments; s++) {
      const a0 = start + s * step
      const a1 = a0 + step
      const [x0, y0] = place(a0, -half)
      const [x1, y1] = place(a1, half)
      const bounds = [Math.min(x0, x1), Math.min(y0, y1), Math.max(x0, x1), Math.max(y0, y1)]
      const solids = [box(...bounds, base, top, colors.stone)]

      for (let m = a0 + 1; m + config.merlonSize <= a1 - 0.5; m += config.merlonSize * 2) {
        const outerEdge = side.offset * half
        const [mx0, my0] = place(m, outerEdge)
        const [mx1, my1] = place(m + config.merlonSize, outerEdge - side.offset * half)
        solids.push(box(Math.min(mx0, mx1), Math.min(my0, my1), Math.max(mx0, mx1), Math.max(my0, my1), top, top + config.merlonHeight, colors.stone, true))
      }

      if (side.gate && a0 <= 0 && a1 >= 0) {
        const [gx0, gy0] = place(-config.gateWidth / 2, side.offset * half)
        const [gx1, gy1] = place(config.gateWidth / 2, side.offset * (half + 0.4))
        solids.push(box(Math.min(gx0, gx1), Math.min(gy0, gy1), Math.max(gx0, gx1), Math.max(gy0, gy1), base + 1, plateau + config.gateHeight, colors.gate))
      }

      const [mx, my] = place((a0 + a1) / 2, 0)
      parts.units.push({ x: mx, y: my, radius: step / 2 + 2, bias: 0, solids })
      parts.colliders.push({ kind: 'box', x0: bounds[0], y0: bounds[1], x1: bounds[2], y1: bounds[3], top: top + config.merlonHeight * 0.5 })
    }
  }
}
