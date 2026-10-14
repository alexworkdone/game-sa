export interface IDaySeed {
  isoDate(date?: Date): string
  seedFor(date?: Date): string
  dayNumber(date?: Date): number
  millisUntilNextDay(date?: Date): number
}

const DAY_MS = 86_400_000

export class LocalDaySeed implements IDaySeed {
  private readonly prefix: string
  private readonly epoch: number

  constructor(prefix: string, epochIsoDate: string) {
    this.prefix = prefix
    const [y, m, d] = epochIsoDate.split('-').map(Number)
    this.epoch = LocalDaySeed.dayIndex(new Date(y ?? 2026, (m ?? 1) - 1, d ?? 1))
  }

  private static dayIndex(date: Date): number {
    return Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / DAY_MS)
  }

  isoDate(date: Date = new Date()): string {
    const pad = (value: number): string => `${value}`.padStart(2, '0')
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
  }

  seedFor(date: Date = new Date()): string {
    return `${this.prefix}:${this.isoDate(date)}`
  }

  dayNumber(date: Date = new Date()): number {
    return LocalDaySeed.dayIndex(date) - this.epoch + 1
  }

  millisUntilNextDay(date: Date = new Date()): number {
    const next = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1)
    return next.getTime() - date.getTime()
  }
}
