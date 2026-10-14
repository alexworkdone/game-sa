import { CoreEvent, Scene, SeededRandom, UiLayer } from '@sa/core'
import type { Button, GameContext, IRenderer, Widget } from '@sa/core'
import { BALANCE, clearBonus } from '../config/balance.js'
import { DEATH_TITLES, pickEpitaph } from '../config/epitaphs.js'
import type { DeathCause } from '../config/epitaphs.js'
import { LAYOUT, LEVEL_HEIGHT, LEVEL_WIDTH } from '../config/layout.js'
import { PALETTE } from '../config/palette.js'
import { PEARLS, pearlKindOf } from '../config/pearls.js'
import type { SfxName } from '../config/sfx.js'
import { UPGRADES } from '../config/upgrades.js'
import { TIER_HAZARD_HINTS } from '../config/hazards.js'
import { tierName, tierTheme } from '../config/tiers.js'
import { variantDef } from '../config/variants.js'
import { KIT_DOUBLE_START, KIT_EVERY_FLOOR, KIT_GUARDIAN_FLOORS, KIT_RUN_START } from '../config/perks.js'
import type { PerkEffects } from '../config/perks.js'
import { KIT_POWER_UPS, POWER_UPS, TIMED_POWER_UPS } from '../config/powerups.js'
import type { TimedPowerUp } from '../config/powerups.js'
import type { IControls } from '../controls/IControls.js'
import type { TouchControls } from '../controls/TouchControls.js'
import type { Enemy } from '../entities/Enemy.js'
import type { IEnemyFactory } from '../entities/EnemyFactory.js'
import { isPowerUpKind } from '../entities/Pickup.js'
import type { PickupKind } from '../entities/Pickup.js'
import type { ILevelGenerator } from '../level/ILevelGenerator.js'
import { WorldPainter } from '../render/WorldPainter.js'
import { CalloutPainter } from '../render/CalloutPainter.js'
import { drawPearl, drawPowerGlyph, drawKey, powerColor } from '../render/Icons.js'
import { resolveStats } from '../systems/HeroStats.js'
import type { HeroStats } from '../systems/HeroStats.js'
import type { Progress, RunRecordResult, SavedRun } from '../systems/Progress.js'
import type { Tips } from '../systems/Tips.js'
import type { Unlocks } from '../systems/Unlocks.js'
import type { IVolumeControls } from '../systems/VolumeControls.js'
import { Tutorial } from '../systems/Tutorial.js'
import type { Feats } from './Feats.js'
import { World } from '../systems/World.js'
import type { HurtCause, WorldListener } from '../systems/World.js'
import { BUTTON_SIZES, createButton } from '../ui/Buttons.js'
import { FocusRing } from '../ui/FocusRing.js'
import { IconButton } from '../ui/IconButton.js'
import { VolumeButton } from '../ui/VolumeButton.js'
import { Hud } from './Hud.js'
import type { HudFrame } from './Hud.js'

export interface PlayParams {
  readonly startFloor?: number
  readonly resume?: boolean
  readonly continueSaved?: boolean
}

export interface RunSummary {
  readonly startFloor: number
  readonly floorReached: number
  readonly pearls: number
  readonly kills: number
  readonly cause: DeathCause
  readonly epitaph: string
  readonly record: RunRecordResult
  readonly keysUnderwater: number
}

export interface ControlRig {
  readonly controls: IControls
  readonly touch: TouchControls
}

export type ControlRigFactory = (context: GameContext) => ControlRig

type Phase = 'playing' | 'clearing' | 'break' | 'dying' | 'leaving'

interface Banner {
  readonly title: string
  readonly subtitle: string
  readonly color: string
  readonly duration: number
  timer: number
}

const CLEAR_TIME = 1.8
const DEATH_TIME = 2
const BANNER_TIME = 2.3
const BREAK_W = 580
const BREAK_H = 248
const BREAK_PAD = 28
const BREAK_GAP = 12
const BREAK_SECONDARY_W = 140
const PAUSE_W = 260
const PAUSE_GAP = 8
const PAUSE_STEP = BUTTON_SIZES.md.height + 10


const ENEMY_COLORS: Readonly<Record<Enemy['kind'], readonly string[]>> = {
  crab: [PALETTE.crab, PALETTE.crabShade, PALETTE.flareCore],
  jelly: [PALETTE.jelly, PALETTE.jellyCore, '#ffffff'],
  octopus: [PALETTE.octopus, PALETTE.octopusShade, PALETTE.flareCore],
  urchin: [PALETTE.urchinSpike, PALETTE.urchin, PALETTE.spine],
  guardian: [PALETTE.octopus, PALETTE.octopusShade, PALETTE.inkGlow],
}

export class PlayScene extends Scene<GameContext> implements WorldListener {
  readonly name = 'play'

  private readonly progress: Progress
  private readonly generator: ILevelGenerator
  private readonly enemyFactory: IEnemyFactory
  private readonly rigFactory: ControlRigFactory
  private readonly painter = new WorldPainter()
  private readonly callouts = new CalloutPainter()
  private readonly tutorial: Tutorial
  private readonly hud = new Hud()
  private readonly ui = new UiLayer()
  private readonly pauseUi = new UiLayer()
  private readonly focus = new FocusRing()
  private readonly pauseButton: IconButton
  private pauseRows: Widget[][] = []
  private readonly breakUi = new UiLayer()
  private readonly breakFocus = new FocusRing()
  private readonly breakContinue: Button
  private readonly breakWorkshop: Button
  private readonly breakMenu: Button
  private breakPicked = 0
  private breakBonus = 0
  private floorBonus = 0
  private breakStreak = 1
  private streak = 0
  private hazardHinted = false
  private readonly bannerQueue: Banner[] = []
  private runActive = false
  private awaitingWorkshop = false

  private rig: ControlRig | null = null
  private world: World | null = null
  private random = new SeededRandom('boot')
  private stats: HeroStats
  private phase: Phase = 'playing'
  private paused = false
  private phaseTimer = 0
  private startFloor = 1
  private bestBefore = 0
  private floor = 1
  private hp = 3
  private runPearls = 0
  private kills = 0
  private time = 0
  private banner: Banner | null = null
  private flash = 0
  private fade = 0
  private thunderTimer = 9
  private bubbleTimer = 0
  private readonly lastSeconds = new Map<TimedPowerUp, number>()
  private readonly feats: Feats
  private readonly unlocks: Unlocks
  private readonly volume: IVolumeControls
  private featTimer = 0
  private clearTime = 0
  private bossTrail = 1
  private tier = 1
  private effects: PerkEffects
  private secondWinds = 0
  private bossBannerUntil = 0
  private pearlChain = 0
  private pearlChainTimer = 0
  private lastCause: DeathCause = 'crab'
  private epitaph = ''
  private gameplayActive = false
  private levelX = 0
  private levelY = 0
  private hudFrame: HudFrame = { x: 0, y: 0, width: LEVEL_WIDTH, height: LAYOUT.hudHeight }

