import { Button, Scene, UiLayer } from '@sa/core'
import type { GameContext, IRenderer } from '@sa/core'
import { PALETTE } from '../config/palette.js'
import { UI_DANGER_THEME, UI_PRIMARY_THEME, UI_THEME } from '../config/theme.js'
import { tierNumeral, tierTheme } from '../config/tiers.js'
import { LighthouseArt } from '../render/LighthouseArt.js'
import { drawPearl } from '../render/Icons.js'
import { Progress } from '../systems/Progress.js'
import { MAX_PROFILES, MAX_PROFILE_NAME } from '../systems/Profiles.js'
import type { ProfileMeta, Profiles } from '../systems/Profiles.js'
import { FocusRing } from '../ui/FocusRing.js'
import { ScreenHeader } from '../ui/ScreenHeader.js'
import { NameDialog } from '../ui/NameDialog.js'

const ROW_W = 700
const ROW_H = 56
const ROW_GAP = 8
const LIST_TOP = 112
const ACTION_W = 104
const ACTION_H = 38
const ACTION_GAP = 8
const CONFIRM_TIME = 3

type RowAction = 'play' | 'rename' | 'remove' | 'reset'

interface RowButton {
  readonly action: RowAction
  readonly widget: Button
}

interface Row {
  readonly profile: ProfileMeta
  readonly active: boolean
  readonly progress: Progress
  readonly buttons: RowButton[]
}

interface Confirm {
  readonly id: string
  readonly action: RowAction
  timer: number
}

const ACTION_LABELS: Readonly<Record<RowAction, string>> = {
  play: 'Грати',
  rename: 'Назва',
  remove: 'Видалити',
  reset: 'Скинути',
}

const number = (value: number): string => Math.round(value).toLocaleString('uk-UA')

export class ProfilesScene extends Scene<GameContext> {
  readonly name = 'profiles'

  private readonly profiles: Profiles
  private readonly art = new LighthouseArt()
  private readonly ui = new UiLayer()
  private readonly focus = new FocusRing()
  private readonly dialog = new NameDialog()
  private readonly create: Button
  private readonly header = new ScreenHeader()
  private rows: Row[] = []
  private confirm: Confirm | null = null
  private time = 0
  private leaving = false

  constructor(profiles: Profiles) {
    super()
    this.profiles = profiles
    this.create = new Button({
      x: 0,
      y: 0,
      width: 260,
      height: 50,
      label: 'Новий профіль',
      theme: UI_PRIMARY_THEME,
      fontSize: 19,
    })
    this.create.onActivate.on(() => void this.createProfile())
    this.header.onBack.on(() => this.leave())
  }

  protected override onEnter(): void {
    this.leaving = false
    this.confirm = null
    this.rebuild()
  }

  protected override onExit(): void {
    this.dialog.close()
    this.ui.clear()
  }

  override resize(): void {
    this.layout()
  }

  private rebuild(): void {
    const activeId = this.profiles.active.id
    this.rows = this.profiles.list.map((profile) => {
      const active = profile.id === activeId
      const actions: RowAction[] = active ? ['rename', 'reset'] : ['play', 'rename', 'remove']
      const buttons = actions.map((action) => {
        const widget = new Button({
          x: 0,
          y: 0,
          width: ACTION_W,
          height: ACTION_H,
          label: ACTION_LABELS[action],
          theme: action === 'play' ? UI_PRIMARY_THEME : UI_THEME,
          fontSize: 15,
          variant: action === 'play' ? 'solid' : 'ghost',
        })
        widget.onActivate.on(() => void this.act(profile, action))
        return { action, widget }
      })
      return { profile, active, progress: new Progress(this.profiles.storage(profile.id)), buttons }
    })
    this.create.enabled = this.profiles.canCreate
    this.ui.clear()
    for (const row of this.rows) for (const button of row.buttons) this.ui.add(button.widget)
    this.ui.add(this.create)
    this.ui.add(this.header.back)
    this.focus.set([
      ...this.rows.flatMap((row) =>
        row.buttons.map((button) => ({ widget: button.widget, activate: () => void this.act(row.profile, button.action) })),
      ),
      ...(this.create.enabled ? [{ widget: this.create, activate: () => void this.createProfile() }] : []),
    ])
    this.syncConfirm()
    this.layout()
  }

  private layout(): void {
    const safe = this.context.viewport.safeArea
    const x = safe.x + (safe.width - ROW_W) / 2
    this.rows.forEach((row, index) => {
      const y = safe.y + LIST_TOP + index * (ROW_H + ROW_GAP)
      const count = row.buttons.length
      row.buttons.forEach((button, slot) => {
        const right = x + ROW_W - 12 - (count - slot) * ACTION_W - (count - slot - 1) * ACTION_GAP
        button.widget.setBounds({ x: right, y: y + (ROW_H - ACTION_H) / 2 })
      })
    })
    const listBottom = safe.y + LIST_TOP + this.rows.length * (ROW_H + ROW_GAP)
    this.create.setBounds({ x: safe.x + safe.width / 2 - this.create.width / 2, y: listBottom + 10 })
    this.header.layout(safe)
  }

