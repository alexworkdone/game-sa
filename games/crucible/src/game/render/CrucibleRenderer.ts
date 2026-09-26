import { Ease, TAU, clamp } from '@sa/core'
import type { IRenderer } from '@sa/core'
import { PALETTE } from '../config/palette.js'
import { TEXT, TIMING } from '../config/layout.js'
import type { ElementDef } from '../data/elements.js'
import type { ElementRegistry } from '../systems/ElementRegistry.js'
import type { Crucible } from '../entities/Crucible.js'
import type { Settings } from '../systems/Settings.js'
import type { GlyphPainter } from './GlyphPainter.js'

export interface CrucibleView {
  readonly x: number
  readonly y: number
  readonly size: number
  readonly corner: number
}

interface Region {
  readonly focusX: number
  readonly focusY: number
  readonly glyphRadius: number
  readonly clip: 'full' | 'top' | 'bottom' | 'sector'
  readonly startAngle: number
  readonly endAngle: number
}

const SECTOR_SPAN = TAU / 3
const TOP_CENTER = -Math.PI / 2

export class CrucibleRenderer {
  private readonly glyphs: GlyphPainter
  private readonly registry: ElementRegistry

  constructor(glyphs: GlyphPainter, registry: ElementRegistry) {
    this.glyphs = glyphs
    this.registry = registry
  }

  regions(view: CrucibleView, count: number): Region[] {
    const cx = view.x + view.size / 2
    const cy = view.y + view.size / 2
    if (count <= 1) {
      return [
        {
          focusX: cx,
          focusY: cy,
          glyphRadius: view.size * 0.33,
          clip: 'full',
          startAngle: 0,
          endAngle: 0,
        },
      ]
    }
    if (count === 2) {
      const offset = view.size * 0.25
      const glyphRadius = view.size * 0.19
      return [
        {
          focusX: cx,
          focusY: cy + offset,
          glyphRadius,
          clip: 'bottom',
          startAngle: 0,
          endAngle: 0,
        },
        { focusX: cx, focusY: cy - offset, glyphRadius, clip: 'top', startAngle: 0, endAngle: 0 },
      ]
    }
    const reach = view.size * 0.27
    const glyphRadius = view.size * 0.16
    const centers = [TOP_CENTER + SECTOR_SPAN * 2, TOP_CENTER + SECTOR_SPAN, TOP_CENTER]
    return centers.map((center) => ({
      focusX: cx + Math.cos(center) * reach,
      focusY: cy + Math.sin(center) * reach,
      glyphRadius,
      clip: 'sector' as const,
      startAngle: center - SECTOR_SPAN / 2,
      endAngle: center + SECTOR_SPAN / 2,
    }))
  }

