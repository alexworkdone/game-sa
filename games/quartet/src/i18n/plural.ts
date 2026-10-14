export type PluralForms = readonly [one: string, few: string, many: string]

export const plural = (count: number, forms: PluralForms): string => {
  const n = Math.abs(count) % 100
  const last = n % 10
  if (n > 10 && n < 20) return forms[2]
  if (last === 1) return forms[0]
  if (last >= 2 && last <= 4) return forms[1]
  return forms[2]
}

export const countOf = (count: number, forms: PluralForms): string =>
  `${count.toLocaleString('uk-UA')}\u00a0${plural(count, forms)}`
