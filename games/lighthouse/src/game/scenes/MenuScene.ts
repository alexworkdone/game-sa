import { Ease, Scene, UiLayer } from '@sa/core'
import type { Button, GameContext, IRenderer, Widget } from '@sa/core'
import { PALETTE } from '../config/palette.js'
import { PEARLS, pearlKindOf } from '../config/pearls.js'
import { PERKS } from '../config/perks.js'
import { tierCostLabel, tierName, tierNumeral, tierTheme } from '../config/tiers.js'
import { UPGRADES } from '../config/upgrades.js'
import type { MenuFeature, MenuUnlockDef } from '../config/unlocks.js'
import { LighthouseArt } from '../render/LighthouseArt.js'
import { StormWave } from '../render/StormWave.js'
import { WorldSeam } from '../render/WorldSeam.js'
import { drawPearl } from '../render/Icons.js'
import type { Progress } from '../systems/Progress.js'
import type { IVolumeControls } from '../systems/VolumeControls.js'
import type { Unlocks } from '../systems/Unlocks.js'
import { BUTTON_SIZES, createButton } from '../ui/Buttons.js'
import { CHIP_PICKER_H, ChipPicker } from '../ui/ChipPicker.js'
import { FocusRing } from '../ui/FocusRing.js'
import { IconButton } from '../ui/IconButton.js'
import { IntroModal } from '../ui/IntroModal.js'
import type { PlayParams } from './PlayScene.js'
import type { Feats } from './Feats.js'

const COLUMN_X = 500
const COLUMN_W = 360
const NOTICE_TIME = 6
const NAV_Y = 162
const NAV_GAP = 10
const NAV_W = (COLUMN_W - NAV_GAP * 2) / 3
const SECTION_GAP = 16
const PANEL_PAD = 10
const PICKER_GAP = 6
const MODAL_X = 250
const TOWER_X = 250
const SEA_Y = 470
const SEA_RISE = 10
const WAVE_REACH = 45
const SLIDE_TIME = 0.6
const SKY_PARALLAX = 0.4

interface WorldSlide {
  readonly from: number
  readonly to: number
  t: number
}

export class MenuScene extends Scene<GameContext> {
  readonly name = 'menu'

  private readonly progress: Progress
  private readonly art = new LighthouseArt()
  private readonly wave = new StormWave()
  private readonly seam = new WorldSeam()
  private readonly ui = new UiLayer()
  private readonly focus = new FocusRing()
  private readonly play: Button
  private readonly continueButton: Button
  private readonly tiers: ChipPicker
  private readonly floors: ChipPicker
  private readonly workshop: Button
  private readonly relics: Button
  private readonly trophies: Button
  private readonly advance: Button
  private readonly feats: Feats
  private readonly unlocks: Unlocks
  private readonly sound: IconButton
  private readonly musicButton: IconButton
  private readonly volume: IVolumeControls
  private readonly profileButton: IconButton
  private readonly modal = new IntroModal()
  private introducing: MenuFeature | null = null
  private worldTier = 0
  private slide: WorldSlide | null = null
  private time = 0
  private leaving = false
  private notice = ''
  private noticeTimer = 0

  constructor(progress: Progress, feats: Feats, unlocks: Unlocks, volume: IVolumeControls) {
    super()
    this.progress = progress
    this.feats = feats
    this.unlocks = unlocks
    this.volume = volume
    this.play = createButton('Грати', 'primary', 'lg', COLUMN_W, 22)
    this.continueButton = createButton('Продовжити', 'primary', 'lg', COLUMN_W, 21)
    const picker = { x: 0, y: 0, width: COLUMN_W - PANEL_PAD * 2, height: CHIP_PICKER_H }
    this.tiers = new ChipPicker(picker, tierNumeral)
    this.floors = new ChipPicker(picker)
    this.workshop = createButton('Майстерня', 'secondary', 'md', NAV_W, 16)
    this.relics = createButton('Реліквії', 'secondary', 'md', NAV_W, 16)
    this.trophies = createButton('Досягнення', 'secondary', 'md', NAV_W, 16)
    this.advance = createButton('Новий рівень складності →', 'primary', 'md', COLUMN_W, 17)
    this.sound = new IconButton({ x: 0, y: 0, width: 42, height: 42, icon: 'sound' })
    this.musicButton = new IconButton({ x: 0, y: 0, width: 42, height: 42, icon: 'music' })
    this.profileButton = new IconButton({ x: 0, y: 0, width: 42, height: 42, icon: 'profile' })
    this.play.onActivate.on(() => this.startGame())
    this.continueButton.onActivate.on(() => this.launch({ continueSaved: true }))
    this.tiers.onChange.on((tier) => this.chooseTier(tier))
    this.floors.onChange.on((floor) => this.chooseStartFloor(floor))
    this.workshop.onActivate.on(() => this.open('workshop'))
    this.relics.onActivate.on(() => this.open('relics'))
    this.trophies.onActivate.on(() => this.open('achievements'))
    this.advance.onActivate.on(() => this.advanceTier())
    this.sound.onActivate.on(() => this.toggleSound())
    this.musicButton.onActivate.on(() => this.toggleMusic())
    this.profileButton.onActivate.on(() => this.open('profiles'))
    this.modal.onClose.on(() => this.finishIntro())
  }

