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
    sparkLength: 9,
  },
  charge: {
    unitsPerCatch: 1,
    unitsPerSegment: 16,
    maxSegments: 3,
    pulseSpeed: 820,
  },
  spawn: {
    telegraph: 1,
    firstDelay: 1.6,
    intervalStart: 1.45,
    intervalEnd: 0.34,
    doubleChanceStart: 0,
    doubleChanceEnd: 0.5,
    minArrivalGapStart: 0.5,
    minArrivalGapEnd: 0.12,
    repeatLaneChance: 0.28,
  },
  ramp: {
    seconds: 80,
    speedStart: 150,
    speedEnd: 330,
  },
  score: {
    perCatch: 10,
    comboStep: 1,
    maxMultiplier: 10,
    comboWindow: 2.6,
  },
  juice: {
    absorbHitStop: 0.04,
    deathHitStop: 0.22,
    absorbShake: 0.11,
    chargeGainShake: 0.3,
    shieldSaveShake: 0.4,
    coreHitShake: 0.55,
  },
  run: {
    dailyEpoch: '2026-08-25',
    seedPrefix: 'ricochet',
  },
} as const

export type Balance = typeof BALANCE
