export const PLAYER = {
  color: [214, 64, 170],
  name: 'Ти',
}

export const REALM = {
  plazaRadius: 56,
  blendReach: 32,
  levelTime: 1.8,
  riseTime: 2.6,
  riseDepth: 42,
  levelMana: [0, 0, 60, 140, 240, 380, 560, 780],
  buildCost: 40,
  upgradeCost: 25,
  castleSpacing: 150,
  goalShare: 0.6,
  health: [0, 120, 160, 210, 270, 340, 420, 520],
  healthRegen: 3,
  regenDelay: 6,
  alarm: 2.5,
  spillShare: 0.3,
  spillPearls: 10,
  ruinHealth: 0.5,
  castleMana: 0.5,
  gauge: { range: 420, width: 54, height: 6, lift: 7, flash: 0.12 },
}

export const MANA = {
  capacity: 256,
  initialCount: 80,
  tiers: [
    { share: 0.6, min: 4, max: 14 },
    { share: 0.3, min: 20, max: 45 },
    { share: 0.1, min: 70, max: 140 },
  ],
  sizeScale: 0.8,
  hover: 2.5,
  viewRadius: 400,
  fadeStart: 230,
  possessRadius: 5,
  possessSplash: 12,
  neutral: [[255, 240, 170], [236, 188, 60], [150, 98, 18]],
  owned: [[255, 176, 236], [214, 64, 170], [110, 18, 86]],
}

export const MAGNETISM = {
  radius: 70,
  touch: 3,
  splash: 12,
  pull: 34,
  maxSpeed: 48,
  ring: 0.7,
}

export const WIZARD = {
  health: 100,
  regen: 3,
  homeRegen: 14,
  regenDelay: 4,
  shield: 3,
  hitRadius: 2.6,
  respawnMana: 0.5,
}

export const CROWD = {
  camps: 9,
  perCamp: 5,
  campRadius: 42,
  campSpacing: 120,
  safeStart: 220,
  height: 3.4,
  walkSpeed: 4.5,
  aggro: 200,
  range: 170,
  cooldown: [2.6, 4.2],
  aimTime: 0.6,
  spread: 0.05,
  lead: 0.8,
  fallTime: 1.1,
  respawn: 45,
  respawnDistance: 260,
  drop: [3, 6],
  hitRadius: 1.8,
  tunics: [
    [168, 52, 48],
    [52, 86, 160],
    [120, 84, 48],
    [70, 120, 70],
    [130, 60, 130],
  ],
  skin: [232, 186, 148],
  legs: [70, 54, 44],
}

export const RESERVE = {
  max: 100,
  regen: 4,
  castleRegen: 16,
}

export const BALLOONS = {
  speed: 22,
  cruise: 22,
  pickupRange: 3,
  detour: 260,
  hoverRing: 12,
  perLevel: [0, 1, 1, 2, 2, 2, 3, 3],
  capacity: [0, 50, 60, 70, 85, 100, 120, 140],
  gauge: [[24, 16, 52], [255, 155, 227]],
  envelope: [[255, 210, 240], [214, 64, 170], [120, 22, 90]],
  basket: [140, 98, 60],
}