  constructor(
    progress: Progress,
    generator: ILevelGenerator,
    enemyFactory: IEnemyFactory,
    rigFactory: ControlRigFactory,
    tips: Tips,
    feats: Feats,
    unlocks: Unlocks,
    volume: IVolumeControls,
  ) {
    super()
    this.feats = feats
    this.unlocks = unlocks
    this.volume = volume
    this.tutorial = new Tutorial(tips)
    this.progress = progress
    this.generator = generator
    this.enemyFactory = enemyFactory
    this.rigFactory = rigFactory
    this.stats = resolveStats(progress.levels)
    this.effects = progress.effects
    this.pauseButton = new IconButton({ x: 0, y: 0, width: 36, height: 36, icon: 'pause' })
    this.pauseButton.onActivate.on(() => this.setPaused(true))
    const continueW = BREAK_W - BREAK_PAD * 2 - BREAK_SECONDARY_W * 2 - BREAK_GAP * 2
    this.breakMenu = createButton('У меню', 'ghost', 'md', BREAK_SECONDARY_W, 18)
    this.breakWorkshop = createButton('Майстерня', 'secondary', 'md', BREAK_SECONDARY_W, 18)
    this.breakContinue = createButton('', 'primary', 'md', continueW, 19)
    this.breakMenu.onActivate.on(() => this.exitToMenu())
    this.breakWorkshop.onActivate.on(() => this.openWorkshop())
    this.breakContinue.onActivate.on(() => this.continueRun())
    this.breakUi.add(this.breakMenu)
    this.breakUi.add(this.breakWorkshop)
    this.breakUi.add(this.breakContinue)
    this.breakFocus.set([
      { widget: this.breakMenu, activate: () => this.exitToMenu() },
      { widget: this.breakWorkshop, activate: () => this.openWorkshop() },
      { widget: this.breakContinue, activate: () => this.continueRun() },
    ])
  }

  protected override onEnter(params?: unknown): void {
    const options = (params as PlayParams | undefined) ?? {}
    this.rig ??= this.rigFactory(this.context)
    this.ui.clear()
    this.ui.add(this.pauseButton)
    this.buildPauseUi()
    this.paused = false
    const saved = this.progress.savedRun
    if (options.continueSaved && saved) this.loadRun(saved)
    else if (options.resume && this.runActive) this.resumeRun()
    else this.startRun(options.startFloor ?? 1)
  }

  private loadRun(saved: SavedRun): void {
    this.progress.setTier(saved.tier)
    this.stats = resolveStats(this.progress.levels)
    this.effects = this.progress.effects
    this.tier = saved.tier
    this.secondWinds = saved.secondWinds ?? (saved.secondWindReady ? 1 : 0)
    this.random = new SeededRandom(`${Date.now()}-${Math.random()}`)
    this.startFloor = saved.startFloor
    this.bestBefore = saved.bestBefore ?? this.progress.bestFloor
    this.floor = saved.floor
    this.hp = saved.hp
    this.runPearls = saved.runPearls
    this.kills = saved.kills
    this.time = 0
    this.lastCause = 'crab'
    this.epitaph = ''
    this.thunderTimer = 6 + Math.random() * 6
    this.runActive = true
    this.awaitingWorkshop = false
    this.resetSession()
    this.beginFloor()
    this.startGameplay()
  }

  private resetSession(): void {
    this.streak = 0
    this.breakStreak = 1
    this.hazardHinted = false
  }

  private get streakMultiplier(): number {
    if (!this.unlocks.isOpen('streak')) return 1
    const config = BALANCE.streak
    return Math.min(config.max, 1 + config.step * this.streak)
  }

  private autosave(floor: number, hp: number): void {
    this.progress.saveRun({
      tier: this.tier,
      startFloor: this.startFloor,
      floor,
      hp,
      runPearls: this.runPearls,
      kills: this.kills,
      secondWinds: this.secondWinds,
      bestBefore: this.bestBefore,
    })
  }

  private exitToMenu(): void {
    if (this.phase === 'leaving' || this.awaitingWorkshop) return
    this.sfx('uiTap')
    this.paused = false
    this.phase = 'leaving'
    this.stopGameplay()
    this.context.scenes.change('menu')
  }

  private startRun(startFloor: number): void {
    this.stats = resolveStats(this.progress.levels)
    this.effects = this.progress.effects
    this.tier = this.progress.tier
    this.secondWinds = this.effects.secondWinds
    this.random = new SeededRandom(`${Date.now()}-${Math.random()}`)
    this.startFloor = startFloor
    this.bestBefore = this.progress.bestFloor
    this.floor = startFloor
    this.hp = this.stats.maxHp + this.effects.spareHearts + (startFloor > 1 ? this.effects.liftHeart : 0)
    this.runPearls = 0
    this.kills = 0
    this.time = 0
    this.lastCause = 'crab'
    this.epitaph = ''
    this.thunderTimer = 6 + Math.random() * 6
    this.runActive = true
    this.awaitingWorkshop = false
    this.resetSession()
    this.beginFloor()
    this.startGameplay()
    this.context.analytics.track(CoreEvent.GameplayStart, { floor: startFloor })
  }

  private resumeRun(): void {
    const previousMax = this.stats.maxHp
    this.stats = resolveStats(this.progress.levels)
    this.effects = this.progress.effects
    if (this.stats.maxHp > previousMax) this.hp += this.stats.maxHp - previousMax
    this.awaitingWorkshop = false
    this.continueRun()
  }

  private enterBreak(): void {
    const world = this.world
    if (!world) return
    this.breakPicked = world.pearlsPicked
    this.breakBonus = this.floorBonus
    this.progress.addPearls(world.pearlsCollected)
    this.runPearls += world.pearlsCollected
    world.pearlsCollected = 0
    this.bankTally(world)
    this.progress.bump('floorsCleared')
    this.progress.reachFloor(this.floor + 1)
    if (world.hurtCount === 0) this.progress.bump('noHitFloors')
    if (world.hurtCount === 0 && world.guardian) this.progress.bump('noHitGuardians')
    this.progress.lower('fastestFloor', this.clearTime)
    this.feats.achievements.check()
    this.hp = world.hero.hp
    this.autosave(this.floor + 1, this.hp)
    this.context.analytics.track('floor_clear', { floor: this.floor, time: Math.round(world.time) })
    this.phase = 'break'
    this.banner = null
    this.stopGameplay()
    this.rig?.touch.setEnabled(false)
    this.breakContinue.label = `Далі — поверх ${this.floor + 1}`
    this.breakFocus.focus(2)
  }

