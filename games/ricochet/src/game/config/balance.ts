export const BALANCE = {
  field: {
    radiusWidthRatio: 0.47,
    topMargin: 46,
    bottomMargin: 66,
    laneCount: 5,
    paddleOrbitRatio: 0.32,
  },
  core: {
    radius: 24,
    maxHp: 3,
    invulnerability: 1.2,
    pulseSpeed: 1.6,
  },
  paddle: {
    arcRatio: 0.86,
    thickness: 14,
    snapTime: 0.07,
    ghostFade: 0.18,
  },
  bullet: {
    radius: 7,
    poolSize: 120,
    deflectedSpeedMultiplier: 1.45,
  },
  spawn: {
    telegraph: 1,
    firstDelay: 1.6,
    intervalStart: 1.45,
    intervalEnd: 0.42,
    doubleChanceStart: 0,
    doubleChanceEnd: 0.5,
    minArrivalGapStart: 0.5,
    minArrivalGapEnd: 0.15,
    repeatLaneChance: 0.28,
  },
  ramp: {
    seconds: 120,
    speedStart: 150,
    speedEnd: 330,
  },
  score: {
    deflect: 10,
    comboStep: 1,
    maxMultiplier: 10,
    comboWindow: 2.6,
  },
  juice: {
    deflectHitStop: 0.045,
    deathHitStop: 0.22,
    deflectShake: 0.14,
    coreHitShake: 0.55,
  },
  run: {
    dailyEpoch: '2026-08-25',
    seedPrefix: 'ricochet',
  },
} as const

export type Balance = typeof BALANCE