  render(
    renderer: IRenderer,
    view: CrucibleView,
    crucible: Crucible,
    settings: Settings,
    time: number,
  ): void {
    const { x, y, size, corner } = view
    const cx = x + size / 2
    const cy = y + size / 2
    const brewing = crucible.phase === 'resolving'
    const crafted = crucible.phase === 'crafted'
    const brew = brewing ? clamp(crucible.elapsed / TIMING.brewDelay, 0, 1) : 0
    const pop = crafted ? Ease.outBack(clamp(crucible.elapsed / TIMING.craftedPop, 0, 1)) : 1

    renderer.roundRect(x - 6, y - 6, size + 12, size + 12, corner + 6, {
      fill: PALETTE.backdrop,
      alpha: 0.9,
    })
    renderer.roundRect(x, y, size, size, corner, { fill: PALETTE.background })

    renderer.push()
    renderer.clip({ kind: 'rect', x, y, width: size, height: size, radius: corner })

    renderer.push()
    if (brewing) {
      const spin = Ease.inQuad(brew) * TAU * 1.7
      const shrink = 1 - Ease.inQuad(brew) * 0.6
      renderer.translate(cx, cy)
      renderer.rotate(spin)
      renderer.scale(shrink, shrink)
      renderer.translate(-cx, -cy)
    } else if (crafted) {
      renderer.translate(cx, cy)
      renderer.scale(pop, pop)
      renderer.translate(-cx, -cy)
    }
    this.paintSlots(renderer, view, crucible)
    renderer.pop()

    if (brewing) this.paintCore(renderer, view, brew)
    if (crafted) this.paintBurst(renderer, view, crucible)
    if (crucible.phase === 'fizzled') {
      const fade = clamp(crucible.timer / TIMING.fizzleDelay, 0, 1)
      renderer.rect(x, y, size, size, { fill: PALETTE.alert, alpha: 0.32 * fade })
    }
    if (crucible.flash > 0) {
      renderer.rect(x, y, size, size, { fill: PALETTE.spark, alpha: crucible.flash * 0.6 })
    }
    renderer.pop()

    this.paintOverlay(renderer, view, crucible, settings, time)

    const ready = crucible.filled >= 2 && crucible.phase === 'idle'
    const breathe = 0.5 + Math.sin(time * 2) * 0.16
    const rim = brewing
      ? PALETTE.spark
      : crafted
        ? (crucible.result ? this.registry.get(crucible.result).tones[2] : PALETTE.beam)
        : ready
          ? PALETTE.spark
          : crucible.filled > 0
            ? PALETTE.beam
            : PALETTE.frame
    renderer.roundRect(x, y, size, size, corner, {
      stroke: rim ?? PALETTE.beam,
      lineWidth: ready || brewing || crafted ? 3 + breathe * 2 : 3,
      alpha: 0.9,
      glow: crucible.filled > 0 || brewing ? rim ?? PALETTE.beam : '',
      glowSize: 16 + crucible.flash * 30 + (ready || brewing ? breathe * 22 : 0) + brew * 40,
    })
  }

  private paintSlots(renderer: IRenderer, view: CrucibleView, crucible: Crucible): void {
    const regions = this.regions(view, crucible.filled)
    crucible.slots.forEach((id, index) => {
      const region = regions[index]
      if (!region) return
      renderer.push()
      this.clipRegion(renderer, view, region)
      this.paintRegion(renderer, this.registry.get(id), view, region)
      renderer.pop()
    })
    this.paintDividers(renderer, view, crucible.filled)
  }

  private paintCore(renderer: IRenderer, view: CrucibleView, brew: number): void {
    const cx = view.x + view.size / 2
    const cy = view.y + view.size / 2
    const eased = Ease.inQuad(brew)
    renderer.circle(cx, cy, view.size * 0.46 * eased, {
      fill: PALETTE.spark,
      alpha: 0.28 * eased,
      glow: PALETTE.spark,
      glowSize: 40 * eased,
    })
    renderer.circle(cx, cy, view.size * 0.2 * eased, {
      fill: '#ffffff',
      alpha: 0.75 * eased,
      glow: PALETTE.spark,
      glowSize: 30,
    })
  }

  private paintBurst(renderer: IRenderer, view: CrucibleView, crucible: Crucible): void {
    const cx = view.x + view.size / 2
    const cy = view.y + view.size / 2
    const wave = clamp(crucible.elapsed / 0.55, 0, 1)
    if (wave >= 1) return
    renderer.ring(cx, cy, view.size * 0.2 + view.size * 0.7 * wave, 5 * (1 - wave), {
      stroke: PALETTE.spark,
      alpha: (1 - wave) * 0.8,
      glow: PALETTE.spark,
      glowSize: 20,
    })
  }

