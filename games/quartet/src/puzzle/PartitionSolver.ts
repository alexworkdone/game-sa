export interface PartitionProblem {
  readonly groupCount: number
  readonly groupSize: number
  readonly fits: readonly (readonly number[])[]
}

export class PartitionSolver {
  countSolutions(problem: PartitionProblem, limit = 2): number {
    const capacity = new Array<number>(problem.groupCount).fill(problem.groupSize)
    const order = problem.fits
      .map((options, index) => ({ options, index }))
      .sort((a, b) => a.options.length - b.options.length)
    let found = 0

    const walk = (position: number): void => {
      if (found >= limit) return
      if (position === order.length) {
        found++
        return
      }
      const entry = order[position]
      if (!entry) return
      for (const group of entry.options) {
        if ((capacity[group] ?? 0) <= 0) continue
        capacity[group] = (capacity[group] ?? 0) - 1
        walk(position + 1)
        capacity[group] = (capacity[group] ?? 0) + 1
      }
    }

    walk(0)
    return found
  }
}
