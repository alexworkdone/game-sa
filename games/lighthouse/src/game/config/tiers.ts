import { BALANCE } from './balance.js'
import type { TierHazard } from './hazards.js'
import { PALETTE } from './palette.js'

export type TowerDecor = 'none' | 'ice' | 'embers' | 'kelp'

export interface TowerLook {
  readonly stripe: string
  readonly stripeAlt: string
  readonly roof: string
  readonly trim: string
  readonly rail: string
  readonly beam: string
  readonly beamCore: string
  readonly decor: TowerDecor
}

export interface LevelTheme {
  readonly name: string
  readonly hazard: TierHazard
  readonly tower: TowerLook
  readonly sky: string
  readonly wall: string
  readonly wallBrick: string
  readonly wallMortar: string
  readonly window: string
  readonly stone: string
  readonly stoneLight: string
  readonly stoneDark: string
  readonly plank: string
  readonly plankLight: string
  readonly plankDark: string
  readonly ladder: string
  readonly ladderDark: string
  readonly water: string
  readonly waterDeep: string
  readonly waterFoam: string
}

export const LEVEL_THEMES: readonly LevelTheme[] = [
  {
    name: 'Нічний шторм',
    hazard: 'none',
    tower: {
      stripe: '#d8443a',
      stripeAlt: '#e9e4da',
      roof: '#d8443a',
      trim: PALETTE.stoneDark,
      rail: PALETTE.stoneLight,
      beam: PALETTE.light,
      beamCore: PALETTE.lightCore,
      decor: 'none',
    },
    sky: PALETTE.night,
    wall: PALETTE.wall,
    wallBrick: PALETTE.wallBrick,
    wallMortar: PALETTE.wallMortar,
    window: PALETTE.window,
    stone: PALETTE.stone,
    stoneLight: PALETTE.stoneLight,
    stoneDark: PALETTE.stoneDark,
    plank: PALETTE.plank,
    plankLight: PALETTE.plankLight,
    plankDark: PALETTE.plankDark,
    ladder: PALETTE.ladder,
    ladderDark: PALETTE.ladderDark,
    water: PALETTE.water,
    waterDeep: PALETTE.waterDeep,
    waterFoam: PALETTE.waterFoam,
  },
  {
    name: 'Крижана буря',
    hazard: 'ice',
    tower: {
      stripe: '#4f93bf',
      stripeAlt: '#eaf6fc',
      roof: '#2f6690',
      trim: '#24323f',
      rail: '#b7d3e2',
      beam: '#bfe9ff',
      beamCore: '#f2fbff',
      decor: 'ice',
    },
    sky: '#0b1622',
    wall: '#14212b',
    wallBrick: '#1b2c38',
    wallMortar: '#0f1a22',
    window: '#24405a',
    stone: '#3a4d5e',
    stoneLight: '#5b7489',
    stoneDark: '#24323f',
    plank: '#9fb9c9',
    plankLight: '#d4e6f0',
    plankDark: '#5f7b8c',
    ladder: '#b7d3e2',
    ladderDark: '#6a8799',
    water: '#3ab0c9',
    waterDeep: '#14506a',
    waterFoam: '#e8fbff',
  },
  {
    name: 'Багряний шторм',
    hazard: 'lightning',
    tower: {
      stripe: '#9e1f35',
      stripeAlt: '#2f1d24',
      roof: '#5c1423',
      trim: '#1a0c12',
      rail: '#8a4a55',
      beam: '#ff7a4a',
      beamCore: '#ffe0c8',
      decor: 'embers',
    },
    sky: '#1a0a12',
    wall: '#24121a',
    wallBrick: '#2e1822',
    wallMortar: '#1a0c12',
    window: '#4a1f2c',
    stone: '#4a2a33',
    stoneLight: '#6b3d47',
    stoneDark: '#2e1820',
    plank: '#a8603f',
    plankLight: '#d48a5e',
    plankDark: '#6b3424',
    ladder: '#c27a4e',
    ladderDark: '#7a3f26',
    water: '#8a2f4a',
    waterDeep: '#40142a',
    waterFoam: '#ffb3a6',
  },
  {
    name: 'Смарагдова безодня',
    hazard: 'currents',
    tower: {
      stripe: '#2f7d64',
      stripeAlt: '#cfe3c6',
      roof: '#3fa58a',
      trim: '#1a3028',
      rail: '#93b06a',
      beam: '#8dffc8',
      beamCore: '#eafff5',
      decor: 'kelp',
    },
    sky: '#08140f',
    wall: '#0f1f1a',
    wallBrick: '#142a22',
    wallMortar: '#0a1612',
    window: '#1d4034',
    stone: '#2a4a3c',
    stoneLight: '#3d6b56',
    stoneDark: '#1a3028',
    plank: '#7f9a5a',
    plankLight: '#a9c47e',
    plankDark: '#4c6236',
    ladder: '#93b06a',
    ladderDark: '#58703c',
    water: '#1f9a72',
    waterDeep: '#0c4a3a',
    waterFoam: '#b9ffe2',
  },
]

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X']

export const tierTheme = (tier: number): LevelTheme =>
  LEVEL_THEMES[(tier - 1) % LEVEL_THEMES.length] as LevelTheme

export const tierName = (tier: number): string => {
  const cycle = Math.floor((tier - 1) / LEVEL_THEMES.length)
  return cycle === 0 ? tierTheme(tier).name : `${tierTheme(tier).name} ${cycle + 1}`
}

export const tierNumeral = (tier: number): string => ROMAN[tier - 1] ?? String(tier)

export const tierCostScale = (tier: number): number => 1 + (tier - 1) * BALANCE.tiers.costStep

export const tierCostLabel = (tier: number): string => `×${tierCostScale(tier).toLocaleString('uk-UA')}`

export const tierGuardianScale = (tier: number): number => 1 + (tier - 1) * BALANCE.tiers.guardianStep
