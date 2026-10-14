export type Rects = Map<string, DOMRect>

export const measure = (elements: Iterable<HTMLElement>, key: (element: HTMLElement) => string): Rects => {
  const rects: Rects = new Map()
  for (const element of elements) rects.set(key(element), element.getBoundingClientRect())
  return rects
}

export const play = (
  elements: Iterable<HTMLElement>,
  key: (element: HTMLElement) => string,
  before: Rects,
  duration = 380,
): void => {
  for (const element of elements) {
    const previous = before.get(key(element))
    if (!previous) continue
    const now = element.getBoundingClientRect()
    const dx = previous.left - now.left
    const dy = previous.top - now.top
    if (Math.abs(dx) < 1 && Math.abs(dy) < 1) continue
    element.animate(
      [{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'translate(0, 0)' }],
      { duration, easing: 'cubic-bezier(.2,.8,.2,1)' },
    )
  }
}