  protected override onEnter(): void {
    this.leaving = false
    this.noticeTimer = 0
    this.feats.achievements.check()
    this.worldTier = this.progress.tier
    this.slide = null
    this.refresh()
    this.focus.focus(this.focusOrder().findIndex((entry) => entry.widget === this.play || entry.widget === this.continueButton))
  }

  protected override onExit(): void {
    this.ui.clear()
  }

  override resize(): void {
    this.layout()
  }

  private refresh(): void {
    const progress = this.progress
    if (this.worldTier !== progress.tier) {
      this.slide = { from: this.worldTier, to: progress.tier, t: 0 }
      this.worldTier = progress.tier
    }
    const reachable = progress.maxTier + (progress.canAdvance ? 1 : 0)
    this.tiers.setChoices(Array.from({ length: reachable }, (_, i) => i + 1), [], progress.tier)
    this.tiers.visible = this.unlocks.isOpen('tiers')
    this.floors.visible = this.unlocks.isOpen('floors')
    this.relics.visible = this.unlocks.isOpen('relics')
    this.trophies.visible = this.unlocks.isOpen('achievements')
    this.floors.setChoices(progress.checkpoints(), progress.lockedCheckpoints(2), progress.startFloor)
    this.sound.level = this.volume.soundLevel
    this.musicButton.level = this.volume.musicLevel
    this.advance.visible = progress.canAdvance
    this.tiers.label = `Складність: ${tierName(progress.tier)}`
    this.floors.label = this.floorsLabel()
    const saved = progress.savedRun
    this.continueButton.visible = saved !== null
    this.continueButton.label = saved ? `Продовжити — поверх ${saved.floor}` : 'Продовжити'
    this.play.visible = saved === null

    this.ui.clear()
    const widgets = [
      this.play,
      this.continueButton,
      this.tiers,
      this.floors,
      this.workshop,
      this.relics,
      this.trophies,
      this.advance,
      this.sound,
      this.musicButton,
      this.profileButton,
    ]
    for (const widget of widgets) if (widget.visible) this.ui.add(widget)
    this.focus.set(this.focusOrder())
    this.layout()
    if (!this.modal.open) this.showNextIntro()
  }

  private focusOrder(): { widget: Widget; activate: () => void; adjust?: (delta: number) => void }[] {
    const entries = [
      { widget: this.workshop, activate: () => this.open('workshop') },
      { widget: this.relics, activate: () => this.open('relics') },
      { widget: this.trophies, activate: () => this.open('achievements') },
      { widget: this.tiers, activate: () => this.startGame(), adjust: (delta: number) => this.tiers.step(delta) },
      { widget: this.floors, activate: () => this.startGame(), adjust: (delta: number) => this.floors.step(delta) },
      { widget: this.play, activate: () => this.startGame() },
      { widget: this.continueButton, activate: () => this.launch({ continueSaved: true }) },
      { widget: this.advance, activate: () => this.advanceTier() },
    ]
    return entries.filter((entry) => entry.widget.visible)
  }

  private get pickers(): ChipPicker[] {
    return [this.tiers, this.floors].filter((picker) => picker.visible)
  }

  private get panelHeight(): number {
    const count = this.pickers.length
    return count === 0 ? 0 : PANEL_PAD * 2 + count * CHIP_PICKER_H + (count - 1) * PICKER_GAP
  }

  private get panelY(): number {
    return this.context.viewport.safeArea.y + NAV_Y + BUTTON_SIZES.md.height + SECTION_GAP
  }

  private layout(): void {
    const safe = this.context.viewport.safeArea
    const x = safe.x + COLUMN_X
    const row = [this.workshop, this.relics, this.trophies].filter((button) => button.visible)
    const width = (COLUMN_W - NAV_GAP * (row.length - 1)) / row.length
    row.forEach((button, index) => button.setBounds({ x: x + index * (width + NAV_GAP), y: safe.y + NAV_Y, width }))
    let y = this.panelY + PANEL_PAD
    for (const picker of this.pickers) {
      picker.setBounds({ x: x + PANEL_PAD, y })
      y += CHIP_PICKER_H + PICKER_GAP
    }
    y = this.panelHeight > 0 ? this.panelY + this.panelHeight + SECTION_GAP : this.panelY
    this.play.setBounds({ x, y })
    this.continueButton.setBounds({ x, y })
    y += this.play.height + NAV_GAP
    this.advance.setBounds({ x, y })
    this.sound.setBounds({ x: safe.x + safe.width - 58, y: safe.y + 14 })
    this.musicButton.setBounds({ x: this.sound.x - 52, y: this.sound.y })
    this.profileButton.setBounds({ x: this.musicButton.x - 52, y: this.sound.y })
  }

