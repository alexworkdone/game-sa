export type TierHazard = 'none' | 'ice' | 'lightning' | 'currents'

export const TIER_HAZARD_HINTS: Readonly<Record<Exclude<TierHazard, 'none'>, string>> = {
  ice: 'Дошки слизькі, а під крижинами не виринеш — дихай між ними',
  lightning: 'Блискавка б’є в колону: стовп блимає — відійди вбік',
  currents: 'Течії зносять у воді, водорості чіпляються й гальмують',
}
