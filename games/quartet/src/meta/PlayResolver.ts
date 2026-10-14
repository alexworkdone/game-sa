import type { ParticleAmounts } from '../shared/ParticleColor.js'
import { PARTICLE_COLORS, emptyAmounts } from '../shared/ParticleColor.js'
import type { DailyTracker } from './DailyTracker.js'
import type { LevelProgress, LevelRecord } from './LevelProgress.js'
import type { RankSystem, XpGain } from './RankSystem.js'
import type { IScoring, PuzzleOutcome, Reward } from './Scoring.js'
import type { Stats } from './Stats.js'
import type { Wallet } from './Wallet.js'

export interface Bundle {
  readonly particles: ParticleAmounts
  readonly hints: number
}

export interface PlaySummary {
  readonly outcome: PuzzleOutcome
  readonly reward: Reward
  readonly xp: XpGain
  readonly rankBonus: Bundle | null
  readonly level: LevelRecord | null
  readonly dailyStreak: number | null
  readonly bonusHints: number
}

export const RANK_UP_BUNDLE: Bundle = {
  particles: { yellow: 20, green: 20, blue: 20, purple: 20 },
  hints: 2,
}

export const CHEST_BUNDLE: Bundle = {
  particles: { yellow: 30, green: 30, blue: 30, purple: 30 },
  hints: 2,
}

const DAILY_HINTS = 1

export class PlayResolver {
  private readonly scoring: IScoring
  private readonly wallet: Wallet
  private readonly ranks: RankSystem
  private readonly progress: LevelProgress
  private readonly daily: DailyTracker
  private readonly stats: Stats

  constructor(
    scoring: IScoring,
    wallet: Wallet,
    ranks: RankSystem,
    progress: LevelProgress,
    daily: DailyTracker,
    stats: Stats,
  ) {
    this.scoring = scoring
    this.wallet = wallet
    this.ranks = ranks
    this.progress = progress
    this.daily = daily
    this.stats = stats
  }

  resolve(outcome: PuzzleOutcome): PlaySummary {
    const reward = this.scoring.evaluate(outcome)
    this.wallet.add(reward.particles)

    const xp = this.ranks.add(reward.score)
    const rankBonus = xp.rankUps > 0 ? this.scale(RANK_UP_BUNDLE, xp.rankUps) : null
    if (rankBonus) this.grant(rankBonus)

    const level = outcome.mode === 'level' ? this.progress.record(outcome.level, reward.stars) : null

    let dailyStreak: number | null = null
    let bonusHints = 0
    if (outcome.mode === 'daily') {
      const fresh = this.daily.complete({
        won: outcome.won,
        stars: reward.stars,
        mistakes: outcome.mistakes,
      })
      dailyStreak = this.daily.streak
      if (fresh && outcome.won) {
        bonusHints = DAILY_HINTS
        this.wallet.addHints(DAILY_HINTS)
      }
    }

    this.stats.record({
      won: outcome.won,
      perfect: reward.stars === 3,
      score: reward.score,
      hintsUsed: outcome.hintsUsed,
      elapsedMs: outcome.elapsedMs,
    })

    return { outcome, reward, xp, rankBonus, level, dailyStreak, bonusHints }
  }

  claimChest(chapter: number): Bundle | null {
    if (!this.progress.claimChest(chapter)) return null
    this.grant(CHEST_BUNDLE)
    return CHEST_BUNDLE
  }

  private grant(bundle: Bundle): void {
    this.wallet.add(bundle.particles)
    this.wallet.addHints(bundle.hints)
  }

  private scale(bundle: Bundle, times: number): Bundle {
    const particles = emptyAmounts()
    for (const color of PARTICLE_COLORS) particles[color] = bundle.particles[color] * times
    return { particles, hints: bundle.hints * times }
  }
}