  private showNextIntro(): void {
    const def = this.unlocks.nextIntro()
    if (!def) return
    this.introducing = def.id
    this.modal.show(def, this.featureWidget(def))
    this.context.audio.play('achievement')
  }

  private finishIntro(): void {
    if (this.introducing) this.unlocks.markIntroduced(this.introducing)
    this.introducing = null
    this.context.audio.play('uiTap')
    this.showNextIntro()
  }

  private floorsLabel(): string {
    const progress = this.progress
    const every = progress.checkpoints()[1] ?? progress.lockedCheckpoints(1)[0] ?? 5
    return `Старт з поверху · кожен ${every}-й зберігається`
  }

  private featureWidget(def: MenuUnlockDef): Widget | null {
    switch (def.id) {
      case 'floors':
        return this.floors
      case 'achievements':
        return this.trophies
      case 'relics':
        return this.relics
      case 'tiers':
        return this.tiers
      case 'streak':
        return null
    }
  }

  private startGame(): void {
    if (this.progress.savedRun) this.launch({ continueSaved: true })
    else this.launch({ startFloor: this.progress.startFloor })
  }

  private launch(params: PlayParams): void {
    if (this.leaving) return
    this.leaving = true
    this.context.audio.play('uiTap')
    this.context.scenes.change('play', params)
  }

  private open(scene: 'workshop' | 'relics' | 'achievements' | 'profiles'): void {
    if (this.leaving) return
    this.leaving = true
    this.context.audio.play('uiTap')
    this.context.scenes.change(scene)
  }

  private chooseTier(tier: number): void {
    if (tier > this.progress.maxTier) {
      this.advanceTier()
      return
    }
    this.progress.setTier(tier)
    this.context.audio.play('uiTap', { pitch: 0.8 + tier * 0.1 })
    this.refresh()
  }

  private chooseStartFloor(floor: number): void {
    this.progress.setStartFloor(floor)
    this.context.audio.play('uiTap', { pitch: 1 + floor / 100 })
  }

  private advanceTier(): void {
    if (this.leaving || !this.progress.canAdvance) return
    const tier = this.progress.advanceTier()
    this.context.audio.play('floorClear')
    this.feats.achievements.check()
    this.notice = `Відкрито «${tierName(tier)}»: апгрейди з нуля за ${PEARLS[pearlKindOf(tier)].name}, ціни ${tierCostLabel(tier)}. Реліквії відкрито!`
    this.noticeTimer = NOTICE_TIME
    this.refresh()
  }

  private toggleSound(): void {
    this.sound.level = this.volume.cycleSound()
    this.context.audio.play('uiTap')
  }

  private toggleMusic(): void {
    this.musicButton.level = this.volume.cycleMusic()
    this.context.audio.play('uiTap')
  }

  update(dt: number): void {
    this.time += dt
    this.noticeTimer = Math.max(0, this.noticeTimer - dt)
    if (this.slide) {
      this.slide.t += dt / SLIDE_TIME
      if (this.slide.t >= 1) this.slide = null
    }
    this.wave.update(dt)
    this.ui.update(dt)
    const input = this.context.input
    if (this.modal.open) {
      this.modal.update(dt, input)
      return
    }
    if (this.leaving) return
    if (!this.ui.handleInput(input)) this.focus.handle(input)
    if (input.wasKeyPressed('KeyM')) this.toggleSound()
    if (input.wasKeyPressed('KeyN')) this.toggleMusic()
  }

