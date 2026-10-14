export interface GunStats {
  readonly damage: number
  readonly cooldown: number
  readonly magazine: number
  readonly reload: number
  readonly volley: number
}

export type FireResult = 'fired' | 'empty' | 'busy'

export class Gun {
  stats: GunStats
  ammo: number
  reloadTimer = 0
  cooldownTimer = 0

  constructor(stats: GunStats) {
    this.stats = stats
    this.ammo = stats.magazine
  }

  reset(stats: GunStats): void {
    this.stats = stats
    this.ammo = stats.magazine
    this.reloadTimer = 0
    this.cooldownTimer = 0
  }

  get reloading(): boolean {
    return this.reloadTimer > 0
  }

  get reloadProgress(): number {
    return this.reloading ? 1 - this.reloadTimer / this.stats.reload : 1
  }

  update(dt: number): boolean {
    this.cooldownTimer = Math.max(0, this.cooldownTimer - dt)
    if (this.reloadTimer <= 0) return false
    this.reloadTimer -= dt
    if (this.reloadTimer > 0) return false
    this.reloadTimer = 0
    this.ammo = this.stats.magazine
    return true
  }

  tryFire(infinite: boolean): FireResult {
    if (this.cooldownTimer > 0) return 'busy'
    if (infinite) {
      this.reloadTimer = 0
      this.ammo = this.stats.magazine
      this.cooldownTimer = this.stats.cooldown * 0.7
      return 'fired'
    }
    if (this.reloading) return 'busy'
    if (this.ammo <= 0) {
      this.startReload()
      return 'empty'
    }
    this.ammo--
    this.cooldownTimer = this.stats.cooldown
    if (this.ammo === 0) this.startReload()
    return 'fired'
  }

  startReload(): boolean {
    if (this.reloading || this.ammo >= this.stats.magazine) return false
    this.reloadTimer = this.stats.reload
    return true
  }
}