  private bankTally(world: World): void {
    const tally = world.takeTally()
    this.kills += tally.kills
    this.progress.addKills(tally.kills)
    this.progress.bump('keys', tally.keys)
    this.progress.bump('powerUps', tally.powerUps)
    this.progress.bump('underwaterKeys', tally.underwaterKeys)
  }

  private continueRun(): void {
    if (this.phase !== 'break' || this.awaitingWorkshop) return
    this.sfx('uiTap')
    this.floor += 1
    this.rig?.touch.setEnabled(true)
    this.beginFloor()
    this.startGameplay()
  }

  private openWorkshop(): void {
    if (this.phase !== 'break' || this.awaitingWorkshop) return
    this.sfx('uiTap')
    this.awaitingWorkshop = true
    this.context.scenes.change('workshop', { nextFloor: this.floor + 1 })
  }

  protected override onExit(): void {
    this.stopGameplay()
    this.rig?.touch.setEnabled(true)
    this.world = null
    this.context.juice.clear()
  }

  override pause(): void {
    if (this.phase === 'playing') this.setPaused(true)
  }

  private startGameplay(): void {
    if (this.gameplayActive) return
    this.gameplayActive = true
    this.context.portal.gameplayStart()
  }

  private stopGameplay(): void {
    if (!this.gameplayActive) return
    this.gameplayActive = false
    this.context.portal.gameplayStop()
  }

  private beginFloor(): void {
    const blueprint = this.generator.generate(this.floor, this.random.fork(`floor-${this.floor}`))
    this.world = new World({
      blueprint,
      stats: this.stats,
      hp: this.hp,
      random: this.random.fork(`world-${this.floor}`),
      enemyFactory: this.enemyFactory,
      listener: this,
      tier: this.tier,
      modifiers: this.effects,
      secondWinds: this.secondWinds,
    })
    this.painter.prepare(this.world, tierTheme(this.tier))
    this.autosave(this.floor, this.hp)
    const kit = this.effects.kit
    const runStart = this.floor === this.startFloor
    if (kit >= KIT_EVERY_FLOOR || (kit >= KIT_GUARDIAN_FLOORS && this.world.guardian) || (kit >= KIT_RUN_START && runStart)) {
      this.grantKit(this.world)
    }
    if (kit >= KIT_DOUBLE_START && runStart) this.grantKit(this.world)
    this.context.juice.clear()
    this.phase = 'playing'
    this.phaseTimer = 0
    this.fade = 1
    this.bossTrail = 1
    this.bannerQueue.length = 0
    const variant = this.world.variant ? variantDef(this.world.variant) : null
    if (this.world.guardian) {
      this.showBanner(
        `Поверх ${this.floor}: вартовий!`,
        `Збери ${this.world.keysTotal} ключів і здолай восьминога на дверях`,
        PALETTE.octopus,
        3,
      )
    } else if (variant) {
      this.showBanner(`Поверх ${this.floor} · ${variant.title}`, variant.hint, PALETTE.accent, 3)
    } else {
      this.showBanner(
        `Поверх ${this.floor}`,
        `Збери ${this.world.keysTotal} ключів — і двері нагору відчиняться`,
        PALETTE.accent,
      )
    }
    const theme = tierTheme(this.tier)
    if (theme.hazard !== 'none' && !this.hazardHinted) {
      this.hazardHinted = true
      this.queueBanner(tierName(this.tier), TIER_HAZARD_HINTS[theme.hazard], theme.waterFoam, 3.4)
    }
  }

  private showBanner(title: string, subtitle: string, color: string, duration = BANNER_TIME): void {
    this.banner = { title, subtitle, color, duration, timer: duration }
  }

  private queueBanner(title: string, subtitle: string, color: string, duration = BANNER_TIME): void {
    if (!this.banner) {
      this.showBanner(title, subtitle, color, duration)
      return
    }
    this.bannerQueue.push({ title, subtitle, color, duration, timer: duration })
  }

  private buildPauseUi(): void {
    this.pauseUi.clear()
    const half = { x: 0, y: 0, width: (PAUSE_W - PAUSE_GAP) / 2, height: BUTTON_SIZES.md.height }
    const resume = createButton('Продовжити', 'primary', 'md', PAUSE_W, 18)
    const sound = new VolumeButton(half, 'Звук')
    const music = new VolumeButton(half, 'Музика')
    const menu = createButton('Вийти в меню', 'secondary', 'md', PAUSE_W, 18)
    const quit = createButton('Завершити забіг', 'ghost', 'md', PAUSE_W, 18)
    sound.level = this.volume.soundLevel
    music.level = this.volume.musicLevel
    const entries = [
      { widget: resume, activate: () => this.setPaused(false) },
      { widget: sound, activate: () => (sound.level = this.volume.cycleSound()) },
      { widget: music, activate: () => (music.level = this.volume.cycleMusic()) },
      { widget: menu, activate: () => this.exitToMenu() },
      { widget: quit, activate: () => this.quitRun() },
    ].map((entry) => ({
      widget: entry.widget,
      activate: (): void => {
        entry.activate()
        this.sfx('uiTap')
      },
    }))
    for (const entry of entries) {
      entry.widget.onActivate.on(() => entry.activate())
      this.pauseUi.add(entry.widget)
    }
    this.pauseRows = [[resume], [sound, music], [menu], [quit]]
    this.focus.set(entries)
  }

  private setPaused(paused: boolean): void {
    if (this.paused === paused || this.phase === 'leaving') return
    this.paused = paused
    this.rig?.touch.setEnabled(!paused)
    if (paused) {
      this.focus.focus(0)
      this.stopGameplay()
    } else {
      this.startGameplay()
    }
  }

  private quitRun(): void {
    this.paused = false
    this.lastCause = 'quit'
    this.epitaph = pickEpitaph('quit')
    this.finishRun()
  }

