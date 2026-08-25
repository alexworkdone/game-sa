export interface DailySeedOptions {
  readonly prefix: string
  readonly epochIsoDate: string
}

export class DailySeed {
  private readonly prefix: string
  private readonly epochUtcDay: number

  constructor(options: DailySeedOptions) {
    this.prefix = options.prefix
    this.epochUtcDay = DailySeed.toUtcDay(new Date(`${options.epochIsoDate}T00:00:00Z`))
  }

  private static toUtcDay(date: Date): number {
    return Math.floor(
      Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) / 86_400_000,
    )
  }

  isoDate(date: Date = new Date()): string {
    const y = date.getUTCFullYear()
    const m = `${date.getUTCMonth() + 1}`.padStart(2, '0')
    const d = `${date.getUTCDate()}`.padStart(2, '0')
    return `${y}-${m}-${d}`
  }

  dayNumber(date: Date = new Date()): number {
    return DailySeed.toUtcDay(date) - this.epochUtcDay + 1
  }

  seedFor(date: Date = new Date()): string {
    return `${this.prefix}:${this.isoDate(date)}`
  }

  millisUntilNextDay(date: Date = new Date()): number {
    const nextUtcMidnight = Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate() + 1,
    )
    return nextUtcMidnight - date.getTime()
  }
}
