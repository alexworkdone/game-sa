export const PALETTE = {
  background: '#0b0d14',
  surface: '#151a27',
  grid: '#1e2536',
  ink: '#f2f5ff',
  inkMuted: '#79839d',
  friendly: '#5ef2ff',
  hostile: '#ff5470',
  reward: '#ffd166',
} as const

export type PaletteColor = (typeof PALETTE)[keyof typeof PALETTE]
