import type { IRenderer } from '@sa/core'
import { PALETTE, THEMES, themeAccent, themeBackground } from '../config/palette.js'
import type { ThemeId } from '../config/palette.js'
import { LAYOUT, TEXT } from '../config/layout.js'
import { LANGS, LANG_LABELS } from '../data/i18n.js'
import type { Lang } from '../data/i18n.js'
import { SORT_MODES } from '../systems/Settings.js'
import type { Settings, SortMode } from '../systems/Settings.js'
import type { Stage } from '../entities/Stage.js'

export type PanelAction =
  | { readonly kind: 'lang'; readonly value: Lang }
  | { readonly kind: 'sort'; readonly value: SortMode }
  | { readonly kind: 'theme'; readonly value: ThemeId }
  | { readonly kind: 'close' }

interface Slot<T> {
  readonly value: T
  x: number
  y: number
  width: number
  height: number
}

const SECTION = 30
const GAP = 16
const TITLE_ROW = 56
const CHIP_ROW = 58
const THEME_ROW = 78

const hit = (slot: { x: number; y: number; width: number; height: number }, px: number, py: number): boolean =>
  px >= slot.x && px <= slot.x + slot.width && py >= slot.y && py <= slot.y + slot.height

export class SettingsPanel {
  open = false

  private card = { x: 0, y: 0, width: 100, height: 100 }
  private langs: Slot<Lang>[] = []
  private sorts: Slot<SortMode>[] = []
  private themes: Slot<ThemeId>[] = []
  private closeSlot = { x: 0, y: 0, width: 56, height: 56 }

  layout(stage: Stage): void {
    const pad = LAYOUT.panelPadding
    const width = Math.min(stage.width - LAYOUT.sideMargin * 2, 620)
    const height =
      pad * 2 +
      TITLE_ROW +
      SECTION +
      CHIP_ROW +
      GAP +
      SECTION +
      SORT_MODES.length * LAYOUT.panelRow +
      GAP +
      SECTION +
      THEME_ROW
    const x = (stage.width - width) / 2
    const y = Math.max(LAYOUT.sideMargin, (stage.height - height) / 2)
    this.card = { x, y, width, height }

    const inner = width - pad * 2
    const left = x + pad
    let cursor = y + pad

    this.closeSlot = { x: x + width - pad - 52, y: cursor, width: 52, height: 52 }
    cursor += TITLE_ROW + SECTION

    const langWidth = (inner - GAP) / 2
    this.langs = LANGS.map((value, index) => ({
      value,
      x: left + index * (langWidth + GAP),
      y: cursor,
      width: langWidth,
      height: CHIP_ROW - 6,
    }))
    cursor += CHIP_ROW + GAP + SECTION

    this.sorts = SORT_MODES.map((value, index) => ({
      value,
      x: left,
      y: cursor + index * LAYOUT.panelRow,
      width: inner,
      height: LAYOUT.panelRow - 4,
    }))
    cursor += SORT_MODES.length * LAYOUT.panelRow + GAP + SECTION

    const themeWidth = (inner - GAP * (THEMES.length - 1)) / THEMES.length
    this.themes = THEMES.map((theme, index) => ({
      value: theme.id,
      x: left + index * (themeWidth + GAP),
      y: cursor,
      width: themeWidth,
      height: THEME_ROW - 6,
    }))
  }

  hitTest(px: number, py: number): PanelAction | null {
    if (!this.open) return null
    if (hit(this.closeSlot, px, py)) return { kind: 'close' }
    if (!hit(this.card, px, py)) return { kind: 'close' }
    for (const slot of this.langs) if (hit(slot, px, py)) return { kind: 'lang', value: slot.value }
    for (const slot of this.sorts) if (hit(slot, px, py)) return { kind: 'sort', value: slot.value }
    for (const slot of this.themes) {
      if (hit(slot, px, py)) return { kind: 'theme', value: slot.value }
    }
    return null
  }

