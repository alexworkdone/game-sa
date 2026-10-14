export interface IFrameScheduler {
  now(): number
  request(callback: (now: number) => void): number
  cancel(handle: number): void
}

export class RafScheduler implements IFrameScheduler {
  now(): number {
    return performance.now()
  }

  request(callback: (now: number) => void): number {
    return requestAnimationFrame(callback)
  }

  cancel(handle: number): void {
    cancelAnimationFrame(handle)
  }
}
