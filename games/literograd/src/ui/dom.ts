export type Child = Node | string | number | null | undefined | false | readonly Child[]

type Handler = (event: Event) => void

export interface Props {
  readonly class?: string | undefined
  readonly style?: string | undefined
  readonly html?: string | undefined
  readonly on?: Readonly<Record<string, Handler>> | undefined
  readonly [attribute: string]: unknown
}

const appendChild = (parent: Node, child: Child): void => {
  if (child === null || child === undefined || child === false) return
  if (Array.isArray(child)) {
    for (const nested of child as readonly Child[]) appendChild(parent, nested)
    return
  }
  parent.appendChild(child instanceof Node ? child : document.createTextNode(String(child)))
}

export const append = (parent: Node, ...children: Child[]): void => {
  for (const child of children) appendChild(parent, child)
}

export const h = <K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props: Props | null = null,
  ...children: Child[]
): HTMLElementTagNameMap[K] => {
  const element = document.createElement(tag)
  if (props) {
    for (const [key, value] of Object.entries(props)) {
      if (value === undefined || value === null || value === false) continue
      if (key === 'on') {
        for (const [event, handler] of Object.entries(value as Record<string, Handler>)) {
          element.addEventListener(event, handler)
        }
      } else if (key === 'html') {
        element.innerHTML = String(value)
      } else if (key === 'class') {
        element.className = String(value)
      } else if (value === true) {
        element.setAttribute(key, '')
      } else {
        element.setAttribute(key, String(value))
      }
    }
  }
  append(element, ...children)
  return element
}

export const clear = (element: Element): void => {
  while (element.firstChild) element.removeChild(element.firstChild)
}

export const cx = (...names: (string | false | null | undefined)[]): string => names.filter(Boolean).join(' ')

export const wait = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms))

export const prefersReducedMotion = (): boolean =>
  typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches

export const formatNumber = (value: number): string => Math.round(value).toLocaleString('uk-UA')

export const formatDecimal = (value: number): string => String(Math.round(value * 10) / 10).replace('.', ',')

export const formatClock = (ms: number): string => {
  const seconds = Math.ceil(ms / 1000)
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`
}

export const restartAnimation = (element: Element, className: string): void => {
  element.classList.remove(className)
  void (element as HTMLElement).offsetWidth
  element.classList.add(className)
}
