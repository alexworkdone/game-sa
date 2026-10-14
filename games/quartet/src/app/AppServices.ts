import type { IAnalytics, IAudio, IPortal, IStorage } from '@sa/core'
import type { ICategoryBank } from '../content/CategoryBank.js'
import type { ForgeService } from '../forge/ForgeService.js'
import type { Galaxy } from '../forge/Galaxy.js'
import type { DailyLimit } from '../meta/DailyLimit.js'
import type { DailyTracker } from '../meta/DailyTracker.js'
import type { LevelProgress } from '../meta/LevelProgress.js'
import type { PlayResolver } from '../meta/PlayResolver.js'
import type { RankSystem } from '../meta/RankSystem.js'
import type { Settings } from '../meta/Settings.js'
import type { Stats } from '../meta/Stats.js'
import type { ThemeUnlocks } from '../meta/Themes.js'
import type { Wallet } from '../meta/Wallet.js'
import type { AdPacer } from '../platform/AdPacer.js'
import type { IHaptics } from '../platform/IHaptics.js'
import type { IPuzzleSource } from '../puzzle/IPuzzleSource.js'
import type { IPlanetPainter } from '../render/IPlanetPainter.js'

export interface AppServices {
  readonly storage: IStorage
  readonly audio: IAudio
  readonly haptics: IHaptics
  readonly portal: IPortal
  readonly ads: AdPacer
  readonly analytics: IAnalytics
  readonly bank: ICategoryBank
  readonly levels: IPuzzleSource<number>
  readonly daily: IPuzzleSource<string>
  readonly wallet: Wallet
  readonly ranks: RankSystem
  readonly progress: LevelProgress
  readonly dailyTracker: DailyTracker
  readonly stats: Stats
  readonly settings: Settings
  readonly resolver: PlayResolver
  readonly galaxy: Galaxy
  readonly forge: ForgeService
  readonly themes: ThemeUnlocks
  readonly painter: IPlanetPainter
  readonly adHints: DailyLimit
}
