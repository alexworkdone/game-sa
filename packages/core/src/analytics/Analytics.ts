import type { EventParams, IAnalytics, IAnalyticsSink } from './IAnalytics.js'

export interface AnalyticsOptions {
  readonly sessionId?: string
  readonly sinks?: readonly IAnalyticsSink[]
}

export class Analytics implements IAnalytics {
  readonly sessionId: string

  private readonly sinks: IAnalyticsSink[]
  private readonly marks = new Map<string, number>()
  private readonly startedAt = performance.now()
  private sequence = 0

  constructor(options: AnalyticsOptions = {}) {
    this.sessionId = options.sessionId ?? Analytics.createSessionId()
    this.sinks = [...(options.sinks ?? [])]
  }

  private static createSessionId(): string {
    const random = Math.floor(Math.random() * 0xffffff).toString(36)
    return `${Date.now().toString(36)}-${random}`
  }

  addSink(sink: IAnalyticsSink): void {
    this.sinks.push(sink)
  }

  track(name: string, params: EventParams = {}): void {
    const event = {
      name,
      params,
      sessionId: this.sessionId,
      sequence: ++this.sequence,
      elapsedMs: Math.round(performance.now() - this.startedAt),
    }
    for (const sink of this.sinks) sink.receive(event)
  }

  mark(name: string): void {
    this.marks.set(name, performance.now())
  }

  measure(name: string, fromMark: string, params: EventParams = {}): void {
    const start = this.marks.get(fromMark)
    if (start === undefined) return
    this.track(name, { ...params, duration_ms: Math.round(performance.now() - start) })
  }

  dispose(): void {
    this.sinks.length = 0
    this.marks.clear()
  }
}
