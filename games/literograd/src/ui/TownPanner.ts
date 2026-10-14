const DRAG_THRESHOLD = 5
const HINT_HIDE_AFTER = 8

interface DragState {
  readonly pointer: number
  readonly startX: number
  readonly startLeft: number
  moved: boolean
}

export class TownPanner {
  private scroller: HTMLElement | null = null
  private hint: HTMLElement | null = null
  private drag: DragState | null = null
  private suppressClick = false
  private left = 0
  private hintDismissed = false

  attach(scroller: HTMLElement, hint: HTMLElement): void {
    this.scroller = scroller
    this.hint = hint
    hint.classList.toggle('pan-hint--gone', this.hintDismissed)
    scroller.addEventListener('pointerdown', this.onDown)
    scroller.addEventListener('pointermove', this.onMove)
    scroller.addEventListener('pointerup', this.onUp)
    scroller.addEventListener('pointercancel', this.onUp)
    scroller.addEventListener('click', this.onClickCapture, true)
    scroller.addEventListener('scroll', this.onScroll, { passive: true })
  }

  restore(): void {
    if (this.scroller) this.scroller.scrollLeft = this.left
  }

  scrollToViewBoxX(x: number, smooth: boolean): void {
    const scroller = this.scroller
    if (!scroller) return
    const target = (x * scroller.scrollWidth) / 800 - scroller.clientWidth / 2
    scroller.scrollTo({ left: Math.max(0, target), behavior: smooth ? 'smooth' : 'auto' })
  }

  reset(): void {
    this.left = 0
    this.restore()
  }

  private readonly onDown = (event: PointerEvent): void => {
    if (event.pointerType !== 'mouse' || event.button !== 0 || !this.scroller) return
    this.drag = { pointer: event.pointerId, startX: event.clientX, startLeft: this.scroller.scrollLeft, moved: false }
  }

  private readonly onMove = (event: PointerEvent): void => {
    const drag = this.drag
    const scroller = this.scroller
    if (!drag || !scroller || event.pointerId !== drag.pointer) return
    const dx = event.clientX - drag.startX
    if (!drag.moved && Math.abs(dx) > DRAG_THRESHOLD) {
      drag.moved = true
      scroller.classList.add('town__scroll--dragging')
      try {
        scroller.setPointerCapture(drag.pointer)
      } catch {
        drag.moved = true
      }
    }
    if (drag.moved) scroller.scrollLeft = drag.startLeft - dx
  }

  private readonly onUp = (): void => {
    if (!this.drag) return
    this.suppressClick = this.drag.moved
    this.drag = null
    this.scroller?.classList.remove('town__scroll--dragging')
  }

  private readonly onClickCapture = (event: MouseEvent): void => {
    if (!this.suppressClick) return
    this.suppressClick = false
    event.stopPropagation()
    event.preventDefault()
  }

  private readonly onScroll = (): void => {
    if (!this.scroller) return
    this.left = this.scroller.scrollLeft
    if (this.left > HINT_HIDE_AFTER && !this.hintDismissed) {
      this.hintDismissed = true
      this.hint?.classList.add('pan-hint--gone')
    }
  }
}
