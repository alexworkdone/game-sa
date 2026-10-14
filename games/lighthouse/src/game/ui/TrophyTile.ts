import { Signal, Widget, damp } from '@sa/core'
import type { IReadonlySignal, IRenderer, WidgetBounds } from '@sa/core'
import type { AchievementDef } from '../config/achievements.js'
import { PALETTE } from '../config/palette.js'
import { UI_THEME } from '../config/theme.js'
import { drawTrophy, gradeColor } from '../render/Trophies.js'

export class TrophyTile extends Widget {
  readonly def: AchievementDef
  unlocked = false
  fraction = 0
  selected = false

  private readonly activated = new Signal<TrophyTile>()
  private lift = 0

  constructor(def: AchievementDef, bounds: WidgetBounds) {
    super(bounds, UI_THEME)
    this.def = def
  }

  get onActivate(): IReadonlySignal<TrophyTile> {
    return this.activated
  }

  protected override activate(): void {
    this.activated.emit(this)
  }

  override update(dt: number): void {
    this.lift = damp(this.lift, this.selected ? 1 : 0, 0.0005, dt)
  }

  render(r: IRenderer): void {
    const { x, y, width: w, height: h } = this
    const color = gradeColor(this.def.grade)
    r.roundRect(x, y, w, h, 12, { fill: this.unlocked ? PALETTE.surface : PALETTE.night, alpha: 0.95 })
    r.roundRect(x, y, w, h, 12, {
      stroke: this.selected ? PALETTE.accent : this.unlocked ? color : PALETTE.surfaceActive,
      lineWidth: this.selected ? 2.5 : 1.5,
      alpha: this.unlocked || this.selected ? 0.9 : 0.6,
    })
    const scale = 1 + this.lift * 0.12
    drawTrophy(r, this.def.trophy, this.def.grade, x + w / 2, y + h / 2 - 6 - this.lift * 3, 50 * scale, !this.unlocked)
    if (this.unlocked) {
      r.rect(x + w / 2 - 22, y + h - 12, 44, 3, { fill: color, alpha: 0.8 })
      return
    }
    r.roundRect(x + 12, y + h - 13, w - 24, 5, 2.5, { fill: PALETTE.surfaceActive })
    if (this.fraction > 0) {
      r.roundRect(x + 12, y + h - 13, Math.max(5, (w - 24) * this.fraction), 5, 2.5, { fill: PALETTE.inkMuted })
    }
  }

  dispose(): void {
    this.activated.dispose()
  }
}
