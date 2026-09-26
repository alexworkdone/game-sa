import { TAU, clamp, damp } from '@sa/core'
import type { IRenderer } from '@sa/core'
import { PALETTE } from '../config/palette.js'
import { FEEL, LAYOUT, TEXT } from '../config/layout.js'
import type { ElementDef } from '../data/elements.js'
import type { Area } from '../entities/Stage.js'
import type { ElementBadge } from '../render/ElementBadge.js'
import type { Settings } from '../systems/Settings.js'

export interface TileState {
  readonly held: number
  readonly hint: number
  readonly warn: boolean
  readonly fresh: number
}

export interface GridEntry {
  readonly def: ElementDef
  readonly locked: boolean
}

export interface Tile {
  readonly def: ElementDef
  readonly locked: boolean
  x: number
  y: number
}

const WARN_DASHES = 9

export class ElementGrid {
  private area: Area = { x: 0, y: 0, width: 100, height: 100 }
  private tiles: Tile[] = []
  private columns = 4
  private cellWidth = 100
  private cellHeight = 120
  private iconRadius = 32
  private contentHeight = 0

  scroll = 0
  velocity = 0

  get iconSize(): number {
    return this.iconRadius
  }

  get scrollable(): boolean {
    return this.contentHeight > this.area.height
  }

  private get maxScroll(): number {
    return Math.max(0, this.contentHeight - this.area.height)
  }

  layout(area: Area, entries: readonly GridEntry[]): void {
    this.area = area
    this.columns = clamp(
      Math.round(area.width / LAYOUT.gridCellTarget),
      LAYOUT.gridColumnsMin,
      LAYOUT.gridColumnsMax,
    )
    this.cellWidth = area.width / this.columns
    this.iconRadius = Math.min(this.cellWidth * LAYOUT.gridIconRatio, area.height * 0.16)
    this.cellHeight = this.iconRadius * 2 + LAYOUT.gridLabelSpace
    this.tiles = entries.map((entry) => ({ def: entry.def, locked: entry.locked, x: 0, y: 0 }))
    this.contentHeight = Math.ceil(this.tiles.length / this.columns) * this.cellHeight
    this.clampScroll()
    this.place()
  }

  private place(): void {
    this.tiles.forEach((tile, index) => {
      const column = index % this.columns
      const row = Math.floor(index / this.columns)
      tile.x = this.area.x + this.cellWidth * (column + 0.5)
      tile.y = this.area.y + this.cellHeight * row + this.iconRadius + 6 - this.scroll
    })
  }

  clampScroll(): void {
    this.scroll = clamp(this.scroll, 0, this.maxScroll)
  }

  resetScroll(): void {
    this.scroll = 0
    this.velocity = 0
    this.place()
  }

  dragBy(dy: number, dt: number): void {
    if (!this.scrollable) return
    const next = this.scroll - dy
    const applied = next < 0 || next > this.maxScroll ? dy * FEEL.dragResistance : dy
    this.scroll -= applied
    if (dt > 0) this.velocity = -applied / dt
    this.place()
  }

  update(dt: number, dragging: boolean): void {
    if (dragging || !this.scrollable) return
    if (this.scroll < 0 || this.scroll > this.maxScroll) {
      const bound = this.scroll < 0 ? 0 : this.maxScroll
      this.scroll = damp(this.scroll, bound, FEEL.boundSmoothing, dt)
      this.velocity = 0
      if (Math.abs(bound - this.scroll) < 0.5) this.scroll = bound
      this.place()
      return
    }
    if (Math.abs(this.velocity) < FEEL.settleSpeed) {
      this.velocity = 0
      return
    }
    this.velocity *= Math.pow(FEEL.friction, dt)
    this.scroll = clamp(this.scroll + this.velocity * dt, 0, this.maxScroll)
    this.place()
  }

  hitTest(px: number, py: number): Tile | null {
    const reach = this.iconRadius * 1.35
    let best: Tile | null = null
    let bestDistance = reach * reach
    for (const tile of this.tiles) {
      const d = (tile.x - px) ** 2 + (tile.y - py) ** 2
      if (d < bestDistance) {
        bestDistance = d
        best = tile
      }
    }
    return best
  }

