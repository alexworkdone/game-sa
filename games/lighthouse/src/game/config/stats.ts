export interface StatLine {
  readonly label: string | null
  readonly value: string
}

export const stat = (label: string, value: string | number): StatLine => ({ label, value: String(value) })

export const note = (value: string): StatLine => ({ label: null, value })
