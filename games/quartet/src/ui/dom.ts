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

export const fragment = (markup: string): DocumentFragment => {
  const template = document.createElement('template')
  template.innerHTML = markup
  return template.content
}

export const clear = (element: Element): void => {
  while (element.firstChild) element.removeChild(element.firstChild)
}

export const cx = (...names: (string | false | null | undefined)[]): string =>
  names.filter(Boolean).join(' ')

export const nextFrame = (): Promise<void> =>
  new Promise((resolve) => requestAnimationFrame(() => resolve()))

export const wait = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms))

export const prefersReducedMotion = (): boolean =>
  typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches

export const formatNumber = (value: number): string => value.toLocaleString('uk-UA')

export const formatDuration = (ms: number): string => {
  const total = Math.max(0, Math.floor(ms / 1000))
  const hours = Math.floor(total / 3600)
  const minutes = Math.floor((total % 3600) / 60)
  const seconds = total % 60
  const pad = (value: number): string => `${value}`.padStart(2, '0')
  return hours > 0 ? `${hours}:${pad(minutes)}:${pad(seconds)}` : `${pad(minutes)}:${pad(seconds)}`
}
