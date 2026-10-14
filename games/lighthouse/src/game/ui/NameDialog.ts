import { PALETTE } from '../config/palette.js'

const FONT = 'system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'

const css = (element: HTMLElement, style: Partial<CSSStyleDeclaration>): void => {
  Object.assign(element.style, style)
}

const button = (label: string, primary: boolean): HTMLButtonElement => {
  const element = document.createElement('button')
  element.type = 'button'
  element.textContent = label
  css(element, {
    flex: '1',
    height: '46px',
    borderRadius: '12px',
    border: primary ? 'none' : `2px solid ${PALETTE.surfaceActive}`,
    background: primary ? PALETTE.accent : 'transparent',
    color: primary ? PALETTE.night : PALETTE.ink,
    font: `700 17px ${FONT}`,
    cursor: 'pointer',
  })
  return element
}

export class NameDialog {
  private root: HTMLElement | null = null

  get open(): boolean {
    return this.root !== null
  }

  ask(title: string, initial: string, maxLength: number): Promise<string | null> {
    this.close()
    return new Promise((resolve) => {
      const root = document.createElement('div')
      css(root, {
        position: 'fixed',
        inset: '0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        background: 'rgba(7, 11, 22, 0.78)',
        zIndex: '10',
      })
      const panel = document.createElement('form')
      css(panel, {
        width: 'min(420px, 100%)',
        padding: '24px',
        borderRadius: '18px',
        background: PALETTE.surface,
        border: `2px solid ${PALETTE.accent}`,
        boxShadow: `0 0 18px ${PALETTE.accent}55`,
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        font: `600 15px ${FONT}`,
        color: PALETTE.ink,
      })
      const heading = document.createElement('div')
      heading.textContent = title
      css(heading, { font: `900 24px ${FONT}`, textAlign: 'center' })
      const input = document.createElement('input')
      input.type = 'text'
      input.value = initial
      input.maxLength = maxLength
      input.autocomplete = 'off'
      input.spellcheck = false
      css(input, {
        height: '48px',
        padding: '0 14px',
        borderRadius: '12px',
        border: `2px solid ${PALETTE.surfaceActive}`,
        background: PALETTE.night,
        color: PALETTE.ink,
        font: `700 18px ${FONT}`,
        outline: 'none',
      })
      const actions = document.createElement('div')
      css(actions, { display: 'flex', gap: '10px' })
      const cancel = button('Скасувати', false)
      const ok = button('Зберегти', true)
      ok.type = 'submit'
      actions.append(cancel, ok)
      panel.append(heading, input, actions)
      root.append(panel)

      const finish = (value: string | null): void => {
        this.close()
        resolve(value)
      }
      root.addEventListener('keydown', (event) => {
        event.stopPropagation()
        if (event.key === 'Escape') finish(null)
      })
      root.addEventListener('keyup', (event) => event.stopPropagation())
      root.addEventListener('pointerdown', (event) => {
        if (event.target === root) finish(null)
      })
      panel.addEventListener('submit', (event) => {
        event.preventDefault()
        finish(input.value)
      })
      cancel.addEventListener('click', () => finish(null))

      document.body.append(root)
      this.root = root
      input.focus()
      input.select()
    })
  }

  close(): void {
    this.root?.remove()
    this.root = null
  }
}
