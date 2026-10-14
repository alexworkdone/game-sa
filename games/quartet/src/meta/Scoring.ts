import type { ParticleColor } from '../shared/ParticleColor.js'
import { emptyAmounts } from '../shared/ParticleColor.js'
import type { ParticleAmounts } from '../shared/ParticleColor.js'

export type PlayMode = 'level' | 'daily'

export interface PuzzleOutcome {
  readonly mode: PlayMode
  readonly level: number
  readonly won: boolean
  readonly mistakes: number
  readonly hintsUsed: number
  readonly elapsedMs: number
  readonly solvedColors: readonly ParticleColor[]
}

export type ScoreLineKind = 'groups' | 'perfect' | 'speed' | 'mistakes' | 'hints' | 'daily'

export interface ScoreLine {
  readonly kind: ScoreLineKind
  readonly value: number
}

export interface Reward {
  readonly stars: 0 | 1 | 2 | 3
  readonly score: number
  readonly lines: readonly ScoreLine[]
  readonly particles: ParticleAmounts
}

export interface IScoring {
  evaluate(outcome: PuzzleOutcome): Reward
}

const GROUP_POINTS: Readonly<Record<ParticleColor, number>> = {
  yellow: 100,
  green: 150,
  blue: 200,
  purple: 300,
}

const PARTICLES_PER_GROUP = 10
const PERFECT_PARTICLE_BONUS = 5

export class Scoring implements IScoring {
  evaluate(outcome: PuzzleOutcome): Reward {
    const stars = this.stars(outcome)
    const lines: ScoreLine[] = []
    const groups = outcome.solvedColors.reduce((sum, color) => sum + GROUP_POINTS[color], 0)
    lines.push({ kind: 'groups', value: groups })

    if (outcome.won) {
      if (outcome.mistakes === 0) lines.push({ kind: 'perfect', value: 250 })
      const speed = this.speedBonus(outcome.elapsedMs)
      if (speed > 0) lines.push({ kind: 'speed', value: speed })
    }
    if (outcome.mistakes > 0) lines.push({ kind: 'mistakes', value: -40 * outcome.mistakes })
    if (outcome.hintsUsed > 0) lines.push({ kind: 'hints', value: -50 * outcome.hintsUsed })

    let score = Math.max(0, lines.reduce((sum, line) => sum + line.value, 0))
    if (outcome.mode === 'daily' && score > 0) {
      const bonus = Math.round(score * 0.5)
      lines.push({ kind: 'daily', value: bonus })
      score += bonus
    }

    return { stars, score, lines, particles: this.particles(outcome, stars) }
  }

  private stars(outcome: PuzzleOutcome): Reward['stars'] {
    if (!outcome.won) return 0
    const byMistakes = outcome.mistakes === 0 ? 3 : outcome.mistakes <= 2 ? 2 : 1
    return outcome.hintsUsed > 0 ? (Math.min(byMistakes, 2) as 1 | 2) : byMistakes
  }

  private speedBonus(elapsedMs: number): number {
    const seconds = elapsedMs / 1000
    if (seconds < 60) return 200
    if (seconds < 120) return 100
    if (seconds < 240) return 50
    return 0
  }

  private particles(outcome: PuzzleOutcome, stars: number): ParticleAmounts {
    const amounts = emptyAmounts()
    const perGroup = PARTICLES_PER_GROUP + (stars === 3 ? PERFECT_PARTICLE_BONUS : 0)
    const multiplier = outcome.mode === 'daily' ? 2 : 1
    for (const color of outcome.solvedColors) amounts[color] += perGroup * multiplier
    return amounts
  }
}
