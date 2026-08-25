export class PlasmaCollector {
  energy = 0
  charges = 0

  add(amount: number): void {
    this.energy += amount
    this.charges += 1
  }

  reset(): void {
    this.energy = 0
    this.charges = 0
  }
}
