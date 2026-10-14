const SVG_NS = 'http://www.w3.org/2000/svg'

const assign = (element, attributes) => {
  for (const [key, value] of Object.entries(attributes)) {
    if (value === undefined || value === null || value === false) continue
    element.setAttribute(key, value === true ? '' : String(value))
  }
  return element
}

const append = (element, children) => {
  for (const child of [children].flat()) {
    if (child === undefined || child === null || child === false) continue
    element.append(typeof child === 'string' ? document.createTextNode(child) : child)
  }
  return element
}

export const svg = (tag, attributes = {}, children = []) =>
  append(assign(document.createElementNS(SVG_NS, tag), attributes), children)

export const html = (tag, attributes = {}, children = []) =>
  append(assign(document.createElement(tag), attributes), children)