  update(dt: number): void {
    const rig = this.rig
    const world = this.world
    if (!rig || !world) return
    const { input } = this.context
    this.time += dt

    if (this.paused) {
      this.pauseUi.update(dt)
      if (!this.pauseUi.handleInput(input)) this.focus.handle(input)
      if (rig.controls.pausePressed) this.setPaused(false)
      rig.controls.endStep()
      return
    }

    if (this.phase === 'break') {
      this.breakUi.update(dt)
      if (!this.awaitingWorkshop && !this.breakUi.handleInput(input)) this.breakFocus.handle(input)
      rig.controls.endStep()
      this.hud.update(dt)
      return
    }

    this.ui.update(dt)
    this.ui.handleInput(input)
    if (rig.controls.pausePressed && this.phase === 'playing') {
      this.setPaused(true)
      rig.controls.endStep()
      return
    }

    if (this.phase !== 'leaving') world.update(dt, rig.controls)
    rig.controls.endStep()
    if (this.phase === 'playing') this.tutorial.update(dt, world)

    this.hud.update(dt)
    this.fade = Math.max(0, this.fade - dt * 2.5)
    this.flash = Math.max(0, this.flash - dt)
    this.pearlChainTimer -= dt
    if (this.pearlChainTimer <= 0) this.pearlChain = 0
    if (this.banner) {
      this.banner.timer -= dt
      if (this.banner.timer <= 0) this.banner = this.bannerQueue.shift() ?? null
    }
    this.updateStorm(dt)
    this.updateBubbles(dt, world)
    this.updateTicks(world)
    this.updateBossTrail(dt, world)
    this.updateFeats(dt, world)

    if (this.phase === 'clearing') {
      this.phaseTimer -= dt
      if (this.phaseTimer <= 0) this.enterBreak()
    } else if (this.phase === 'dying') {
      this.phaseTimer -= dt
      if (this.phaseTimer <= 0) this.finishRun()
    }
  }

  private updateFeats(dt: number, world: World): void {
    if (world.hero.alive) this.progress.raise('maxHearts', world.hero.hp)
    this.featTimer -= dt
    if (this.featTimer > 0) return
    this.featTimer = 0.5
    this.feats.achievements.check()
  }

  private updateBossTrail(dt: number, world: World): void {
    const boss = world.guardian
    if (!boss) return
    const target = Math.max(0, boss.hp) / boss.maxHp
    this.bossTrail = this.bossTrail > target ? Math.max(target, this.bossTrail - dt * 0.5) : target
  }

  private updateTicks(world: World): void {
    for (const kind of TIMED_POWER_UPS) {
      const left = world.powerUps.remaining(kind)
      const seconds = Math.ceil(left)
      const previous = this.lastSeconds.get(kind) ?? 0
      if (POWER_UPS[kind].warn && left > 0 && seconds <= 3 && seconds < previous) {
        this.sfx('tick', { pitch: 1 + (3 - seconds) * 0.12 })
      }
      this.lastSeconds.set(kind, seconds)
    }
  }

  private updateBubbles(dt: number, world: World): void {
    const hero = world.hero
    if (!hero.alive || !hero.underwater) return
    this.bubbleTimer -= dt
    if (this.bubbleTimer > 0) return
    this.bubbleTimer = 0.35
    this.context.juice.particles.emit({
      x: hero.x + hero.facing * 5,
      y: hero.headY,
      count: 1,
      angle: -Math.PI / 2,
      spread: 0.5,
      speedMin: 20,
      speedMax: 40,
      lifeMin: 0.6,
      lifeMax: 1,
      sizeMin: 1.5,
      sizeMax: 2.5,
      colors: [PALETTE.waterFoam],
      gravity: -40,
      drag: 0.5,
    })
  }

  private updateStorm(dt: number): void {
    this.thunderTimer -= dt
    if (this.thunderTimer > 0) return
    this.thunderTimer = 9 + Math.random() * 10
    this.flash = 0.14
    this.sfx('thunder', { delay: 0.2 + Math.random() * 0.4 })
  }

  private finishRun(): void {
    if (this.phase === 'leaving') return
    const world = this.world
    const keysUnderwater = world?.keysUnderwater ?? 0
    if (world) {
      this.progress.addPearls(world.pearlsCollected)
      this.runPearls += world.pearlsCollected
      world.pearlsCollected = 0
      this.bankTally(world)
    }
    if (this.lastCause !== 'quit') this.progress.recordDeath(this.lastCause)
    this.phase = 'leaving'
    this.runActive = false
    this.progress.clearRun()
    this.stopGameplay()
    const record = this.progress.recordRun({
      floorReached: this.floor,
      previousBest: this.bestBefore,
      pearls: this.runPearls,
      kills: this.kills,
    })
    const { analytics } = this.context
    analytics.track(CoreEvent.Fail, { floor: this.floor, cause: this.lastCause })
    analytics.track(CoreEvent.GameplayEnd, { floor: this.floor, pearls: this.runPearls })
    const summary: RunSummary = {
      startFloor: this.startFloor,
      floorReached: this.floor,
      pearls: this.runPearls,
      kills: this.kills,
      cause: this.lastCause,
      epitaph: this.epitaph || pickEpitaph(this.lastCause),
      record,
      keysUnderwater,
    }
    this.context.scenes.change('result', summary)
  }

  private sfx(name: SfxName, options?: { volume?: number; pitch?: number; delay?: number }): void {
    this.context.audio.play(name, options)
  }

  onShot(x: number, y: number, direction: 1 | -1): void {
    this.sfx('shoot')
    this.context.juice.particles.emit({
      x,
      y,
      count: 5,
      angle: direction > 0 ? 0 : Math.PI,
      spread: 0.9,
      speedMin: 60,
      speedMax: 180,
      lifeMin: 0.08,
      lifeMax: 0.2,
      sizeMin: 1.5,
      sizeMax: 3,
      colors: [PALETTE.flare, PALETTE.flareCore],
      shape: 'spark',
    })
  }

  onDryFire(): void {
    this.sfx('empty')
  }

  onReloadStart(): void {
    this.sfx('reload', { pitch: 0.8 })
  }

  onReloaded(): void {
    this.sfx('reload', { pitch: 1.5 })
  }

  onFlareImpact(x: number, y: number): void {
    this.context.juice.particles.emit({
      x,
      y,
      count: 7,
      speedMin: 40,
      speedMax: 160,
      lifeMin: 0.1,
      lifeMax: 0.3,
      sizeMin: 1.5,
      sizeMax: 3,
      colors: [PALETTE.flare, PALETTE.flareCore, PALETTE.light],
      shape: 'spark',
      gravity: 300,
    })
  }

  onEnemyHit(enemy: Enemy, x: number, y: number): void {
    const justFrozen = enemy.alive && enemy.frozen >= BALANCE.weapon.frostTime - 0.01
    this.sfx(justFrozen ? 'freeze' : 'hit')
    this.context.juice.hitStop.freeze(0.025)
    this.context.juice.particles.emit({
      x,
      y,
      count: 6,
      speedMin: 50,
      speedMax: 170,
      lifeMin: 0.12,
      lifeMax: 0.3,
      sizeMin: 1.5,
      sizeMax: 3.5,
      colors: ENEMY_COLORS[enemy.kind],
    })
  }

