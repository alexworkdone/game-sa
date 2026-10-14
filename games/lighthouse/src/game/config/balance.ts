export const BALANCE = {
  hero: {
    width: 18,
    height: 28,
    speed: 124,
    climbSpeed: 100,
    gravity: 1500,
    maxFall: 560,
    ladderSnap: 13,
    exitSnap: 10,
    invulnerable: 1.3,
    swimSpeed: 124,
    swimAccel: 700,
    buoyancy: 45,
    surfaceDepth: 10,
    stepUp: 46,
    ladderHop: 150,
    secondWindGrace: 2.5,
    plankSlack: 12,
    fallDrift: 320,
    airRefill: 4,
    airWarning: 3,
    drownInterval: 1.5,
    headroom: 6,
    baseHp: 3,
  },
  weapon: {
    flareSpeed: 660,
    flareRange: 600,
    fanAngle: 0.17,
    muzzleY: 15,
    homingRadius: 280,
    homingTurn: 7,
    blastRadius: 56,
    harpoonDamage: 1,
    harpoonRange: 1.7,
    frostTime: 2.5,
    volleySpacing: 6,
  },
  water: {
    startDelay: 4,
    baseRiseTime: 112,
    riseTimePerFloor: 5,
    minRiseTime: 46,
    lateFromFloor: 14,
    lateRiseTimePerFloor: 0.4,
    lateMinRiseTime: 36,
    openBoost: 1.7,
  },
  floor: {
    keysBase: 5,
    keysPerTwoFloors: 1,
    keysMax: 10,
    enemiesBase: 2,
    enemiesPerFloor: 0.6,
    enemiesMax: 9,
    enemiesMaxCap: 13,
    enemyHpStepFloors: 10,
    enemyHpStep: 0.5,
    loosePearlsMin: 3,
    loosePearlsMax: 6,
    clearBonusBase: 5,
    clearBonusPerFloor: 1,
    checkpointEvery: 5,
    safeRadiusCells: 6,
  },
  director: {
    spawnIntervalBase: 11,
    spawnIntervalPerFloor: 0.4,
    spawnIntervalMin: 4.5,
    maxAlive: 10,
    maxAliveCap: 14,
    emergeTime: 0.7,
  },
  enemies: {
    crab: { hp: 2, speed: 46, pearls: 1, width: 24, height: 18, fromFloor: 1 },
    jelly: { hp: 2, speed: 36, pearls: 2, width: 22, height: 24, fromFloor: 3 },
    octopus: { hp: 4, speed: 58, pearls: 3, width: 24, height: 26, fromFloor: 5 },
    urchin: { hp: 3, speed: 0, pearls: 2, width: 24, height: 22, fromFloor: 7 },
    guardian: { hp: 10, speed: 0, pearls: 10, width: 46, height: 44, fromFloor: Number.POSITIVE_INFINITY },
  },
  tiers: {
    costStep: 0.5,
    guardianStep: 1,
  },
  guardian: {
    hpPerFive: 1,
    pearlsPerFloor: 1,
    interval: 2.2,
    telegraph: 0.5,
    inkSpeed: 175,
    inkRange: 620,
    reach: 520,
    maxDrop: 40,
    burstFromFloor: 10,
    burstGap: 0.28,
    frostShare: 0.25,
  },
  bigCrab: { hp: 5, speed: 26, pearls: 0, width: 36, height: 26 },
  keyCrab: { hpBonus: 1, speedBoost: 1.6 },
  shell: {
    fromFloor: 3,
    chance: 0.6,
    waterShare: 0.4,
    airShare: 0.85,
    fightTime: 2.5,
    pearlsBase: 10,
    pearlsPerFloor: 2,
  },
  jellyShock: { radius: 150, charge: 0.9, cooldown: 3.6, flash: 0.35 },
  octopusInk: { interval: 3.8, cloudRadius: 48, cloudTime: 7, swimBoost: 1.1 },
  variants: { fromFloor: 3, chance: 0.4 },
  dark: { lightRadius: 132, softEdge: 56 },
  ice: { plankShare: 0.3, accel: 170, floes: 3, floeMin: 72, floeMax: 124, floeDrift: 14 },
  lightning: { intervalMin: 6, intervalMax: 9, telegraph: 1.2, width: 36, enemyDamage: 3, aimSpread: 3, flash: 0.35 },
  currents: { speed: 60, kelpPatches: 3, kelpDrag: 0.45, kelpWidth: 4 },
  streak: { step: 0.1, max: 2 },
  enemySpeedPerFloor: 0.035,
  enemySpeedMaxBonus: 0.5,
  urchin: {
    interval: 2.6,
    telegraph: 0.55,
    spineSpeed: 250,
    rangeCells: 11,
  },
  pickups: {
    gravity: 900,
    dropPowerChance: 0.09,
    magnetPull: 520,
    striderBoost: 1.5,
    secondPowerUpFloor: 3,
  },
} as const

export const keysForFloor = (floor: number): number =>
  Math.min(
    BALANCE.floor.keysMax,
    BALANCE.floor.keysBase + Math.floor((floor - 1) / 2) * BALANCE.floor.keysPerTwoFloors,
  )

export const enemiesForFloor = (floor: number): number =>
  Math.min(
    Math.min(BALANCE.floor.enemiesMaxCap, BALANCE.floor.enemiesMax + Math.floor((floor - 1) / 10)),
    BALANCE.floor.enemiesBase + Math.floor((floor - 1) * BALANCE.floor.enemiesPerFloor),
  )

export const waterRiseTime = (floor: number): number => {
  const water = BALANCE.water
  if (floor <= water.lateFromFloor) {
    return Math.max(water.minRiseTime, water.baseRiseTime - (floor - 1) * water.riseTimePerFloor)
  }
  return Math.max(water.lateMinRiseTime, water.minRiseTime - (floor - water.lateFromFloor) * water.lateRiseTimePerFloor)
}

const decades = (floor: number): number => Math.floor((floor - 1) / BALANCE.floor.enemyHpStepFloors)

export const enemyHpScale = (floor: number): number => 1 + decades(floor) * BALANCE.floor.enemyHpStep

export const maxAliveEnemies = (floor: number): number =>
  Math.min(BALANCE.director.maxAliveCap, BALANCE.director.maxAlive + decades(floor))

export const spawnInterval = (floor: number): number =>
  Math.max(
    BALANCE.director.spawnIntervalMin,
    BALANCE.director.spawnIntervalBase - (floor - 1) * BALANCE.director.spawnIntervalPerFloor,
  )

export const enemySpeedScale = (floor: number): number =>
  1 + Math.min(BALANCE.enemySpeedMaxBonus, (floor - 1) * BALANCE.enemySpeedPerFloor)

export const clearBonus = (floor: number, tier: number): number =>
  BALANCE.floor.clearBonusBase + floor * BALANCE.floor.clearBonusPerFloor * tier

export const isGuardianFloor = (floor: number): boolean => floor % BALANCE.floor.checkpointEvery === 0

export const guardianHp = (floor: number): number =>
  BALANCE.enemies.guardian.hp + Math.floor(floor / BALANCE.floor.checkpointEvery) * BALANCE.guardian.hpPerFive