  positionOf(id: string): { x: number; y: number } | null {
    const tile = this.tiles.find((item) => item.def.id === id)
    return tile ? { x: tile.x, y: tile.y } : null
  }

  render(
    renderer: IRenderer,
    badge: ElementBadge,
    settings: Settings,
    time: number,
    stateOf: (def: ElementDef) => TileState,
  ): void {
    renderer.push()
    renderer.clip({
      kind: 'rect',
      x: this.area.x - 4,
      y: this.area.y,
      width: this.area.width + 8,
      height: this.area.height,
    })

    for (const tile of this.tiles) {
      if (tile.y + this.iconRadius < this.area.y - 8) continue
      if (tile.y - this.iconRadius > this.area.y + this.area.height + 8) continue
      this.renderTile(renderer, badge, settings, tile, time, stateOf(tile.def))
    }

    renderer.pop()

    if (this.scrollable) {
      const ratio = this.area.height / this.contentHeight
      const barHeight = this.area.height * ratio
      const barY = this.area.y + (this.area.height - barHeight) * (this.scroll / this.maxScroll)
      renderer.roundRect(this.area.x + this.area.width + 2, barY, 3, barHeight, 2, {
        fill: PALETTE.trackLit,
        alpha: 0.6,
      })
    }
  }

  private renderTile(
    renderer: IRenderer,
    badge: ElementBadge,
    settings: Settings,
    tile: Tile,
    time: number,
    state: TileState,
  ): void {
    if (tile.locked) {
      badge.renderLocked(renderer, tile.def, tile.x, tile.y, this.iconRadius, 1)
      renderer.text(settings.t('locked'), tile.x, tile.y + this.iconRadius + 17, {
        size: TEXT.tileLabel,
        weight: 700,
        align: 'center',
        baseline: 'middle',
        fill: PALETTE.inkMuted,
        alpha: 0.45,
      })
      return
    }
    const accent = tile.def.tones[2] ?? PALETTE.ink
    const picked = state.held > 0
    badge.render(renderer, tile.def, tile.x, tile.y, this.iconRadius, {
      focus: picked ? 1 : state.hint,
      charge: picked ? 1 : 0,
      alpha: picked ? 1 : 0.88,
      scale: picked ? 1.04 : 1,
      time,
      fresh: state.fresh,
    })

    if (state.warn) this.renderWarn(renderer, tile.x, tile.y, time)
    if (state.hint > 0 && !picked) {
      renderer.ring(tile.x, tile.y, this.iconRadius * (1.2 + state.hint * 0.12), 2, {
        stroke: PALETTE.spark,
        alpha: state.hint * 0.7,
        glow: PALETTE.spark,
        glowSize: 14,
      })
    }

    if (state.held > 1) {
      const badgeX = tile.x + this.iconRadius * 0.78
      const badgeY = tile.y - this.iconRadius * 0.78
      renderer.circle(badgeX, badgeY, TEXT.tileCount * 0.72, { fill: PALETTE.beam })
      renderer.text(`${state.held}`, badgeX, badgeY, {
        size: TEXT.tileCount,
        weight: 800,
        align: 'center',
        baseline: 'middle',
        fill: PALETTE.background,
      })
    }

    renderer.text(settings.element(tile.def.id).toUpperCase(), tile.x, tile.y + this.iconRadius + 17, {
      size: TEXT.tileLabel,
      weight: picked ? 700 : 600,
      align: 'center',
      baseline: 'middle',
      fill: picked ? accent : PALETTE.inkMuted,
      alpha: picked ? 1 : 0.85,
    })
  }

  private renderWarn(renderer: IRenderer, x: number, y: number, time: number): void {
    const radius = this.iconRadius * 1.18
    const step = TAU / WARN_DASHES
    const spin = time * 0.6
    for (let i = 0; i < WARN_DASHES; i++) {
      const start = spin + i * step
      renderer.arc(x, y, radius, start, start + step * 0.5, 2.4, {
        stroke: PALETTE.alert,
        alpha: 0.85,
      })
    }
  }
}