  onEnemyKilled(enemy: Enemy): void {
    const { juice } = this.context
    this.sfx('kill')
    juice.shake.add(0.12)
    juice.hitStop.freeze(0.05)
    juice.particles.emit({
      x: enemy.x,
      y: enemy.centerY,
      count: 18,
      speedMin: 60,
      speedMax: 240,
      lifeMin: 0.25,
      lifeMax: 0.6,
      sizeMin: 2,
      sizeMax: 4.5,
      colors: ENEMY_COLORS[enemy.kind],
      gravity: 380,
    })
  }

  onEnemySpawned(enemy: Enemy): void {
    this.sfx('splash', { volume: 0.6 })
    this.context.juice.particles.emit({
      x: enemy.x,
      y: enemy.y,
      count: 12,
      angle: -Math.PI / 2,
      spread: 1.6,
      speedMin: 60,
      speedMax: 200,
      lifeMin: 0.25,
      lifeMax: 0.55,
      sizeMin: 1.5,
      sizeMax: 3.5,
      colors: [PALETTE.waterFoam, PALETTE.water],
      gravity: 500,
    })
  }

  onSpineFired(): void {
    this.sfx('spine')
  }

  onHeroHurt(cause: HurtCause): void {
    const world = this.world
    if (!world) return
    const { juice } = this.context
    this.lastCause = cause
    this.sfx('hurt')
    this.hud.bumpHeart()
    juice.shake.add(0.4)
    juice.hitStop.freeze(0.07)
    juice.texts.spawn({
      x: world.hero.x,
      y: world.hero.y - 40,
      value: cause === 'water' ? 'Нема повітря!' : '−1',
      color: PALETTE.danger,
      size: 18,
    })
    juice.particles.emit({
      x: world.hero.x,
      y: world.hero.centerY,
      count: 10,
      speedMin: 60,
      speedMax: 180,
      lifeMin: 0.2,
      lifeMax: 0.45,
      colors: [PALETTE.heart, PALETTE.coat],
    })
  }

  onShieldBlock(): void {
    const world = this.world
    if (!world) return
    this.sfx('shieldBlock')
    this.context.juice.particles.emit({
      x: world.hero.x,
      y: world.hero.centerY,
      count: 12,
      speedMin: 80,
      speedMax: 200,
      lifeMin: 0.15,
      lifeMax: 0.35,
      colors: [PALETTE.shield, '#ffffff'],
      shape: 'spark',
    })
  }

  onPickup(kind: PickupKind, x: number, y: number, value: number): void {
    const world = this.world
    if (!world) return
    const { juice } = this.context
    this.tutorial.notifyPickup(kind)
    if (kind === 'pearl') {
      if (value > 1) juice.texts.spawn({ x, y: y - 14, value: `+${value}`, color: PALETTE.pearl, size: 16 })
      this.pearlChain = Math.min(12, this.pearlChain + 1)
      this.pearlChainTimer = 0.6
      this.sfx('pearl', { pitch: 1 + this.pearlChain * 0.06 })
      this.hud.bumpPearl()
      juice.particles.emit({ x, y, count: 4, speedMin: 30, speedMax: 90, lifeMin: 0.1, lifeMax: 0.25, colors: [PALETTE.pearl] })
      return
    }
    if (kind === 'key') {
      this.sfx('key')
      this.sfx('key', { pitch: 1.5, delay: 0.07 })
      this.hud.bumpKey()
      const collected = world.keysTotal - world.keysLeft
      juice.texts.spawn({ x, y: y - 14, value: `${collected}/${world.keysTotal}`, color: PALETTE.key, size: 16 })
      juice.particles.emit({
        x,
        y,
        count: 16,
        speedMin: 50,
        speedMax: 200,
        lifeMin: 0.25,
        lifeMax: 0.6,
        sizeMin: 1.5,
        sizeMax: 3.5,
        colors: [PALETTE.key, PALETTE.keyGlint],
        glow: true,
      })
      return
    }
    if (kind === 'shell') {
      this.progress.bump('shells')
      this.sfx('pearl', { pitch: 0.8 })
      this.sfx('powerUp', { pitch: 1.2, delay: 0.06 })
      this.hud.bumpPearl()
      juice.texts.spawn({ x, y: y - 16, value: `+${value}`, color: PALETTE.shell, size: 22 })
      juice.particles.emit({ x, y, count: 20, speedMin: 60, speedMax: 220, colors: [PALETTE.pearl, PALETTE.shell, '#ffffff'] })
      return
    }
    if (!isPowerUpKind(kind)) return
    this.sfx('powerUp')
    if (kind === 'heart') this.hud.bumpHeart()
    juice.texts.spawn({ x, y: y - 16, value: POWER_UPS[kind].name, color: powerColor(kind), size: 17 })
    juice.particles.emit({ x, y, count: 14, speedMin: 60, speedMax: 200, colors: [powerColor(kind), '#ffffff'] })
  }

  onLightningWarn(): void {
    this.sfx('tick', { pitch: 0.55, volume: 0.6 })
  }

  onLightningStrike(x: number): void {
    const world = this.world
    if (!world) return
    const { juice } = this.context
    this.flash = Math.max(this.flash, 0.12)
    this.sfx('thunder')
    this.sfx('explode', { pitch: 1.6, volume: 0.5 })
    juice.shake.add(0.3)
    juice.particles.emit({
      x,
      y: Math.min(world.water.level, world.map.height) - 4,
      count: 22,
      speedMin: 80,
      speedMax: 260,
      lifeMin: 0.15,
      lifeMax: 0.45,
      sizeMin: 1.5,
      sizeMax: 3.5,
      colors: [PALETTE.lightning, PALETTE.lightningCore],
      glow: true,
    })
  }

  onShock(x: number, y: number, hit: boolean): void {
    const { juice } = this.context
    this.sfx('hit', { pitch: 1.9, volume: hit ? 1 : 0.6 })
    juice.particles.emit({
      x,
      y,
      count: 14,
      speedMin: 60,
      speedMax: 220,
      lifeMin: 0.1,
      lifeMax: 0.3,
      sizeMin: 1,
      sizeMax: 2.5,
      colors: [PALETTE.shock, '#ffffff'],
      glow: true,
    })
  }

  onShellRevealed(): void {
    this.sfx('powerUp', { pitch: 0.7 })
    this.queueBanner('Мушля з перлами!', 'Великий краб витягнув її на дно — встигнеш за один вдих?', PALETTE.shell, 3)
  }

