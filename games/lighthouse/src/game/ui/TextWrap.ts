import type { IRenderer, TextStyle } from '@sa/core'

export const NBSP = ' '

const UNIT_GAP = /(\d)\s(?=(?:%|с|хв)(?![\p{L}\p{N}]))/gu

export const keepUnits = (text: string): string => text.replace(UNIT_GAP, `$1${NBSP}`)

export const wrapText = (r: IRenderer, text: string, maxWidth: number, style: TextStyle): string[] => {
  const rows: string[] = []
  let row = ''
  for (const word of keepUnits(text).split(' ')) {
    const candidate = row ? `${row} ${word}` : word
    if (row && r.measureText(candidate, style) > maxWidth) {
      rows.push(row)
      row = word
    } else {
      row = candidate
    }
  }
  if (row) rows.push(row)
  return rows
}

export interface FittedText {
  readonly rows: readonly string[]
  readonly size: number
}

export const fitText = (
  r: IRenderer,
  text: string,
  maxWidth: number,
  style: TextStyle,
  maxLines: number,
  minSize: number,
): FittedText => {
  let size = style.size ?? 14
  const layout = (): string[] => wrapText(r, text, maxWidth, { ...style, size })
  let rows = layout()
  const fits = (): boolean =>
    rows.length <= maxLines && rows.every((row) => r.measureText(row, { ...style, size }) <= maxWidth)
  while (!fits() && size > minSize) {
    size -= 0.5
    rows = layout()
  }
  return { rows: rows.slice(0, maxLines), size }
}
