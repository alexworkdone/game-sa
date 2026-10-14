import { Analytics, ConsoleSink, GuardedPortal, NullPortal, SeededRandom, WebStorage } from '@sa/core'
import type { IAnalytics, IPortal, IRandom, IStorage } from '@sa/core'
import { penFor } from '../content/pens.js'
import { UK } from '../i18n/uk.js'
import { Builder } from '../meta/Builder.js'
import { City } from '../meta/City.js'
import { Grants } from '../meta/Grants.js'
import { Perks } from '../meta/Perks.js'
import { Preferences } from '../meta/Preferences.js'
import { Records } from '../meta/Records.js'
import { Wallet } from '../meta/Wallet.js'
import type { ITownPainter } from '../render/ITownPainter.js'
import { SvgTownPainter } from '../render/SvgTownPainter.js'
import { RafScheduler } from '../round/FrameScheduler.js'
import type { IFrameScheduler } from '../round/FrameScheduler.js'
import { ModeFactory } from '../round/ModeFactory.js'
import type { IModeFactory } from '../round/ModeFactory.js'
import { RoundResolver } from '../round/RoundResolver.js'
import { CityActions } from '../ui/CityActions.js'
import { h } from '../ui/dom.js'
import { Navigator, isTab } from '../ui/Navigator.js'
import type { Route } from '../ui/Navigator.js'
import { showCelebration } from '../ui/overlays/CelebrateSheet.js'
import { OverlayHost } from '../ui/OverlayHost.js'
import type { IScreen } from '../ui/Screen.js'
import { AlbumScreen } from '../ui/screens/AlbumScreen.js'
import { BuildScreen } from '../ui/screens/BuildScreen.js'
import { GameScreen } from '../ui/screens/GameScreen.js'
import { PlayScreen } from '../ui/screens/PlayScreen.js'
import { TownScreen } from '../ui/screens/TownScreen.js'
import { Shell } from '../ui/Shell.js'
import { Toaster } from '../ui/Toaster.js'
import type { UiKit } from '../ui/UiKit.js'
import type { AppServices } from './AppServices.js'

export interface LiterogradFactories {
  createStorage?(namespace: string): IStorage
  createPortal?(debug: boolean): IPortal
  createAnalytics?(debug: boolean): IAnalytics
  createRandom?(): IRandom
  createModes?(random: IRandom): IModeFactory
  createPainter?(): ITownPainter
  createScheduler?(): IFrameScheduler
}

export interface LiterogradOptions {
  readonly root: HTMLElement
  readonly namespace?: string
  readonly debug?: boolean
  readonly factories?: LiterogradFactories
}

type ScreenName = Route['name']

const TEST_GRANT = 'dev-test-ink-10k'
const SCREEN_ENTER_MS = 240

export class LiterogradApp {
  readonly services: AppServices
  readonly kit: UiKit

  private readonly root: HTMLElement
  private readonly stage: HTMLElement
  private readonly shell: Shell
  private readonly game: GameScreen
  private readonly screens: Readonly<Record<ScreenName, IScreen<unknown>>>
  private current: IScreen<unknown> | null = null

  constructor(options: LiterogradOptions) {
    const debug = options.debug ?? false
    const factories = options.factories ?? {}
    const storage = factories.createStorage?.(options.namespace ?? 'literograd') ?? new WebStorage(options.namespace ?? 'literograd')
    const portal = factories.createPortal?.(debug) ?? new GuardedPortal(new NullPortal({ verbose: debug }))
    const analytics = factories.createAnalytics?.(debug) ?? new Analytics({ sinks: debug ? [new ConsoleSink()] : [] })
    const random = factories.createRandom?.() ?? new SeededRandom(Date.now())

    const wallet = new Wallet(storage)
    const city = new City(storage)
    const perks = new Perks(city)
    const records = new Records(storage)

    this.services = {
      storage,
      portal,
      analytics,
      wallet,
      city,
      perks,
      builder: new Builder(wallet, city),
      records,
      prefs: new Preferences(storage, perks),
      grants: new Grants(storage),
      modes: factories.createModes?.(random) ?? new ModeFactory(random),
      resolver: new RoundResolver(wallet, records, perks),
      painter: factories.createPainter?.() ?? new SvgTownPainter(),
      scheduler: factories.createScheduler?.() ?? new RafScheduler(),
    }

    const toast = new Toaster()
    const overlays = new OverlayHost()
    const nav = new Navigator()
    const actions = new CityActions(this.services, toast)
    this.kit = { services: this.services, nav, overlays, toast, actions, debug }

    this.root = options.root
    this.stage = h('main', { class: 'app__stage' })
    this.shell = new Shell(this.kit)
    this.game = new GameScreen(this.kit)
    this.screens = {
      town: new TownScreen(this.kit) as IScreen<unknown>,
      play: new PlayScreen(this.kit) as IScreen<unknown>,
      build: new BuildScreen(this.kit) as IScreen<unknown>,
      album: new AlbumScreen(this.kit) as IScreen<unknown>,
      game: this.game as IScreen<unknown>,
    }

    this.root.replaceChildren(
      h('div', { class: 'app__frame' }, this.shell.hud, this.stage, this.shell.tabbar),
      overlays.element,
      toast.element,
    )

    nav.onChange.on((route) => this.show(route))
    city.onChange.on(() => this.applyPen())
    actions.onCityCompleted.on(() => {
      window.setTimeout(() => showCelebration(this.kit, () => this.goTab('town')), 900)
    })
    this.applyPen()
  }

  async start(): Promise<void> {
    this.services.analytics.mark('load')
    await this.services.portal.init()
    this.goTab(this.services.prefs.values.tab)
    this.services.analytics.measure('game_first_frame', 'load')
    if (this.kit.debug && this.services.grants.claim(TEST_GRANT)) this.kit.actions.grantTestInk(UK.toast.testGranted)
  }

  private goTab(tab: ScreenName): void {
    if (tab === 'game') return
    this.kit.nav.go({ name: tab })
  }

  private show(route: Route): void {
    if (isTab(route) && this.services.prefs.values.tab !== route.name) this.services.prefs.update({ tab: route.name })
    const next = this.screens[route.name]
    this.current?.leave()
    this.current?.element.remove()
    this.current = next
    next.enter(route.name === 'game' ? { mode: route.mode } : route.name === 'build' ? { focus: route.focus } : undefined)
    this.stage.scrollTop = 0
    this.stage.appendChild(next.element)
    this.root.dataset.route = route.name
    next.element.classList.add('screen--enter')
    window.setTimeout(() => next.element.classList.remove('screen--enter'), SCREEN_ENTER_MS)
  }

  private applyPen(): void {
    document.documentElement.dataset.pen = String(penFor(this.services.city.book).index)
  }
}
