import { Scene, UiLayer } from '@sa/core'
import type { GameContext, IRenderer } from '@sa/core'
import { ACHIEVEMENTS } from '../config/achievements.js'
import type { AchievementDef } from '../config/achievements.js'
import { PALETTE } from '../config/palette.js'
import { drawTrophy, gradeColor } from '../render/Trophies.js'
import { HEADER, ScreenHeader } from '../ui/ScreenHeader.js'
import { TrophyTile } from '../ui/TrophyTile.js'
import type { Feats } from './Feats.js'

const COLUMNS = 9
const TILE_W = 96
const TILE_H = 86
const GAP = 8
const GRID_TOP = 76

const GRADE_NAMES: Readonly<Record<AchievementDef['grade'], string>> = {
  bronze: 'бронза',
  silver: 'срібло',
  gold: 'золото',
  crystal: 'кришталь',
}

const number = (value: number): string => Math.round(value).toLocaleString('uk-UA')

export class AchievementsScene extends Scene<GameContext> {
  readonly name = 'achievements'

  private readonly feats: Feats
  private readonly ui = new UiLayer()
  private readonly tiles: TrophyTile[]
  private readonly header = new ScreenHeader()
  private selected = 0
  private lastPointer = { x: Number.NaN, y: Number.NaN }
  private leaving = false
  private syncedCount = -1

  constructor(feats: Feats) {
    super()
    this.feats = feats
    this.tiles = ACHIEVEMENTS.map((def, index) => {
      const tile = new TrophyTile(def, { x: 0, y: 0, width: TILE_W, height: TILE_H })
      tile.onActivate.on(() => this.select(index))
      return tile
    })
    this.header.onBack.on(() => this.leave())
  }

  protected override onEnter(): void {
    this.leaving = false
    this.feats.achievements.check()
    this.ui.clear()
    for (const tile of this.tiles) this.ui.add(tile)
    this.ui.add(this.header.back)
    this.syncTiles()
    const firstLocked = this.tiles.findIndex((tile) => !tile.unlocked)
    this.select(firstLocked >= 0 ? firstLocked : 0)
    this.layout()
  }

  protected override onExit(): void {
    this.ui.clear()
  }

  override resize(): void {
    this.layout()
  }

  private syncTiles(): void {
    const achievements = this.feats.achievements
    this.syncedCount = achievements.count
    for (const tile of this.tiles) {
      tile.unlocked = achievements.isUnlocked(tile.def)
      tile.fraction = achievements.progressOf(tile.def).fraction
    }
  }

  private layout(): void {
    const safe = this.context.viewport.safeArea
    const gridWidth = COLUMNS * TILE_W + (COLUMNS - 1) * GAP
    const x0 = safe.x + (safe.width - gridWidth) / 2
    this.tiles.forEach((tile, index) => {
      tile.setBounds({
        x: x0 + (index % COLUMNS) * (TILE_W + GAP),
        y: safe.y + GRID_TOP + Math.floor(index / COLUMNS) * (TILE_H + GAP),
      })
    })
    this.header.layout(safe)
  }

  private select(index: number): void {
    this.selected = Math.max(0, Math.min(this.tiles.length - 1, index))
    this.tiles.forEach((tile, i) => {
      tile.selected = i === this.selected
    })
  }

  private leave(): void {
    if (this.leaving) return
    this.leaving = true
    this.context.audio.play('uiTap')
    this.context.scenes.change('menu')
  }

  update(dt: number): void {
    if (this.feats.achievements.count !== this.syncedCount) this.syncTiles()
    this.ui.update(dt)
    if (this.leaving) return
    const input = this.context.input
    if (input.wasKeyPressed('Escape') || input.wasKeyPressed('Enter')) {
      this.leave()
      return
    }
    const move = (delta: number): void => {
      this.select((this.selected + delta + this.tiles.length) % this.tiles.length)
      this.context.audio.play('uiTap', { volume: 0.5, pitch: 1.3 })
    }
    if (input.wasKeyPressed('ArrowRight') || input.wasKeyPressed('KeyD')) move(1)
    if (input.wasKeyPressed('ArrowLeft') || input.wasKeyPressed('KeyA')) move(-1)
    if (input.wasKeyPressed('ArrowDown') || input.wasKeyPressed('KeyS')) move(COLUMNS)
    if (input.wasKeyPressed('ArrowUp') || input.wasKeyPressed('KeyW')) move(-COLUMNS)
    if (input.x !== this.lastPointer.x || input.y !== this.lastPointer.y) {
      this.lastPointer = { x: input.x, y: input.y }
      const hovered = this.tiles.findIndex((tile) => tile.hitTest(input.x, input.y))
      if (hovered >= 0 && hovered !== this.selected) this.select(hovered)
    }
    this.ui.handleInput(input)
  }

  render(r: IRenderer): void {
    const viewport = this.context.viewport
    const safe = viewport.safeArea
    const achievements = this.feats.achievements
    r.rect(0, 0, viewport.width, viewport.height, { fill: PALETTE.night })
    this.header.render(r, safe, 'Досягнення')
    r.text(`${achievements.count} / ${achievements.total}`, safe.x + safe.width - HEADER.side, safe.y + HEADER.titleY + 1, {
      fill: PALETTE.ink,
      size: 24,
      weight: 900,
      align: 'right',
      baseline: 'middle',
    })
    this.ui.render(r)
    this.drawDetails(r)
    this.feats.toast.render(r, viewport.width)
  }

  private drawDetails(r: IRenderer): void {
    const tile = this.tiles[this.selected]
    if (!tile) return
    const safe = this.context.viewport.safeArea
    const def = tile.def
    const achievements = this.feats.achievements
    const x = safe.x + 16
    const y = safe.y + GRID_TOP + 4 * (TILE_H + GAP) + 2
    const w = safe.width - 32
    const h = safe.y + safe.height - 8 - y
    const color = gradeColor(def.grade)
    r.roundRect(x, y, w, h, 14, { fill: PALETTE.surface, alpha: 0.95 })
    r.roundRect(x, y, w, h, 14, { stroke: tile.unlocked ? color : PALETTE.surfaceActive, lineWidth: 1.5 })
    drawTrophy(r, def.trophy, def.grade, x + 40, y + h / 2, 48, !tile.unlocked)
    r.text(def.title, x + 80, y + 20, {
      fill: tile.unlocked ? color : PALETTE.ink,
      size: 18,
      weight: 900,
      baseline: 'middle',
    })
    r.text(def.description, x + 80, y + 43, { fill: PALETTE.inkMuted, size: 14, weight: 600, baseline: 'middle' })
    const at = achievements.unlockedAt(def)
    const progress = achievements.progressOf(def)
    let status: string
    if (at !== null) status = `Отримано ${new Date(at).toLocaleDateString('uk-UA')} · ${GRADE_NAMES[def.grade]}`
    else if (def.lowerIsBetter) status = progress.value > 0 ? `Найкраще: ${number(progress.value)} с · треба до ${def.target} с` : 'Ще не пройдено жодного поверху'
    else status = `${number(Math.min(progress.value, progress.target))} / ${number(progress.target)}`
    r.text(status, x + w - 16, y + 20, {
      fill: at !== null ? PALETTE.good : PALETTE.ink,
      size: 15,
      weight: 800,
      align: 'right',
      baseline: 'middle',
    })
  }
}
