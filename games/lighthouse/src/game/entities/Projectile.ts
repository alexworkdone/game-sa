export type ProjectileOwner = 'hero' | 'enemy'

export type ProjectileLook = 'flare' | 'spine' | 'ink'

export interface ProjectileEffects {
  readonly homing: boolean
  readonly blast: boolean
  readonly frost: boolean
  readonly harpoon: boolean
}

export const NO_EFFECTS: ProjectileEffects = { homing: false, blast: false, frost: false, harpoon: false }

export class Projectile {
  active = false
  owner: ProjectileOwner = 'hero'
  x = 0
  y = 0
  vx = 0
  vy = 0
  damage = 1
  pierce = 0
  travelled = 0
  range = 0
  age = 0
  effects: ProjectileEffects = NO_EFFECTS
  look: ProjectileLook = 'flare'
  readonly hits = new Set<number>()
}

export interface ProjectileLaunch {
  readonly owner: ProjectileOwner
  readonly x: number
  readonly y: number
  readonly vx: number
  readonly vy: number
  readonly damage: number
  readonly pierce: number
  readonly range: number
  readonly effects: ProjectileEffects
  readonly look: ProjectileLook
}

export class ProjectilePool {
  readonly items: Projectile[]

  constructor(capacity = 64) {
    this.items = Array.from({ length: capacity }, () => new Projectile())
  }

  spawn(launch: ProjectileLaunch): Projectile | null {
    const item = this.items.find((candidate) => !candidate.active)
    if (!item) return null
    item.active = true
    item.owner = launch.owner
    item.x = launch.x
    item.y = launch.y
    item.vx = launch.vx
    item.vy = launch.vy
    item.damage = launch.damage
    item.pierce = launch.pierce
    item.range = launch.range
    item.travelled = 0
    item.age = 0
    item.effects = launch.effects
    item.look = launch.look
    item.hits.clear()
    return item
  }

  clear(): void {
    for (const item of this.items) item.active = false
  }
}
