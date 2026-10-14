import type { IRenderer } from '@sa/core'
import { PALETTE } from '../config/palette.js'
import type { PearlKind } from '../config/pearls.js'
import { drawPearl } from '../render/Icons.js'

export interface WalletSource {
  wallet(kind: PearlKind): number
}

const WALLET_GAP = 18

export const drawWallets = (
  r: IRenderer,
  source: WalletSource,
  kinds: readonly PearlKind[],
  right: number,
  y: number,
  baseSize: number,
  fill: string = PALETTE.ink,
): void => {
  const size = kinds.length > 2 ? baseSize * 0.72 : kinds.length > 1 ? baseSize * 0.86 : baseSize
  const icon = size * 0.8
  let x = right
  for (const kind of [...kinds].reverse()) {
    const label = String(source.wallet(kind))
    const style = { size, weight: 900 } as const
    x -= r.measureText(label, style)
    r.text(label, x, y + 1, { ...style, fill, baseline: 'middle' })
    drawPearl(r, x - icon / 2 - 5, y, icon, 1, kind)
    x -= icon + 5 + WALLET_GAP
  }
}
