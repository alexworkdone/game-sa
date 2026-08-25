export interface IDisposable {
  dispose(): void
}

export interface IUpdatable {
  update(dt: number): void
}

export type Listener<T> = (payload: T) => void

export type Unsubscribe = () => void

export interface IReadonlySignal<T> {
  on(listener: Listener<T>): Unsubscribe
  once(listener: Listener<T>): Unsubscribe
  off(listener: Listener<T>): void
}

export class Signal<T = void> implements IReadonlySignal<T>, IDisposable {
  private readonly listeners = new Set<Listener<T>>()
  private readonly onceListeners = new Set<Listener<T>>()

  on(listener: Listener<T>): Unsubscribe {
    this.listeners.add(listener)
    return () => this.off(listener)
  }

  once(listener: Listener<T>): Unsubscribe {
    this.listeners.add(listener)
    this.onceListeners.add(listener)
    return () => this.off(listener)
  }

  off(listener: Listener<T>): void {
    this.listeners.delete(listener)
    this.onceListeners.delete(listener)
  }

  emit(payload: T): void {
    for (const listener of [...this.listeners]) {
      if (this.onceListeners.has(listener)) this.off(listener)
      listener(payload)
    }
  }

  get size(): number {
    return this.listeners.size
  }

  dispose(): void {
    this.listeners.clear()
    this.onceListeners.clear()
  }
}
