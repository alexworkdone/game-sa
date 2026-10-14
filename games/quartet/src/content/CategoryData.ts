export type Tier = 1 | 2 | 3 | 4

export type WordRule =
  | { readonly kind: 'prefix'; readonly values: readonly string[] }
  | { readonly kind: 'suffix'; readonly values: readonly string[] }
  | { readonly kind: 'contains'; readonly values: readonly string[] }
  | { readonly kind: 'palindrome' }

export interface CategoryData {
  readonly id: string
  readonly title: string
  readonly tier: Tier
  readonly family: string
  readonly words: readonly string[]
  readonly accepts?: readonly string[]
  readonly rule?: WordRule
}