  private paintOverlay(
    renderer: IRenderer,
    view: CrucibleView,
    crucible: Crucible,
    settings: Settings,
    time: number,
  ): void {
    const cx = view.x + view.size / 2
    const cy = view.y + view.size / 2
    const breathe = 0.5 + Math.sin(time * 2) * 0.16

    if (crucible.isEmpty && crucible.phase === 'idle') {
      renderer.ring(cx, cy - view.size * 0.06, view.size * 0.17, 2, {
        stroke: PALETTE.trackLit,
        alpha: breathe,
      })
      renderer.text(settings.t('pickElements'), cx, cy + view.size * 0.26, {
        size: TEXT.crucibleHint,
        weight: 600,
        align: 'center',
        baseline: 'middle',
        fill: PALETTE.inkMuted,
        alpha: breathe,
      })
      return
    }

    if (crucible.phase === 'crafted' && crucible.result) {
      const def = this.registry.get(crucible.result)
      const appear = clamp((crucible.elapsed - 0.2) / 0.3, 0, 1)
      this.paintLabel(
        renderer,
        view,
        settings.element(def.id).toUpperCase(),
        crucible.freshResult ? PALETTE.spark : (def.tones[2] ?? PALETTE.ink),
        appear,
        TEXT.crucibleResult,
      )
      return
    }

    if (crucible.phase === 'idle' && crucible.filled === 1) {
      this.paintLabel(
        renderer,
        view,
        settings.t('addOneMore'),
        PALETTE.inkMuted,
        0.75,
        TEXT.crucibleHint,
      )
    }
    if (crucible.filled >= 2 && crucible.phase === 'idle') {
      this.paintLabel(
        renderer,
        view,
        settings.t('tapToMix'),
        PALETTE.spark,
        0.65 + breathe * 0.5,
        TEXT.crucibleHint,
      )
    }
  }

  private paintLabel(
    renderer: IRenderer,
    view: CrucibleView,
    text: string,
    fill: string,
    alpha: number,
    size: number,
  ): void {
    const { x, y, corner } = view
    const height = Math.max(size * 1.9, view.size * 0.12)
    renderer.push()
    renderer.clip({ kind: 'rect', x, y, width: view.size, height: view.size, radius: corner })
    renderer.rect(x, y + view.size - height, view.size, height, {
      fill: PALETTE.background,
      alpha: 0.72 * Math.min(1, alpha * 1.4),
    })
    renderer.pop()
    renderer.text(text, x + view.size / 2, y + view.size - height / 2, {
      size,
      weight: 700,
      align: 'center',
      baseline: 'middle',
      fill,
      alpha,
    })
  }

  private clipRegion(renderer: IRenderer, view: CrucibleView, region: Region): void {
    const { x, y, size } = view
    if (region.clip === 'full') return
    if (region.clip === 'top') {
      renderer.clip({ kind: 'rect', x, y, width: size, height: size / 2 })
      return
    }
    if (region.clip === 'bottom') {
      renderer.clip({ kind: 'rect', x, y: y + size / 2, width: size, height: size / 2 })
      return
    }
    renderer.clip({
      kind: 'sector',
      x: x + size / 2,
      y: y + size / 2,
      radius: size,
      startAngle: region.startAngle,
      endAngle: region.endAngle,
    })
  }

  private paintRegion(
    renderer: IRenderer,
    def: ElementDef,
    view: CrucibleView,
    region: Region,
  ): void {
    const base = def.tones[0] ?? PALETTE.backdrop
    const core = def.tones[1] ?? base
    renderer.rect(view.x - view.size, view.y - view.size, view.size * 3, view.size * 3, {
      fill: base,
    })
    renderer.circle(region.focusX, region.focusY, region.glyphRadius * 2.6, {
      fill: core,
      alpha: 0.2,
    })
    renderer.circle(region.focusX, region.focusY, region.glyphRadius * 1.7, {
      fill: core,
      alpha: 0.24,
    })
    this.glyphs.paint(renderer, def, region.focusX, region.focusY, region.glyphRadius)
  }

  private paintDividers(renderer: IRenderer, view: CrucibleView, count: number): void {
    const { x, y, size } = view
    const cx = x + size / 2
    const cy = y + size / 2
    const style = { stroke: PALETTE.background, alpha: 0.55 } as const
    if (count === 2) {
      renderer.line(x, cy, x + size, cy, 3, style)
      return
    }
    if (count < 3) return
    for (let i = 0; i < 3; i++) {
      const angle = TOP_CENTER - SECTOR_SPAN / 2 + i * SECTOR_SPAN
      renderer.line(cx, cy, cx + Math.cos(angle) * size, cy + Math.sin(angle) * size, 3, style)
    }
  }
}