  render(renderer: IRenderer, stage: Stage, settings: Settings): void {
    if (!this.open) return
    renderer.rect(0, 0, stage.width, stage.height, { fill: PALETTE.background, alpha: 0.82 })

    const { x, y, width, height } = this.card
    renderer.roundRect(x, y, width, height, 22, {
      fill: PALETTE.backdrop,
      stroke: PALETTE.frame,
      lineWidth: 2,
    })

    const pad = LAYOUT.panelPadding
    renderer.text(settings.t('menu'), x + pad, y + pad + 26, {
      size: TEXT.crucibleResult,
      weight: 800,
      align: 'left',
      baseline: 'middle',
      fill: PALETTE.ink,
    })
    renderer.roundRect(this.closeSlot.x, this.closeSlot.y, 52, 52, 16, {
      fill: PALETTE.track,
      alpha: 0.8,
    })
    const cx = this.closeSlot.x + 26
    const cy = this.closeSlot.y + 26
    renderer.line(cx - 10, cy - 10, cx + 10, cy + 10, 3, { stroke: PALETTE.inkMuted })
    renderer.line(cx + 10, cy - 10, cx - 10, cy + 10, 3, { stroke: PALETTE.inkMuted })

    this.section(renderer, settings.t('language'), x + pad, (this.langs[0]?.y ?? 0) - 14)
    for (const slot of this.langs) {
      const active = settings.lang === slot.value
      this.chip(renderer, slot, LANG_LABELS[slot.value], active)
    }

    this.section(renderer, settings.t('sorting'), x + pad, (this.sorts[0]?.y ?? 0) - 14)
    for (const slot of this.sorts) {
      const active = settings.sort === slot.value
      renderer.roundRect(slot.x, slot.y, slot.width, slot.height, 14, {
        fill: active ? PALETTE.track : PALETTE.background,
        stroke: active ? PALETTE.beam : PALETTE.frame,
        lineWidth: active ? 2 : 1,
        alpha: active ? 1 : 0.7,
      })
      renderer.circle(slot.x + 26, slot.y + slot.height / 2, 8, {
        stroke: active ? PALETTE.beam : PALETTE.inkMuted,
        lineWidth: 2,
        fill: active ? PALETTE.beam : '',
      })
      renderer.text(settings.sortLabel(slot.value), slot.x + 48, slot.y + slot.height / 2, {
        size: TEXT.tileLabel,
        weight: active ? 700 : 500,
        align: 'left',
        baseline: 'middle',
        fill: active ? PALETTE.ink : PALETTE.inkMuted,
      })
    }

    this.section(renderer, settings.t('theme'), x + pad, (this.themes[0]?.y ?? 0) - 14)
    for (const slot of this.themes) {
      const active = settings.theme === slot.value
      renderer.roundRect(slot.x, slot.y, slot.width, slot.height, 16, {
        fill: themeBackground(slot.value),
        stroke: active ? PALETTE.beam : PALETTE.frame,
        lineWidth: active ? 2 : 1,
      })
      renderer.circle(slot.x + slot.width / 2, slot.y + 24, 13, {
        fill: themeAccent(slot.value),
        glow: active ? themeAccent(slot.value) : '',
        glowSize: 14,
      })
      renderer.text(settings.themeLabel(slot.value), slot.x + slot.width / 2, slot.y + 54, {
        size: TEXT.categoryCount,
        weight: 600,
        align: 'center',
        baseline: 'middle',
        fill: active ? PALETTE.ink : PALETTE.inkMuted,
      })
    }
  }

  private section(renderer: IRenderer, text: string, x: number, y: number): void {
    renderer.text(text, x, y, {
      size: TEXT.infoLabel,
      weight: 700,
      align: 'left',
      baseline: 'middle',
      fill: PALETTE.inkMuted,
    })
  }

  private chip(renderer: IRenderer, slot: Slot<Lang>, label: string, active: boolean): void {
    renderer.roundRect(slot.x, slot.y, slot.width, slot.height, 16, {
      fill: active ? PALETTE.track : PALETTE.background,
      stroke: active ? PALETTE.beam : PALETTE.frame,
      lineWidth: active ? 2 : 1,
    })
    renderer.text(label, slot.x + slot.width / 2, slot.y + slot.height / 2, {
      size: TEXT.tileLabel,
      weight: active ? 700 : 500,
      align: 'center',
      baseline: 'middle',
      fill: active ? PALETTE.ink : PALETTE.inkMuted,
    })
  }
}
