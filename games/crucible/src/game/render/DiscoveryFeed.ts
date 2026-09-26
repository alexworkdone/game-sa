import { clamp } from '@sa/core'
import type { IRenderer, TextStyle } from '@sa/core'
import { PALETTE } from '../config/palette.js'
import { LAYOUT, TEXT } from '../config/layout.js'
import type { ElementDef } from '../data/elements.js'
import type { Area } from '../entities/Stage.js'
import type { Discovery } from '../systems/Discovery.js'
import type { ElementRegistry } from '../systems/ElementRegistry.js'
import type { RecipeBook } from '../systems/RecipeBook.js'
import type { Settings } from '../systems/Settings.js'

interface CraftRow {
  readonly kind: 'craft'
  readonly def: ElementDef
  readonly inputs: readonly ElementDef[]
}

interface HintRow {
  readonly kind: 'hint'
  readonly lines: readonly string[]
}

type Row = CraftRow | HintRow

const HINT_LINE = LAYOUT.feedHintLine
const NAME_STYLE: TextStyle = { size: TEXT.feedName, weight: 700 }
const PART_STYLE: TextStyle = { size: TEXT.feedPart, weight: 500 }
const GLUE_STYLE: TextStyle = { size: TEXT.feedPart, weight: 400 }
const HINT_STYLE: TextStyle = { size: TEXT.feedHint, weight: 400 }
const NAME_ALPHA = 0.55
const PART_ALPHA = 0.42
const GLUE_ALPHA = 0.3
const HINT_ALPHA = 0.62

export class DiscoveryFeed {
  private readonly registry: ElementRegistry
  private readonly recipes: RecipeBook

  private area: Area = { x: 0, y: 0, width: 100, height: 100 }
  private rows: Row[] = []
  private heights: number[] = []
  private contentHeight = 0
  private scale = 1
  private atBottom = true

  scroll = 0

  constructor(registry: ElementRegistry, recipes: RecipeBook) {
    this.registry = registry
    this.recipes = recipes
  }

  get scrollable(): boolean {
    return this.contentHeight > this.area.height + 1
  }

  private get maxScroll(): number {
    return Math.max(0, this.contentHeight - this.area.height)
  }

  dragBy(dy: number): void {
    if (!this.scrollable) return
    this.scroll = clamp(this.scroll - dy, 0, this.maxScroll)
    this.atBottom = this.scroll >= this.maxScroll - 1
  }

  refresh(
    renderer: IRenderer,
    area: Area,
    discovery: Discovery,
    hint: string | null,
    settings: Settings,
  ): void {
    this.area = area
    this.rows = []
    for (const id of discovery.history) {
      const inputs = this.recipes.inputsOf(id)
      if (!inputs) continue
      this.rows.push({
        kind: 'craft',
        def: this.registry.get(id),
        inputs: inputs.map((input) => this.registry.get(input)),
      })
    }
    if (hint) {
      this.rows.push({
        kind: 'hint',
        lines: this.wrap(renderer, hint, area.width - LAYOUT.feedIndent - 6),
      })
    }

    const available = area.width - LAYOUT.feedIndent - 6
    let widest = 1
    for (const row of this.rows) {
      if (row.kind === 'craft') widest = Math.max(widest, this.craftWidth(renderer, row, settings))
    }
    this.scale = Math.max(0.7, Math.min(1, available / widest))

    this.heights = this.rows.map((row) =>
      row.kind === 'craft' ? LAYOUT.feedRowHeight : row.lines.length * HINT_LINE + 12,
    )
    this.contentHeight = this.heights.reduce((sum, h) => sum + h, 0)
    this.scroll = this.atBottom ? this.maxScroll : clamp(this.scroll, 0, this.maxScroll)
  }

  renderInfo(
    renderer: IRenderer,
    area: Area,
    discovery: Discovery,
    settings: Settings,
  ): void {
    const ratio = discovery.total > 0 ? discovery.count / discovery.total : 0
    const stats: readonly [string, string][] = [
      [settings.t('discovered'), String(discovery.count)],
      [settings.t('total'), String(discovery.total)],
      [settings.t('progress'), `${Math.round(ratio * 100)}%`],
    ]
    const step = area.width / stats.length
    const labelY = area.y + area.height * 0.3
    const valueY = area.y + area.height * 0.72
    const valueSize = Math.min(TEXT.infoValue, area.height * 0.5)

    stats.forEach(([label, value], index) => {
      const cx = area.x + step * (index + 0.5)
      renderer.text(label, cx, labelY, {
        size: TEXT.infoLabel,
        weight: 700,
        align: 'center',
        baseline: 'middle',
        fill: PALETTE.inkMuted,
      })
      renderer.text(value, cx, valueY, {
        size: valueSize,
        weight: 800,
        align: 'center',
        baseline: 'middle',
        fill: index === 2 ? PALETTE.beam : PALETTE.ink,
      })
      if (index > 0) {
        renderer.line(area.x + step * index, labelY - 6, area.x + step * index, valueY + 10, 1, {
          stroke: PALETTE.frame,
          alpha: 0.7,
        })
      }
    })
  }

