const finalize = (solid) => {
  const vertices = solid.vertices
  const points = vertices.length / 3
  let cx = 0
  let cy = 0
  let cz = 0
  for (let i = 0; i < points; i++) {
    cx += vertices[i * 3] / points
    cy += vertices[i * 3 + 1] / points
    cz += vertices[i * 3 + 2] / points
  }
  for (const face of solid.faces) {
    let nx = 0
    let ny = 0
    let nz = 0
    let fx = 0
    let fy = 0
    let fz = 0
    const n = face.indices.length
    for (let k = 0; k < n; k++) {
      const a = face.indices[k] * 3
      const b = face.indices[(k + 1) % n] * 3
      nx += (vertices[a + 1] - vertices[b + 1]) * (vertices[a + 2] + vertices[b + 2])
      ny += (vertices[a + 2] - vertices[b + 2]) * (vertices[a] + vertices[b])
      nz += (vertices[a] - vertices[b]) * (vertices[a + 1] + vertices[b + 1])
      fx += vertices[a] / n
      fy += vertices[a + 1] / n
      fz += vertices[a + 2] / n
    }
    const length = Math.hypot(nx, ny, nz) || 1
    const outward = nx * (fx - cx) + ny * (fy - cy) + nz * (fz - cz) < 0 ? -1 : 1
    face.nx = (nx / length) * outward
    face.ny = (ny / length) * outward
    face.nz = (nz / length) * outward
    face.cx = fx
    face.cy = fy
    face.cz = fz
  }
  solid.vertices = Float32Array.from(vertices)
  return solid
}

const ring = (cx, cy, radius, z, sides, rotation) =>
  Array.from({ length: sides }, (_, k) => {
    const angle = rotation + (k / sides) * Math.PI * 2
    return [cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius, z]
  })

export const box = (x0, y0, x1, y1, z0, z1, color, detail = false) =>
  finalize({
    detail,
    vertices: [x0, y0, z0, x1, y0, z0, x1, y1, z0, x0, y1, z0, x0, y0, z1, x1, y0, z1, x1, y1, z1, x0, y1, z1],
    faces: [
      [4, 5, 6, 7],
      [0, 1, 5, 4],
      [1, 2, 6, 5],
      [2, 3, 7, 6],
      [3, 0, 4, 7],
    ].map((indices) => ({ indices, color })),
  })

export const prism = (cx, cy, radius, z0, z1, sides, color, rotation = 0) => {
  const vertices = [...ring(cx, cy, radius, z0, sides, rotation), ...ring(cx, cy, radius, z1, sides, rotation)].flat()
  const faces = Array.from({ length: sides }, (_, k) => ({
    indices: [k, (k + 1) % sides, sides + ((k + 1) % sides), sides + k],
    color,
  }))
  faces.push({ indices: Array.from({ length: sides }, (_, k) => sides + k), color })
  return finalize({ detail: false, vertices, faces })
}

export const pyramid = (cx, cy, radius, z0, height, sides, color, rotation = 0) => {
  const vertices = [...ring(cx, cy, radius, z0, sides, rotation), [cx, cy, z0 + height]].flat()
  const faces = Array.from({ length: sides }, (_, k) => ({ indices: [k, (k + 1) % sides, sides], color }))
  return finalize({ detail: false, vertices, faces })
}

export const panel = (points, color) => {
  const solid = finalize({
    detail: true,
    vertices: points.flat(),
    faces: [{ indices: points.map((_, k) => k), color }],
  })
  solid.faces[0].doubleSided = true
  return solid
}