  private async act(profile: ProfileMeta, action: RowAction): Promise<void> {
    if (this.leaving || this.dialog.open) return
    this.context.audio.play('uiTap')
    if (action === 'play') {
      this.profiles.activate(profile.id)
      this.restart()
      return
    }
    if (action === 'rename') {
      const name = await this.dialog.ask('Назва профілю', profile.name, MAX_PROFILE_NAME)
      if (name === null) return
      this.profiles.rename(profile.id, name)
      this.rebuild()
      return
    }
    if (this.confirm?.id !== profile.id || this.confirm.action !== action) {
      this.confirm = { id: profile.id, action, timer: CONFIRM_TIME }
      this.syncConfirm()
      return
    }
    const wasActive = profile.id === this.profiles.active.id
    if (action === 'reset') this.profiles.reset(profile.id)
    else this.profiles.remove(profile.id)
    if (wasActive) {
      this.restart()
      return
    }
    this.confirm = null
    this.rebuild()
  }

  private async createProfile(): Promise<void> {
    if (this.leaving || this.dialog.open || !this.profiles.canCreate) return
    this.context.audio.play('uiTap')
    const name = await this.dialog.ask('Новий профіль', this.profiles.nextName(), MAX_PROFILE_NAME)
    if (name === null) return
    const profile = this.profiles.create(name)
    if (!profile) return
    this.profiles.activate(profile.id)
    this.restart()
  }

  private restart(): void {
    this.leaving = true
    this.context.loop.stop()
    window.location.reload()
  }

  private syncConfirm(): void {
    for (const row of this.rows) {
      for (const button of row.buttons) {
        const asking = this.confirm?.id === row.profile.id && this.confirm.action === button.action
        button.widget.label = asking ? 'Точно?' : ACTION_LABELS[button.action]
        button.widget.setTheme(asking ? UI_DANGER_THEME : button.action === 'play' ? UI_PRIMARY_THEME : UI_THEME)
      }
    }
  }

  private leave(): void {
    if (this.leaving || this.dialog.open) return
    this.leaving = true
    this.context.audio.play('uiTap')
    this.context.scenes.change('menu')
  }

  update(dt: number): void {
    this.time += dt
    this.ui.update(dt)
    if (this.confirm) {
      this.confirm.timer -= dt
      if (this.confirm.timer <= 0) {
        this.confirm = null
        this.syncConfirm()
      }
    }
    if (this.leaving || this.dialog.open) return
    const input = this.context.input
    if (input.wasKeyPressed('Escape')) {
      this.leave()
      return
    }
    if (!this.ui.handleInput(input)) this.focus.handle(input)
  }

  render(r: IRenderer): void {
    const viewport = this.context.viewport
    const safe = viewport.safeArea
    const theme = tierTheme(this.rows.find((row) => row.active)?.progress.tier ?? 1)
    this.art.drawSky(r, viewport.width, viewport.height, this.time, theme)
    this.art.drawSea(r, viewport.width, safe.y + 480, viewport.height, this.time, theme)

    const cx = safe.x + safe.width / 2
    r.text('Профілі', cx, safe.y + 46, {
      fill: PALETTE.accent,
      size: 40,
      weight: 900,
      align: 'center',
      baseline: 'middle',
    })
    r.text('Кожен профіль — окремий прогрес: перли, апгрейди, рекорди й досягнення.', cx, safe.y + 84, {
      fill: PALETTE.ink,
      size: 15,
      weight: 600,
      align: 'center',
      baseline: 'middle',
    })

    const x = safe.x + (safe.width - ROW_W) / 2
    this.rows.forEach((row, index) => this.drawRow(r, row, x, safe.y + LIST_TOP + index * (ROW_H + ROW_GAP)))

    this.ui.render(r)
    this.focus.render(r, this.time)
    if (!this.create.enabled) {
      r.text(`Профілів максимум ${MAX_PROFILES} — видали зайвий, щоб створити новий`, cx, this.create.y + this.create.height + 18, {
        fill: PALETTE.inkMuted,
        size: 13,
        weight: 700,
        align: 'center',
        baseline: 'middle',
      })
    }
  }

  private drawRow(r: IRenderer, row: Row, x: number, y: number): void {
    r.roundRect(x, y, ROW_W, ROW_H, 14, { fill: PALETTE.surface, alpha: 0.92 })
    if (row.active) r.roundRect(x, y, ROW_W, ROW_H, 14, { stroke: PALETTE.accent, lineWidth: 2 })
    r.text(row.profile.name, x + 20, y + 20, { fill: PALETTE.ink, size: 18, weight: 800, baseline: 'middle' })
    const progress = row.progress
    const summaryY = y + 40
    const style = { fill: PALETTE.inkMuted, size: 13, weight: 700, baseline: 'middle' } as const
    const best = progress.bestFloorEver
    const record = best > 0 ? `Рекорд: поверх ${best}` : 'Ще жодного забігу'
    r.text(record, x + 20, summaryY, style)
    let cursor = x + 20 + r.measureText(record, style) + 16
    drawPearl(r, cursor, summaryY, 12, 1, progress.pearlKind)
    const pearls = number(progress.pearls)
    r.text(pearls, cursor + 10, summaryY, style)
    cursor += 10 + r.measureText(pearls, style)
    if (progress.maxTier > 1) r.text(` · складність ${tierNumeral(progress.maxTier)}`, cursor, summaryY, style)
    if (row.active) {
      const tagX = x + ROW_W - 12 - 3 * ACTION_W - 2 * ACTION_GAP + ACTION_W / 2
      r.text('Грає зараз', tagX, y + ROW_H / 2, {
        fill: PALETTE.accent,
        size: 14,
        weight: 800,
        align: 'center',
        baseline: 'middle',
      })
    }
  }
}
