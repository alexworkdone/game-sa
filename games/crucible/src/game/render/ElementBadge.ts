import { TAU } from '@sa/core'
import type { IRenderer } from '@sa/core'
import { PALETTE } from '../config/palette.js'
import type { ElementDef } from '../data/elements.js'
import type { GlyphPainter } from './GlyphPainter.js'

export interface BadgeStyle {
  readonly focus: number
  readonly charge: number
  readonly alpha: number
  readonly scale: number
  readonly time: number
  readonly fresh: number
}

const AURA_ARCS = 3
const BLUR_STEPS = 6

export class ElementBadge {
  private readonly glyphs: GlyphPainter

  constructor(glyphs: GlyphPainter) {
    this.glyphs = glyphs
  }

  render(
    renderer: IRenderer,
    def: ElementDef,
    x: number,
    y: number,
    radius: number,
    style: BadgeStyle,
  ): void {
    const accent = def.tones[2] ?? PALETTE.ink
    const base = def.tones[0] ?? PALETTE.backdrop
    const pop = 1 + style.fresh * 0.35
    const r = radius * style.scale * pop
    const lit = Math.max(style.focus, style.charge)

    if (lit > 0.01) {
      renderer.circle(x, y, r * (1.3 + lit * 0.2), {
        fill: accent,
        alpha: 0.16 * lit * style.alpha,
        glow: accent,
        glowSize: 26 * lit,
      })
    }

    renderer.circle(x, y, r, { fill: base, alpha: style.alpha })
    renderer.circle(x, y, r, {
      fill: PALETTE.background,
      alpha: 0.28 * (1 - lit) * style.alpha,
    })

    renderer.push()
    renderer.clip({ kind: 'circle', x, y, radius: r })
    this.glyphs.paint(renderer, def, x, y, r * 0.84, style.alpha * (0.72 + lit * 0.28))
    renderer.pop()

    renderer.ring(x, y, r, 2 + lit * 1.6, {
      stroke: accent,
      alpha: (0.42 + lit * 0.58) * style.alpha,
      glow: lit > 0.3 ? accent : '',
      glowSize: 14 * lit,
    })

    if (style.charge > 0.01) this.renderAura(renderer, accent, x, y, r, style)
    if (style.fresh > 0.01) {
      renderer.ring(x, y, r * (1 + (1 - style.fresh) * 0.9), 3 * style.fresh, {
        stroke: PALETTE.spark,
        alpha: style.fresh * 0.9,
        glow: PALETTE.spark,
        glowSize: 18,
      })
    }
  }

  renderLocked(
    renderer: IRenderer,
    def: ElementDef,
    x: number,
    y: number,
    radius: number,
    alpha: number,
  ): void {
    renderer.circle(x, y, radius, { fill: PALETTE.backdrop, alpha })
    renderer.push()
    renderer.clip({ kind: 'circle', x, y, radius })
    const spread = radius * 0.13
    for (let i = 0; i < BLUR_STEPS; i++) {
      const angle = (i / BLUR_STEPS) * TAU
      this.glyphs.paint(
        renderer,
        def,
        x + Math.cos(angle) * spread,
        y + Math.sin(angle) * spread,
        radius * 0.86,
        0.1 * alpha,
      )
    }
    this.glyphs.paint(renderer, def, x, y, radius * 0.86, 0.12 * alpha)
    renderer.circle(x, y, radius, { fill: PALETTE.background, alpha: 0.42 * alpha })
    renderer.pop()
    renderer.ring(x, y, radius, 1.5, { stroke: PALETTE.frame, alpha: 0.75 * alpha })
  }

  private renderAura(
    renderer: IRenderer,
    accent: string,
    x: number,
    y: number,
    r: number,
    style: BadgeStyle,
  ): void {
    const breathe = Math.sin(style.time * 3.4) * 0.06 + 1
    const auraRadius = r * (1.16 * breathe)
    const spin = style.time * 2.2
    const alpha = style.charge * style.alpha
    for (let i = 0; i < AURA_ARCS; i++) {
      const start = spin + (i * TAU) / AURA_ARCS
      renderer.arc(x, y, auraRadius, start, start + 1.05, 2.6, {
        stroke: accent,
        alpha,
        glow: accent,
        glowSize: 16,
      })
      const sparkAngle = -spin * 1.6 + (i * TAU) / AURA_ARCS
      renderer.circle(
        x + Math.cos(sparkAngle) * auraRadius,
        y + Math.sin(sparkAngle) * auraRadius,
        2.4,
        { fill: PALETTE.spark, alpha, glow: accent, glowSize: 12 },
      )
    }
  }
}