  onExplosion(x: number, y: number): void {
    const { juice } = this.context
    this.sfx('explode')
    juice.shake.add(0.22)
    juice.particles.emit({
      x,
      y,
      count: 26,
      speedMin: 80,
      speedMax: 280,
      lifeMin: 0.2,
      lifeMax: 0.5,
      sizeMin: 2,
      sizeMax: 5,
      colors: [PALETTE.blast, PALETTE.flare, PALETTE.flareCore],
      glow: true,
    })
    juice.particles.emit({
      x,
      y,
      count: 10,
      speedMin: 20,
      speedMax: 70,
      lifeMin: 0.5,
      lifeMax: 0.9,
      sizeMin: 4,
      sizeMax: 7,
      colors: [PALETTE.stoneLight, PALETTE.stone],
      gravity: -40,
    })
  }

  onPowerUpExpired(kind: TimedPowerUp): void {
    const world = this.world
    if (!world || !world.hero.alive) return
    this.sfx('powerDown')
    this.context.juice.texts.spawn({
      x: world.hero.x,
      y: world.hero.y - world.hero.height - 22,
      value: POWER_UPS[kind].expired,
      color: POWER_UPS[kind].color,
      size: 15,
      rise: 26,
      life: 1.3,
    })
  }

  onSecondWind(): void {
    const world = this.world
    if (!world) return
    this.secondWinds = world.secondWinds
    this.progress.bump('secondWinds')
    this.sfx('powerUp', { pitch: 0.8 })
    this.context.juice.shake.add(0.3)
    this.context.juice.particles.emit({
      x: world.hero.x,
      y: world.hero.centerY,
      count: 30,
      speedMin: 60,
      speedMax: 220,
      lifeMin: 0.4,
      lifeMax: 0.9,
      colors: [PALETTE.heart, PALETTE.light, '#ffffff'],
      glow: true,
    })
    const hearts = world.hero.hp === 1 ? 'одним серцем' : `${world.hero.hp} серцями`
    this.showBanner('Друге дихання!', `Ти встав з ${hearts} — тікай!`, PALETTE.heart, 2.2)
  }

  private grantKit(world: World): void {
    const kind = this.random.pick(KIT_POWER_UPS)
    world.powerUps.activate(kind)
    this.context.juice.texts.spawn({
      x: world.hero.x,
      y: world.hero.y - world.hero.height - 24,
      value: `Валіза: ${POWER_UPS[kind].name}`,
      color: POWER_UPS[kind].color,
      size: 15,
      rise: 30,
      life: 1.8,
    })
  }

  onDoorHeld(): void {
    this.sfx('deny')
    this.showBanner('Двері тримає вартовий!', 'Здолай восьминога — тоді вони відчиняться', PALETTE.octopus, 2.4)
  }

  onGuardianDefeated(enemy: Enemy): void {
    const world = this.world
    if (!world) return
    this.progress.bump('guardians')
    const { juice } = this.context
    this.sfx('explode')
    this.sfx('kill', { pitch: 0.55, delay: 0.08 })
    juice.shake.add(0.7)
    juice.hitStop.freeze(0.15)
    juice.particles.emit({
      x: enemy.x,
      y: enemy.centerY,
      count: 50,
      speedMin: 80,
      speedMax: 340,
      lifeMin: 0.4,
      lifeMax: 1,
      sizeMin: 2,
      sizeMax: 6,
      colors: [PALETTE.octopus, PALETTE.octopusShade, PALETTE.inkGlow, PALETTE.flareCore],
      gravity: 300,
      glow: true,
    })
    const left = world.keysLeft
    this.bossBannerUntil = this.time + 2.2
    this.showBanner(
      'Вартового переможено!',
      left > 0 ? `Збери ще ключів: ${left}` : 'Двері вільні — нагору!',
      PALETTE.good,
      2.2,
    )
    this.context.portal.happyMoment(0.8)
  }

  onKeysSubmerged(count: number): void {
    const air = Math.round(this.stats.maxAir)
    const lungs = UPGRADES.find((def) => def.id === 'lungs')
    const canGrow = lungs !== undefined && !this.progress.isMaxed(lungs)
    const what = count === 1 ? 'Ключ під водою!' : `Ключі під водою: ${count}`
    const advice = canGrow
      ? `Пірнай — повітря на ${air} с. Більше дасть «Акваланг» у майстерні`
      : `Пірнай по них — повітря на ${air} с`
    this.sfx('airLow', { pitch: 0.7 })
    this.queueBanner(what, advice, PALETTE.waterFoam, 3)
  }

  onDoorOpened(): void {
    this.sfx('doorOpen')
    if (this.time >= this.bossBannerUntil) {
      this.showBanner('Двері відчинено!', 'Нагору, поки вода не наздогнала', PALETTE.lampOn, 1.8)
    }
    this.context.portal.happyMoment(0.4)
  }

  onFloorCleared(): void {
    const world = this.world
    if (!world) return
    const multiplier = this.streakMultiplier
    const bonus = world.addBonusPearls(Math.round(clearBonus(this.floor, this.tier) * multiplier))
    this.floorBonus = bonus
    this.breakStreak = multiplier
    if (this.unlocks.isOpen('streak')) this.streak += 1
    this.clearTime = Math.round(world.time * 10) / 10
    this.tutorial.notifyFloorCleared()
    this.phase = 'clearing'
    this.phaseTimer = CLEAR_TIME
    this.sfx('floorClear')
    this.showBanner(
      `Поверх ${this.floor} пройдено!`,
      `+${bonus} перлів — на апгрейди в майстерні`,
      PALETTE.good,
      CLEAR_TIME,
    )
    this.context.juice.particles.emit({
      x: world.door.x,
      y: world.door.y - 16,
      count: 30,
      speedMin: 80,
      speedMax: 260,
      lifeMin: 0.4,
      lifeMax: 0.9,
      colors: [PALETTE.light, PALETTE.lightCore, PALETTE.lampOn],
      glow: true,
    })
  }

  onHeroDied(): void {
    this.phase = 'dying'
    this.phaseTimer = DEATH_TIME
    this.sfx('gameOver')
    this.context.juice.shake.add(0.6)
    this.epitaph = pickEpitaph(this.lastCause)
    this.showBanner(DEATH_TITLES[this.lastCause], this.epitaph, PALETTE.danger, DEATH_TIME)
  }

  onAirLow(secondsLeft: number): void {
    const world = this.world
    if (!world) return
    this.sfx('airLow', { pitch: 1 + (3 - secondsLeft) * 0.15 })
    this.context.juice.texts.spawn({
      x: world.hero.x,
      y: world.hero.y - world.hero.height - 26,
      value: String(secondsLeft),
      color: PALETTE.danger,
      size: 16,
      rise: 20,
      life: 0.7,
    })
  }

