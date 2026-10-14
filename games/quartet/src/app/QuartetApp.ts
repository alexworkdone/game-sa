import { Analytics, ConsoleSink, GuardedPortal, NullPortal, WebAudioEngine, WebStorage } from '@sa/core'
import type { IAnalytics, IAudio, IPortal, IStorage } from '@sa/core'
import type { CategoryData } from '../content/CategoryData.js'
import { CategoryBank } from '../content/CategoryBank.js'
import { ForgeService } from '../forge/ForgeService.js'
import { Galaxy } from '../forge/Galaxy.js'
import { PlanetForge } from '../forge/PlanetForge.js'
import { PlanetNamer } from '../forge/PlanetNamer.js'
import { RarityOdds } from '../forge/RarityOdds.js'
import { Effects } from '../fx/Effects.js'
import { Starfield } from '../fx/Starfield.js'
import { RANK_THRESHOLDS, UK } from '../i18n/uk.js'
import { DailyLimit } from '../meta/DailyLimit.js'
import { DailyTracker } from '../meta/DailyTracker.js'
import { LocalDaySeed } from '../meta/DaySeed.js'
import { LevelProgress } from '../meta/LevelProgress.js'
import { PlayResolver } from '../meta/PlayResolver.js'
import { RankSystem } from '../meta/RankSystem.js'
import { Scoring } from '../meta/Scoring.js'
import type { IScoring } from '../meta/Scoring.js'
import { Settings } from '../meta/Settings.js'
import { Stats } from '../meta/Stats.js'
import { ThemeUnlocks } from '../meta/Themes.js'
import { Wallet } from '../meta/Wallet.js'
import { AdPacer } from '../platform/AdPacer.js'
import type { IHaptics } from '../platform/IHaptics.js'
import { SFX } from '../platform/sfx.js'
import { WebHaptics } from '../platform/WebHaptics.js'
import { DailyPuzzleSource } from '../puzzle/DailyPuzzleSource.js'
import { LevelPuzzleSource } from '../puzzle/LevelPuzzleSource.js'
import { LevelSchedule } from '../puzzle/LevelSchedule.js'
import type { ILevelSchedule } from '../puzzle/LevelSchedule.js'
import type { IPuzzleGenerator } from '../puzzle/Puzzle.js'
import { PuzzleGenerator } from '../puzzle/PuzzleGenerator.js'
import type { IPlanetPainter } from '../render/IPlanetPainter.js'
import { SvgPlanetPainter } from '../render/SvgPlanetPainter.js'
import { h, prefersReducedMotion } from '../ui/dom.js'
import { Navigator } from '../ui/Navigator.js'
import type { Route } from '../ui/Navigator.js'
import { OverlayHost } from '../ui/OverlayHost.js'
import type { IScreen } from '../ui/Screen.js'
import { ForgeScreen } from '../ui/screens/ForgeScreen.js'
import { GalaxyScreen } from '../ui/screens/GalaxyScreen.js'
import { GameScreen } from '../ui/screens/GameScreen.js'
import type { GameParams } from '../ui/screens/GameScreen.js'
import { HomeScreen } from '../ui/screens/HomeScreen.js'
import { LevelsScreen } from '../ui/screens/LevelsScreen.js'
import { ProfileScreen } from '../ui/screens/ProfileScreen.js'
import { Shell } from '../ui/Shell.js'
import { Toaster } from '../ui/Toaster.js'
import type { UiKit } from '../ui/UiKit.js'
import type { AppServices } from './AppServices.js'

export interface QuartetFactories {
  createStorage?(namespace: string): IStorage
  createAudio?(storage: IStorage): IAudio
  createHaptics?(): IHaptics
  createPortal?(debug: boolean): IPortal
  createAnalytics?(debug: boolean): IAnalytics
  createPainter?(): IPlanetPainter
  createGenerator?(bank: CategoryBank): IPuzzleGenerator
  createSchedule?(): ILevelSchedule
  createScoring?(): IScoring
}

export interface QuartetOptions {
  readonly root: HTMLElement
  readonly categories: readonly CategoryData[]
  readonly namespace?: string
  readonly debug?: boolean
  readonly factories?: QuartetFactories
}

type ScreenName = Route['name']

const AD_INTERVAL_MS = 3 * 60_000
const AD_HINTS_PER_DAY = 3
const SCREEN_ENTER_MS = 320

export class QuartetApp {
  readonly services: AppServices
  readonly kit: UiKit

  private readonly root: HTMLElement
  private readonly stage: HTMLElement
  private readonly starfield: Starfield
  private readonly shell: Shell
  private readonly gameScreen: GameScreen
  private readonly screens: Readonly<Record<ScreenName, IScreen<unknown>>>
  private current: IScreen<unknown> | null = null
  private backGuard = false

