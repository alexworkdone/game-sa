export const PARTICLE_COLORS = ['yellow', 'green', 'blue', 'purple'] as const

export type ParticleColor = (typeof PARTICLE_COLORS)[number]

export type ParticleAmounts = Readonly<Record<ParticleColor, number>>

export const emptyAmounts = (): Record<ParticleColor, number> => ({
  yellow: 0,
  green: 0,
  blue: 0,
  purple: 0,
})
