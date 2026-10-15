export class TerrainLayer {
  #mesh

  constructor(mesh) {
    this.#mesh = mesh
  }

  collect(scene) {
    const mesh = this.#mesh
    const { projector, batch, shader, camera, radius, lateralLimit } = scene
    const spacing = mesh.spacing
    const cells = mesh.cells
    const mask = mesh.mask
    const quadCount = mesh.quadCount
    const slots = mesh.slots
    const counts = mesh.count
    const vertices = mesh.vertices
    const normals = mesh.normal
    const colors = mesh.color
    const centroids = mesh.centroid
    const inX = projector.inX
    const inY = projector.inY
    const inZ = projector.inZ
    const fX = projector.fX
    const fY = projector.fY
    const rX = projector.rX
    const rY = projector.rY
    const camX = camera.x
    const camY = camera.y
    const camZ = camera.z
    const reach = Math.ceil(radius / spacing) + 1
    const limit = (radius + spacing) * (radius + spacing)
    const margin = spacing * 1.5
    const baseX = Math.floor(camX / spacing)
    const baseY = Math.floor(camY / spacing)

    for (let qj = -reach; qj <= reach; qj++) {
      for (let qi = -reach; qi <= reach; qi++) {
        const gx = baseX + qi
        const gy = baseY + qj
        const centerX = (gx + 0.5) * spacing - camX
        const centerY = (gy + 0.5) * spacing - camY
        if (centerX * centerX + centerY * centerY > limit) continue
        const forward = centerX * fX + centerY * fY
        if (forward < -margin) continue
        const lateral = centerX * rX + centerY * rY
        if (Math.abs(lateral) > (forward > 0 ? forward : 0) * lateralLimit + margin) continue

        const wx = gx & mask
        const wy = gy & mask
        const offsetX = (gx - wx) * spacing - camX
        const offsetY = (gy - wy) * spacing - camY
        const quad = wy * cells + wx

        for (let f = quad * slots, end = f + quadCount[quad]; f < end; f++) {
          const c = f * 3
          const rx = centroids[c] + offsetX
          const ry = centroids[c + 1] + offsetY
          const rz = centroids[c + 2]
          const nx = normals[c]
          const ny = normals[c + 1]
          const nz = normals[c + 2]
          if ((camZ - rz) * nz - rx * nx - ry * ny < 0) continue

          const n = counts[f]
          const v = f * 12
          for (let k = 0; k < n; k++) {
            inX[k] = vertices[v + k * 3] + offsetX
            inY[k] = vertices[v + k * 3 + 1] + offsetY
            inZ[k] = vertices[v + k * 3 + 2]
          }
          const m = projector.polygon(n)
          if (m === 0) continue

          const distance = Math.sqrt(rx * rx + ry * ry)
          const inv = distance > 1e-3 ? 1 / distance : 0
          const color = shader.shade(colors[f], nx, ny, nz, rx + camX, ry + camY, rz, distance, rx * inv, ry * inv)
          batch.polygon(distance, color, projector.outX, projector.outY, m)
        }
      }
    }
  }
}