  render(r: IRenderer): void {
    const viewport = this.context.viewport
    const safe = viewport.safeArea
    const progress = this.progress
    const slide = this.slide
    if (slide) {
      const eased = Ease.inOutCubic(Math.min(1, slide.t))
      const shift = viewport.width * Math.sign(slide.to - slide.from)
      const incoming = shift * (1 - eased)
      this.drawWorld(r, slide.from, -shift * eased)
      this.drawWorld(r, slide.to, incoming)
      const seamX = shift > 0 ? incoming : incoming + viewport.width
      this.seam.draw(r, seamX, viewport.height, Math.sin(Math.PI * eased), tierTheme(slide.to))
    } else {
      this.drawWorld(r, progress.tier, 0)
    }

    const cx = safe.x + COLUMN_X + COLUMN_W / 2
    r.text('МАЯК', cx, safe.y + 66, {
      fill: PALETTE.accent,
      size: 66,
      weight: 900,
      align: 'center',
      baseline: 'middle',
      glow: PALETTE.coatShade,
      glowSize: 24,
    })
    r.text('Шторм затоплює маяк. Збирай ключі, тікай нагору.', cx, safe.y + 112, {
      fill: PALETTE.ink,
      size: 15,
      weight: 600,
      align: 'center',
      baseline: 'middle',
    })
    const best = progress.bestFloor
    const info = best > 0 ? `Рекорд: поверх ${best}` : 'Ще жодного забігу'
    const infoY = safe.y + 140
    r.text(info, cx - 18, infoY, {
      fill: PALETTE.inkMuted,
      size: 15,
      weight: 700,
      align: 'right',
      baseline: 'middle',
    })
    r.line(cx - 4, infoY - 7, cx - 4, infoY + 7, 1.5, { stroke: PALETTE.surfaceActive })
    drawPearl(r, cx + 14, infoY, 14, 1, progress.pearlKind)
    r.text(String(progress.pearls), cx + 26, infoY + 1, { fill: PALETTE.ink, size: 15, weight: 800, baseline: 'middle' })

    const panelH = this.panelHeight
    if (panelH > 0) {
      const px = safe.x + COLUMN_X
      r.roundRect(px, this.panelY, COLUMN_W, panelH, 16, { fill: PALETTE.night, alpha: 0.6 })
      r.roundRect(px, this.panelY, COLUMN_W, panelH, 16, { stroke: PALETTE.surfaceActive, lineWidth: 1.5, alpha: 0.8 })
    }

    this.ui.render(r)
    this.drawBadges(r)
    this.focus.render(r, this.time)

    const footer = this.noticeTimer > 0 ? this.notice : '← → ходити · ↑ ↓ драбини · Пробіл — постріл · R — перезарядка · Esc — пауза'
    r.text(footer, safe.x + safe.width / 2, safe.y + safe.height - 20, {
      fill: this.noticeTimer > 0 ? PALETTE.good : PALETTE.ink,
      size: 14,
      weight: 700,
      align: 'center',
      baseline: 'middle',
      alpha: this.noticeTimer > 0 ? 1 : 0.75,
    })
    this.modal.render(r, viewport.width, viewport.height, safe.x + MODAL_X, this.time)
    this.feats.toast.render(r, viewport.width)
  }

  private drawWorld(r: IRenderer, tier: number, offset: number): void {
    const viewport = this.context.viewport
    const safe = viewport.safeArea
    const theme = tierTheme(tier)
    r.push()
    r.translate(offset, 0)
    r.clip({ kind: 'rect', x: 0, y: 0, width: viewport.width, height: viewport.height })
    r.push()
    r.translate(-offset * (1 - SKY_PARALLAX), 0)
    this.art.drawSky(r, viewport.width, viewport.height, this.time, theme)
    r.pop()
    this.art.drawTower(r, safe.x + TOWER_X, safe.y + SEA_Y, 1.2, this.time, theme)
    this.wave.draw(r, safe.x + TOWER_X - WAVE_REACH, safe.y + SEA_Y, this.time, theme, tier)
    this.art.drawSea(r, viewport.width, safe.y + SEA_Y - SEA_RISE, viewport.height, this.time, theme)
    r.pop()
  }

  private drawBadges(r: IRenderer): void {
    const pulse = 0.6 + Math.sin(this.time * 5) * 0.4
    const corner = (button: Button): readonly [number, number] => [button.x + button.width - 5, button.y + 5]
    const dot = (button: Button): void => {
      const [x, y] = corner(button)
      r.circle(x, y, 7, { fill: PALETTE.night })
      r.circle(x, y, 5, { fill: PALETTE.accent, alpha: pulse, glow: PALETTE.accent, glowSize: 10 })
    }
    if (UPGRADES.some((def) => this.progress.canAfford(def))) dot(this.workshop)
    if (!this.relics.visible) return
    if (PERKS.some((def) => this.progress.canAffordPerk(def))) dot(this.relics)
    if (!this.progress.perksUnlocked) {
      const [x, y] = corner(this.relics)
      r.circle(x, y, 9, { fill: PALETTE.night })
      r.roundRect(x - 4.5, y - 1.5, 9, 7, 1.5, { fill: PALETTE.inkMuted })
      r.arc(x, y - 1.5, 3, Math.PI, Math.PI * 2, 1.5, { stroke: PALETTE.inkMuted })
    }
  }
}