  onHeroSplash(x: number, y: number): void {
    this.sfx('splash', { volume: 0.8 })
    this.context.juice.particles.emit({
      x,
      y,
      count: 14,
      angle: -Math.PI / 2,
      spread: 1.4,
      speedMin: 70,
      speedMax: 220,
      lifeMin: 0.25,
      lifeMax: 0.55,
      sizeMin: 1.5,
      sizeMax: 3.5,
      colors: [PALETTE.waterFoam, PALETTE.water],
      gravity: 600,
    })
  }

  onDrowning(x: number, y: number): void {
    this.sfx('bubble')
    this.context.juice.particles.emit({
      x,
      y,
      count: 6,
      angle: -Math.PI / 2,
      spread: 0.8,
      speedMin: 30,
      speedMax: 80,
      lifeMin: 0.4,
      lifeMax: 0.8,
      sizeMin: 1.5,
      sizeMax: 3,
      colors: [PALETTE.waterFoam],
      drag: 1,
    })
  }

  override resize(): void {
    this.layout()
  }

  private layout(): void {
    const viewport = this.context.viewport
    const safe = viewport.safeArea
    const total = LAYOUT.hudHeight + LAYOUT.levelTopGap + LEVEL_HEIGHT
    const touch = this.rig?.touch
    let top = safe.y + (safe.height - total) / 2
    if (touch?.visible && viewport.height > total + 240) top = Math.max(12, viewport.height * 0.06)
    this.hudFrame = { x: safe.x, y: top, width: LEVEL_WIDTH, height: LAYOUT.hudHeight }
    this.levelX = safe.x
    this.levelY = top + LAYOUT.hudHeight + LAYOUT.levelTopGap
    this.pauseButton.setBounds({ x: safe.x + LEVEL_WIDTH - 42, y: top + 5, width: 36, height: 36 })
    touch?.layout({ x: 0, y: 0, width: viewport.width, height: viewport.height })
    const centerX = viewport.width / 2
    const startY = viewport.height / 2 - 160
    this.pauseRows.forEach((row, index) => {
      let x = centerX - PAUSE_W / 2
      for (const button of row) {
        button.setBounds({ x, y: startY + index * PAUSE_STEP })
        x += button.width + PAUSE_GAP
      }
    })
    const buttonsY = this.breakTop + BREAK_H - BREAK_PAD - BUTTON_SIZES.md.height
    let bx = this.levelX + LEVEL_WIDTH / 2 - BREAK_W / 2 + BREAK_PAD
    for (const button of [this.breakMenu, this.breakWorkshop, this.breakContinue]) {
      button.setBounds({ x: bx, y: buttonsY })
      bx += button.width + BREAK_GAP
    }
  }

  render(r: IRenderer): void {
    const world = this.world
    if (!world) return
    this.layout()
    const { juice } = this.context

    r.push()
    juice.shake.apply(r)
    r.translate(this.levelX, this.levelY)
    r.push()
    r.clip({ kind: 'rect', x: 0, y: 0, width: LEVEL_WIDTH, height: LEVEL_HEIGHT, radius: 6 })
    this.painter.drawWorld(r, world, this.time, this.flash)
    this.painter.drawWater(r, world, this.time)
    this.painter.drawOverlay(r, world, this.time)
    juice.renderEffects(r)
    if (this.phase === 'playing' && !this.paused) {
      this.callouts.draw(r, this.tutorial.active, LEVEL_WIDTH, this.time)
    }
    this.drawPowerChips(r, world)
    this.drawBossBar(r, world)
    if (this.flash > 0) r.rect(0, 0, LEVEL_WIDTH, LEVEL_HEIGHT, { fill: '#dfe8ff', alpha: this.flash * 1.4 })
    if (this.fade > 0) r.rect(0, 0, LEVEL_WIDTH, LEVEL_HEIGHT, { fill: PALETTE.background, alpha: this.fade })
    r.pop()
    r.pop()

    this.hud.draw(r, this.hudFrame, {
      world,
      pearls: this.progress.pearls + world.pearlsCollected,
      time: this.time,
      tier: this.tier,
    })
    this.ui.render(r)
    if (!this.paused) this.drawBanner(r)
    if (!this.paused) this.rig?.touch.render(r)
    if (this.paused) this.drawPause(r)
    if (this.phase === 'break') this.drawBreak(r)
    this.feats.toast.render(r, this.context.viewport.width)
  }

  private get breakTop(): number {
    return this.levelY + LEVEL_HEIGHT / 2 - BREAK_H / 2
  }

  private drawBreak(r: IRenderer): void {
    const cx = this.levelX + LEVEL_WIDTH / 2
    const top = this.breakTop
    r.rect(this.levelX, this.levelY, LEVEL_WIDTH, LEVEL_HEIGHT, { fill: PALETTE.background, alpha: 0.72 })
    r.roundRect(cx - BREAK_W / 2, top, BREAK_W, BREAK_H, 18, { fill: PALETTE.surface, alpha: 0.96 })
    r.roundRect(cx - BREAK_W / 2, top, BREAK_W, BREAK_H, 18, { stroke: PALETTE.good, lineWidth: 2, alpha: 0.7 })
    r.text(`Поверх ${this.floor} пройдено!`, cx, top + BREAK_PAD + 15, {
      fill: PALETTE.good,
      size: 28,
      weight: 900,
      align: 'center',
      baseline: 'middle',
    })
    const streak = this.breakStreak > 1 ? ` (серія ×${this.breakStreak.toLocaleString('uk-UA')})` : ''
    const line = `Зібрано ${this.breakPicked} · бонус за поверх ${this.breakBonus}${streak}`
    const style = { size: 16, weight: 700 } as const
    const width = r.measureText(line, style) + 24
    drawPearl(r, cx - width / 2 + 8, top + 84, 15, 1, pearlKindOf(this.tier))
    r.text(line, cx + 12, top + 85, { ...style, fill: PALETTE.ink, align: 'center', baseline: 'middle' })
    r.text(`У кишені: ${this.progress.pearls}`, cx, top + 114, {
      fill: PALETTE.ink,
      size: 18,
      weight: 900,
      align: 'center',
      baseline: 'middle',
    })
    const affordable = UPGRADES.some((def) => this.progress.canAfford(def))
    r.text(affordable ? 'У майстерні вже є що купити' : 'Збирай перли — апгрейди чекають у майстерні', cx, top + 140, {
      fill: affordable ? PALETTE.accent : PALETTE.inkMuted,
      size: 14,
      weight: 700,
      align: 'center',
      baseline: 'middle',
    })
    this.breakUi.render(r)
    if (affordable) {
      const w = this.breakWorkshop
      const pulse = 0.6 + Math.sin(this.time * 5) * 0.4
      r.circle(w.x + w.width - 5, w.y + 5, 7, { fill: PALETTE.night })
      r.circle(w.x + w.width - 5, w.y + 5, 5, { fill: PALETTE.accent, alpha: pulse, glow: PALETTE.accent, glowSize: 10 })
    }
    this.breakFocus.render(r, this.time)
  }