  render(renderer: IRenderer, settings: Settings): void {
    const area = this.area
    if (this.rows.length === 0) {
      renderer.text(settings.t('feedEmpty'), area.x + LAYOUT.feedIndent, area.y + 24, {
        size: TEXT.feedHint,
        weight: 400,
        align: 'left',
        baseline: 'middle',
        fill: PALETTE.inkMuted,
        alpha: HINT_ALPHA,
      })
      return
    }

    renderer.push()
    renderer.clip({ kind: 'rect', x: area.x - 4, y: area.y, width: area.width + 8, height: area.height })
    let cursor = area.y - this.scroll
    this.rows.forEach((row, index) => {
      const height = this.heights[index] ?? 0
      if (cursor + height >= area.y - 4 && cursor <= area.y + area.height + 4) {
        if (row.kind === 'craft') this.renderCraftRow(renderer, area, cursor, row, settings)
        else this.renderHintRow(renderer, area, cursor, row)
      }
      cursor += height
    })
    renderer.pop()

    if (!this.scrollable) return
    const ratio = area.height / this.contentHeight
    const barHeight = area.height * ratio
    const barY = area.y + (area.height - barHeight) * (this.scroll / this.maxScroll)
    renderer.roundRect(area.x + area.width - 2, barY, 3, barHeight, 2, {
      fill: PALETTE.trackLit,
      alpha: 0.5,
    })
  }

  private craftWidth(renderer: IRenderer, row: CraftRow, settings: Settings): number {
    let total =
      renderer.measureText(settings.element(row.def.id).toUpperCase(), NAME_STYLE) +
      renderer.measureText(' = ', GLUE_STYLE)
    row.inputs.forEach((input, index) => {
      total += renderer.measureText(settings.element(input.id).toLowerCase(), PART_STYLE)
      if (index < row.inputs.length - 1) total += renderer.measureText(' + ', GLUE_STYLE)
    })
    return total
  }

  private renderCraftRow(
    renderer: IRenderer,
    area: Area,
    top: number,
    row: CraftRow,
    settings: Settings,
  ): void {
    const accent = row.def.tones[2] ?? PALETTE.ink
    const baseline = top + LAYOUT.feedRowHeight / 2
    let cursor = area.x + LAYOUT.feedIndent
    const scale = this.scale

    renderer.circle(area.x + 8, baseline, 4, { fill: accent, alpha: NAME_ALPHA })

    const put = (value: string, style: TextStyle, fill: string, alpha: number): void => {
      const scaled: TextStyle = { ...style, size: (style.size ?? 16) * scale }
      renderer.text(value, cursor, baseline, {
        ...scaled,
        align: 'left',
        baseline: 'middle',
        fill,
        alpha,
      })
      cursor += renderer.measureText(value, scaled)
    }

    put(settings.element(row.def.id).toUpperCase(), NAME_STYLE, accent, NAME_ALPHA)
    put(' = ', GLUE_STYLE, PALETTE.inkMuted, GLUE_ALPHA)
    row.inputs.forEach((input, index) => {
      put(
        settings.element(input.id).toLowerCase(),
        PART_STYLE,
        input.tones[2] ?? PALETTE.ink,
        PART_ALPHA,
      )
      if (index < row.inputs.length - 1) put(' + ', GLUE_STYLE, PALETTE.inkMuted, GLUE_ALPHA)
    })
  }

  private renderHintRow(renderer: IRenderer, area: Area, top: number, row: HintRow): void {
    const centerY = top + 6 + HINT_LINE / 2
    renderer.circle(area.x + 8, centerY, 4, {
      fill: PALETTE.spark,
      alpha: HINT_ALPHA,
      glow: PALETTE.spark,
      glowSize: 8,
    })
    row.lines.forEach((text, index) => {
      renderer.text(text, area.x + LAYOUT.feedIndent, centerY + index * HINT_LINE, {
        ...HINT_STYLE,
        align: 'left',
        baseline: 'middle',
        fill: PALETTE.spark,
        alpha: HINT_ALPHA,
      })
    })
  }

  private wrap(renderer: IRenderer, text: string, maxWidth: number): string[] {
    const words = text.split(' ')
    const lines: string[] = []
    let line = ''
    for (const word of words) {
      const candidate = line ? `${line} ${word}` : word
      if (line && renderer.measureText(candidate, HINT_STYLE) > maxWidth) {
        lines.push(line)
        line = word
      } else {
        line = candidate
      }
    }
    if (line) lines.push(line)
    return lines
  }
}
