import type { AnalyticsEvent, IAnalyticsSink } from './IAnalytics.js'

export class MemorySink implements IAnalyticsSink {
  private readonly buffer: AnalyticsEvent[] = []
  private readonly limit: number

  constructor(limit = 200) {
    this.limit = limit
  }

  receive(event: AnalyticsEvent): void {
    this.buffer.push(event)
    if (this.buffer.length > this.limit) this.buffer.shift()
  }

  get events(): readonly AnalyticsEvent[] {
    return this.buffer
  }

  clear(): void {
    this.buffer.length = 0
  }
}