  constructor(options: QuartetOptions) {
    const debug = options.debug ?? false
    const factories = options.factories ?? {}
    const namespace = options.namespace ?? 'quartet'

    const storage = factories.createStorage?.(namespace) ?? new WebStorage(namespace)
    const audio = factories.createAudio?.(storage) ?? new WebAudioEngine({ storage, masterVolume: 0.5 })
    audio.registerAll(SFX)
    const haptics = factories.createHaptics?.() ?? new WebHaptics()
    const portal = factories.createPortal?.(debug) ?? new GuardedPortal(new NullPortal({ verbose: debug }))
    const analytics = factories.createAnalytics?.(debug) ?? new Analytics({ sinks: debug ? [new ConsoleSink()] : [] })
    const bank = new CategoryBank(options.categories)
    const generator = factories.createGenerator?.(bank) ?? new PuzzleGenerator(bank)
    const schedule = factories.createSchedule?.() ?? new LevelSchedule()
    const seeds = new LocalDaySeed('quartet', '2026-09-01')

    const wallet = new Wallet(storage)
    const ranks = new RankSystem(storage, UK.ranks, RANK_THRESHOLDS)
    const progress = new LevelProgress(storage)
    const dailyTracker = new DailyTracker(storage, seeds)
    const stats = new Stats(storage)
    const settings = new Settings(storage)
    const galaxy = new Galaxy(storage)
    const planetForge = new PlanetForge(new PlanetNamer(), new RarityOdds())

    this.services = {
      storage,
      audio,
      haptics,
      portal,
      ads: new AdPacer(portal, { minIntervalMs: AD_INTERVAL_MS }),
      analytics,
      bank,
      levels: new LevelPuzzleSource(bank, generator, schedule),
      daily: new DailyPuzzleSource(bank, generator),
      wallet,
      ranks,
      progress,
      dailyTracker,
      stats,
      settings,
      resolver: new PlayResolver(factories.createScoring?.() ?? new Scoring(), wallet, ranks, progress, dailyTracker, stats),
      galaxy,
      forge: new ForgeService(planetForge, wallet, galaxy),
      themes: new ThemeUnlocks(galaxy),
      painter: factories.createPainter?.() ?? new SvgPlanetPainter(),
      adHints: new DailyLimit(storage, 'v1.adHints', AD_HINTS_PER_DAY, () => dailyTracker.today),
    }

    const effects = new Effects()
    const overlays = new OverlayHost()
    const toast = new Toaster()
    const nav = new Navigator()
    this.kit = {
      services: this.services,
      nav,
      overlays,
      toast,
      fx: effects,
      feedback: (sound, haptic, pitch) => {
        if (sound) audio.play(sound, pitch === undefined ? {} : { pitch })
        if (haptic) haptics.play(haptic)
      },
    }

    this.root = options.root
    this.starfield = new Starfield(!prefersReducedMotion())
    this.stage = h('main', { class: 'app__stage' })
    this.shell = new Shell(this.kit)
    this.gameScreen = new GameScreen(this.kit)
    this.screens = {
      home: new HomeScreen(this.kit) as IScreen<unknown>,
      levels: new LevelsScreen(this.kit) as IScreen<unknown>,
      forge: new ForgeScreen(this.kit) as IScreen<unknown>,
      galaxy: new GalaxyScreen(this.kit) as IScreen<unknown>,
      profile: new ProfileScreen(this.kit) as IScreen<unknown>,
      game: this.gameScreen as IScreen<unknown>,
    }

    this.root.replaceChildren(
      this.starfield.element,
      h('div', { class: 'app__nebula', 'aria-hidden': 'true' }),
      h('div', { class: 'app__frame' }, this.shell.topbar, this.stage, this.shell.tabbar),
      effects.element,
      overlays.element,
      toast.element,
    )

    nav.onChange.on((route) => this.show(route))
    settings.onChange.on(() => this.applySettings())
    this.applySettings()
    const unlock = (): void => audio.unlock()
    document.addEventListener('pointerdown', unlock, { once: true })
    window.addEventListener('popstate', this.onBack)
  }

  async start(): Promise<void> {
    this.services.analytics.mark('load')
    await this.services.portal.init()
    this.kit.nav.go({ name: 'home' })
    this.services.analytics.measure('game_first_frame', 'load')
  }

  private show(route: Route): void {
    const next = this.screens[route.name]
    this.current?.leave()
    this.current?.element.remove()
    this.current = next
    next.enter(route.name === 'game' ? ({ mode: route.mode, ...(route.mode === 'level' ? { level: route.level } : {}) } as GameParams) : undefined)
    next.element.scrollTop = 0
    this.stage.appendChild(next.element)
    this.root.dataset.route = route.name
    next.element.classList.add('screen--enter')
    window.setTimeout(() => next.element.classList.remove('screen--enter'), SCREEN_ENTER_MS)
    this.guardBack()
  }

  private guardBack(): void {
    if (this.backGuard || (this.kit.nav.current.name === 'home' && !this.kit.overlays.open)) return
    this.backGuard = true
    history.pushState({ quartet: true }, '')
  }

  private readonly onBack = (): void => {
    this.backGuard = false
    if (this.kit.overlays.open) this.kit.overlays.dismissTop()
    else if (this.kit.nav.current.name === 'game') this.gameScreen.requestBack()
    else if (this.kit.nav.current.name !== 'home') this.kit.nav.go({ name: 'home' })
    window.setTimeout(() => this.guardBack(), 0)
  }

  private applySettings(): void {
    const { settings, audio, haptics, themes } = this.services
    const values = settings.values
    audio.setMuted(!values.sound)
    haptics.enabled = values.vibration
    const theme = themes.unlocked().some((item) => item.id === values.theme) ? values.theme : 'cosmos'
    document.documentElement.dataset.theme = theme
    const reduced = prefersReducedMotion()
    this.starfield.setAnimated(!reduced)
    this.kit.fx.setEnabled(!reduced)
  }
}
