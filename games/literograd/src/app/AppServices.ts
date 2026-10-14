import type { IAnalytics, IPortal, IStorage } from '@sa/core'
import type { Builder } from '../meta/Builder.js'
import type { City } from '../meta/City.js'
import type { Grants } from '../meta/Grants.js'
import type { Perks } from '../meta/Perks.js'
import type { Preferences } from '../meta/Preferences.js'
import type { Records } from '../meta/Records.js'
import type { Wallet } from '../meta/Wallet.js'
import type { ITownPainter } from '../render/ITownPainter.js'
import type { IFrameScheduler } from '../round/FrameScheduler.js'
import type { IModeFactory } from '../round/ModeFactory.js'
import type { RoundResolver } from '../round/RoundResolver.js'

export interface AppServices {
  readonly storage: IStorage
  readonly portal: IPortal
  readonly analytics: IAnalytics
  readonly wallet: Wallet
  readonly city: City
  readonly perks: Perks
  readonly builder: Builder
  readonly records: Records
  readonly prefs: Preferences
  readonly grants: Grants
  readonly modes: IModeFactory
  readonly resolver: RoundResolver
  readonly painter: ITownPainter
  readonly scheduler: IFrameScheduler
}
