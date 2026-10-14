import { PALETTE } from './palette.js'

export type PearlKind = 'white' | 'pink' | 'black' | 'rainbow'

export const PEARL_KINDS: readonly PearlKind[] = ['white', 'pink', 'black', 'rainbow']

export interface PearlLook {
  readonly name: string
  readonly forms: readonly [string, string, string]
  readonly fill: string
  readonly shade: string
  readonly shine: string
}

export const PEARLS: Readonly<Record<PearlKind, PearlLook>> = {
  white: {
    name: 'білі перли',
    forms: ['біла перлина', 'білі перлини', 'білих перлин'],
    fill: PALETTE.pearl,
    shade: PALETTE.pearlShade,
    shine: '#ffffff',
  },
  pink: {
    name: 'рожеві перли',
    forms: ['рожева перлина', 'рожеві перлини', 'рожевих перлин'],
    fill: '#ffc6da',
    shade: '#d4849f',
    shine: '#fff3f8',
  },
  black: {
    name: 'чорні перли',
    forms: ['чорна перлина', 'чорні перлини', 'чорних перлин'],
    fill: '#4b4459',
    shade: '#1f1a29',
    shine: '#c9bff0',
  },
  rainbow: {
    name: 'райдужні перли',
    forms: ['райдужна перлина', 'райдужні перлини', 'райдужних перлин'],
    fill: '#eef6ff',
    shade: '#a9b9e6',
    shine: '#ffffff',
  },
}

export const pearlCount = (count: number, kind: PearlKind): string => {
  const [one, few, many] = PEARLS[kind].forms
  const tens = count % 100
  const units = count % 10
  const form = units === 1 && tens !== 11 ? one : units >= 2 && units <= 4 && (tens < 12 || tens > 14) ? few : many
  return `${count}\u00a0${form}`
}

export interface PriceTag {
  readonly kind: PearlKind
  readonly amount: number
}

export type PearlPrice = readonly PriceTag[]

export type Wallets = Record<PearlKind, number>

export const emptyWallets = (): Wallets => ({ white: 0, pink: 0, black: 0, rainbow: 0 })

export const pearlKindOf = (tier: number): PearlKind =>
  PEARL_KINDS[Math.max(1, Math.min(tier, PEARL_KINDS.length)) - 1] as PearlKind

export interface ExchangeRate {
  readonly from: PearlKind
  readonly to: PearlKind
  readonly give: number
  readonly get: number
}

export interface ExchangePair {
  readonly up: ExchangeRate
  readonly down: ExchangeRate
}

const pair = (low: PearlKind, high: PearlKind, lowAmount: number, highAmount: number): ExchangePair => ({
  up: { from: low, to: high, give: lowAmount, get: highAmount },
  down: { from: high, to: low, give: highAmount, get: lowAmount },
})

export const EXCHANGE_PAIRS: readonly ExchangePair[] = [
  pair('white', 'pink', 10, 1),
  pair('pink', 'black', 10, 1),
  pair('black', 'rainbow', 3, 1),
]

export const pearlTier = (kind: PearlKind): number => PEARL_KINDS.indexOf(kind) + 1
