import type { AnalyticsEvent, IAnalyticsSink } from './IAnalytics.js'

export class ConsoleSink implements IAnalyticsSink {
  receive(event: AnalyticsEvent): void {
    console.info(
      `[analytics] ${String(event.sequence).padStart(3, '0')} ${event.name}`,
      event.params,
    )
  }
}