  private drawBossBar(r: IRenderer, world: World): void {
    const boss = world.guardian
    if (!boss || !boss.alive) return
    const width = 330
    const x = LEVEL_WIDTH - width - 8
    const barX = x + 92
    const barW = width - 92 - 58
    const fraction = Math.max(0, boss.hp) / boss.maxHp
    r.roundRect(x, 4, width, 24, 8, { fill: PALETTE.night, alpha: 0.9 })
    r.roundRect(x, 4, width, 24, 8, { stroke: PALETTE.octopus, lineWidth: 1.5 })
    r.text('Вартовий', x + 10, 16, { fill: PALETTE.ink, size: 13, weight: 800, baseline: 'middle' })
    r.roundRect(barX, 11, barW, 10, 5, { fill: PALETTE.surfaceActive })
    if (this.bossTrail > fraction) {
      r.roundRect(barX, 11, barW * this.bossTrail, 10, 5, { fill: '#ffffff', alpha: 0.7 })
    }
    if (fraction > 0) {
      r.roundRect(barX, 11, Math.max(10, barW * fraction), 10, 5, {
        fill: boss.frozen > 0 ? PALETTE.frost : PALETTE.octopus,
        glow: PALETTE.octopus,
        glowSize: 6,
      })
    }
    r.text(`${Math.max(0, boss.hp)}/${boss.maxHp}`, x + width - 10, 16, {
      fill: PALETTE.ink,
      size: 13,
      weight: 800,
      align: 'right',
      baseline: 'middle',
    })
  }

  private drawPowerChips(r: IRenderer, world: World): void {
    const style = { size: 13, weight: 800 } as const
    let x = 8
    for (const kind of world.powerUps.list()) {
      const info = POWER_UPS[kind]
      const left = world.powerUps.remaining(kind)
      const label = `${Math.ceil(left)} с`
      const width = 32 + r.measureText(label, style)
      const blink = info.warn && left <= 3 && Math.sin(this.time * 14) > 0
      r.roundRect(x, 4, width, 24, 8, { fill: PALETTE.night, alpha: 0.88 })
      r.roundRect(x, 4, width, 24, 8, { stroke: info.color, lineWidth: 1.5, alpha: blink ? 1 : 0.75 })
      r.rect(x + 5, 24, (width - 10) * world.powerUps.fraction(kind), 2, { fill: info.color })
      drawPowerGlyph(r, kind, x + 14, 15, 15)
      r.text(label, x + 26, 16, { ...style, fill: blink ? PALETTE.danger : PALETTE.ink, baseline: 'middle' })
      x += width + 6
    }
  }

  private drawBanner(r: IRenderer): void {
    const banner = this.banner
    if (!banner) return
    const t = banner.timer / banner.duration
    const appear = Math.min(1, (1 - t) * 6)
    const alpha = Math.min(appear, t * 4, 1)
    const cx = this.levelX + LEVEL_WIDTH / 2
    const cy = this.levelY + LEVEL_HEIGHT * 0.3
    const width = Math.max(460, r.measureText(banner.subtitle, { size: 16, weight: 600 }) + 48)
    r.roundRect(cx - width / 2, cy - 40, width, 78, 16, { fill: PALETTE.night, alpha: alpha * 0.82 })
    r.text(banner.title, cx, cy - 10, {
      fill: banner.color,
      size: 30,
      weight: 900,
      align: 'center',
      baseline: 'middle',
      alpha,
    })
    r.text(banner.subtitle, cx, cy + 22, {
      fill: PALETTE.ink,
      size: 16,
      weight: 600,
      align: 'center',
      baseline: 'middle',
      alpha,
    })
  }

  private drawPause(r: IRenderer): void {
    const viewport = this.context.viewport
    r.rect(0, 0, viewport.width, viewport.height, { fill: PALETTE.background, alpha: 0.78 })
    r.text('Пауза', viewport.width / 2, viewport.height / 2 - 196, {
      fill: PALETTE.accent,
      size: 40,
      weight: 900,
      align: 'center',
      baseline: 'middle',
    })
    this.pauseUi.render(r)
    this.focus.render(r, this.time)
    this.drawLegend(r, viewport.width / 2, viewport.height / 2 + 104)
  }

  private drawLegend(r: IRenderer, centerX: number, y: number): void {
    const maxAir = Math.round(this.stats.maxAir)
    const rows: [(cx: number, cy: number) => void, string][] = [
      [(cx, cy) => drawKey(r, cx, cy, 20, false), 'Ключ — збери всі на поверсі, і двері нагору відчиняться'],
      [(cx, cy) => drawPearl(r, cx, cy, 14, 1, pearlKindOf(this.tier)), `Перлина — гроші на апгрейди: тут ${PEARLS[pearlKindOf(this.tier)].name}`],
      [
        (cx, cy) => {
          r.ring(cx, cy, 10, 2, { stroke: PALETTE.shield })
          drawPowerGlyph(r, 'shield', cx, cy, 13)
        },
        'Бульбашка з іконкою — тимчасовий бонус: щит, віяло, годинник…',
      ],
      [
        (cx, cy) => {
          for (let i = 0; i < 3; i++) r.ring(cx - 7 + i * 7, cy, 3, 1.2, { stroke: PALETTE.waterFoam })
        },
        `Вода — плавай стрілками. На поверхні дихаєш, під водою — ${maxAir} с повітря`,
      ],
    ]
    const style = { size: 14, weight: 600 }
    const textWidth = Math.max(...rows.map(([, text]) => r.measureText(text, style)))
    const width = textWidth + 34 + 28
    const x = centerX - width / 2 + 14
    r.roundRect(x - 14, y - 18, width, rows.length * 30 + 6, 12, { fill: PALETTE.surface, alpha: 0.9 })
    rows.forEach(([icon, text], index) => {
      const cy = y + index * 30
      icon(x + 10, cy)
      r.text(text, x + 34, cy + 1, { fill: PALETTE.ink, size: 14, weight: 600, baseline: 'middle' })
    })
  }
}
