export class Homing {
  #spells
  #finders

  constructor(spells, finders) {
    this.#spells = spells
    this.#finders = finders
  }

  guide(pool, i, dt) {
    const magnet = this.#spells[pool.spell[i]].magnet
    if (!magnet) return
    const find = this.#finders[magnet.seek]
    if (!find) return
    const vx = pool.vx[i]
    const vy = pool.vy[i]
    const vz = pool.vz[i]
    const speed = Math.hypot(vx, vy, vz)
    if (speed < 1e-3) return
    const ux = vx / speed
    const uy = vy / speed
    const uz = vz / speed
    const target = find(pool.x[i], pool.y[i], pool.z[i], ux, uy, uz, magnet.range, Math.cos(magnet.cone))
    if (!target) return

    const tx = target.dx
    const ty = target.dy
    const tz = target.dz
    const distance = Math.hypot(tx, ty, tz)
    if (distance < 1e-3) return
    const dx = tx / distance
    const dy = ty / distance
    const dz = tz / distance
    const angle = Math.acos(Math.max(-1, Math.min(1, ux * dx + uy * dy + uz * dz)))
    if (angle < 1e-4) return
    const pull = magnet.turn * (1 + 1.5 * (1 - distance / magnet.range)) * dt
    const k = Math.min(1, pull / angle)
    let nx = ux + (dx - ux) * k
    let ny = uy + (dy - uy) * k
    let nz = uz + (dz - uz) * k
    const length = Math.hypot(nx, ny, nz) || 1
    nx /= length
    ny /= length
    nz /= length
    pool.vx[i] = nx * speed
    pool.vy[i] = ny * speed
    pool.vz[i] = nz * speed
  }
}
