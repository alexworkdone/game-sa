import type { IDisposable } from '../types.js'

export type EventParams = Readonly<Record<string, string | number | boolean | null>>

export interface AnalyticsEvent {
  readonly name: string
  readonly params: EventParams
  readonly sessionId: string
  readonly sequence: number
  readonly elapsedMs: number
}

export interface IAnalyticsSink {
  receive(event: AnalyticsEvent): void
}

export interface IAnalytics extends IDisposable {
  readonly sessionId: string
  addSink(sink: IAnalyticsSink): void
  track(name: string, params?: EventParams): void
  mark(name: string): void
  measure(name: string, fromMark: string, params?: EventParams): void
}

export const CoreEvent = {
  GameLoadStart: 'game_load_start',
  GameFirstFrame: 'game_first_frame',
  FirstInput: 'first_input',
  GameplayStart: 'gameplay_start',
  GameplayEnd: 'gameplay_end',
  RunComplete: 'level_or_run_complete',
  Fail: 'fail',
  SettingChanged: 'setting_changed',
  RewardedOffered: 'rewarded_ad_offered',
  RewardedWatched: 'rewarded_ad_watched',
} as const

export type CoreEventName = (typeof CoreEvent)[keyof typeof CoreEvent]
