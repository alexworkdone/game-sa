const STROKE: Readonly<Record<string, string>> = {
  home: '<path d="M3.5 11 12 4l8.5 7"/><path d="M5.5 9.5V20h13V9.5"/><path d="M10 20v-5h4v5"/>',
  path: '<circle cx="6" cy="18" r="2.5"/><circle cx="18" cy="6" r="2.5"/><path d="M8.5 18H15a3 3 0 0 0 0-6H9a3 3 0 0 1 0-6h6.5"/>',
  forge: '<path d="M12 3.5l1.9 5.1 5.1 1.9-5.1 1.9L12 17.5l-1.9-5.1L5 10.5l5.1-1.9z"/><path d="M18.5 15l.8 1.9 1.9.8-1.9.8-.8 1.9-.8-1.9-1.9-.8 1.9-.8z"/>',
  galaxy: '<circle cx="12" cy="12" r="5"/><path d="M16.2 5.6C19.4 4 21.6 4 22 5.2c.7 2-3.4 6.2-9.3 9.5S1.7 19.5 1.9 17.4c.1-.9 1.3-2.1 3.3-3.4"/>',
  profile: '<circle cx="12" cy="8" r="4"/><path d="M4.5 20.5c1.4-3.8 4.2-5.8 7.5-5.8s6.1 2 7.5 5.8"/>',
  back: '<path d="M15 5l-7 7 7 7"/>',
  close: '<path d="M6 6l12 12M18 6 6 18"/>',
  shuffle: '<path d="M16 4h4v4"/><path d="M4 20 20 4"/><path d="M20 16v4h-4"/><path d="M14.5 14.5 20 20"/><path d="M4 4l5 5"/>',
  bulb: '<path d="M9 17.5h6"/><path d="M10 21h4"/><path d="M12 3a6 6 0 0 0-3.8 10.6c.6.5.8 1.2.8 1.9v.5h6v-.5c0-.7.2-1.4.8-1.9A6 6 0 0 0 12 3z"/>',
  lock: '<rect x="5" y="11" width="14" height="10" rx="2.5"/><path d="M8 11V7.5a4 4 0 0 1 8 0V11"/>',
  soundOn: '<path d="M11 5 6.5 9H3.5v6h3L11 19z"/><path d="M15.5 9a4.5 4.5 0 0 1 0 6"/><path d="M18.5 6a8.5 8.5 0 0 1 0 12"/>',
  soundOff: '<path d="M11 5 6.5 9H3.5v6h3L11 19z"/><path d="m16 9.5 5 5M21 9.5l-5 5"/>',
  vibrate: '<rect x="7.5" y="3" width="9" height="18" rx="2.5"/><path d="M3.5 9v6M20.5 9v6"/>',
  calendar: '<rect x="3.5" y="5" width="17" height="15.5" rx="3"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
  flame: '<path d="M12 21.5c3.9 0 6.8-2.6 6.8-6.4 0-3-1.8-5.3-3.4-7-.4 1.5-1.2 2.5-2.3 3.1.3-3.2-1.2-6.2-3.8-8.7-.2 3.5-1.9 5.5-3.2 7.3-1 1.3-1.7 2.8-1.7 4.8 0 3.9 3.2 6.9 7.6 6.9z"/>',
  check: '<path d="M5 12.5 9.5 17 19 7.5"/>',
  gift: '<rect x="3.5" y="8" width="17" height="4.5" rx="1.2"/><path d="M5.5 12.5V20h13v-7.5"/><path d="M12 8v12"/><path d="M12 8c-1.6-3.6-5.5-4-5.5-1.6C6.5 8 9.3 8 12 8zM12 8c1.6-3.6 5.5-4 5.5-1.6C17.5 8 14.7 8 12 8z"/>',
  shield: '<path d="M12 3 19 6v5.2c0 4.6-3 8.3-7 9.8-4-1.5-7-5.2-7-9.8V6z"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M9.6 9.4a2.5 2.5 0 1 1 3.4 2.4c-.6.2-1 .8-1 1.5v.6"/><path d="M12 16.8h.01"/>',
  video: '<rect x="3" y="6" width="13" height="12" rx="2.5"/><path d="m16 10.5 5-3v9l-5-3z"/>',
  palette: '<path d="M12 3a9 9 0 1 0 0 18c1.4 0 2-1 2-2s-.9-1.4-.9-2.4.8-1.6 1.9-1.6h2a4 4 0 0 0 4-4c0-4.4-4-8-9-8z"/><circle cx="7.5" cy="11.5" r="1.2"/><circle cx="10.5" cy="7.5" r="1.2"/><circle cx="15.5" cy="8.5" r="1.2"/>',
  retry: '<path d="M19.5 11.5a7.5 7.5 0 1 1-2.2-5.3"/><path d="M19.5 4.5v5h-5"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
  book: '<path d="M4.5 5.5A2.5 2.5 0 0 1 7 3h12.5v15.5H7a2.5 2.5 0 0 0-2.5 2.5z"/><path d="M4.5 21V5.5"/>',
  sparkle: '<path d="M12 4v4M12 16v4M4 12h4M16 12h4M6.5 6.5l2.2 2.2M15.3 15.3l2.2 2.2M17.5 6.5l-2.2 2.2M8.7 15.3l-2.2 2.2"/>',
}

const FILLED: Readonly<Record<string, string>> = {
  star: '<path d="M12 2.8l2.8 5.8 6.4.9-4.6 4.5 1.1 6.3L12 17.3l-5.7 3 1.1-6.3-4.6-4.5 6.4-.9z"/>',
  play: '<path d="M8 4.8v14.4a1 1 0 0 0 1.5.9l11.2-7.2a1 1 0 0 0 0-1.8L9.5 3.9A1 1 0 0 0 8 4.8z"/>',
  heart: '<path d="M12 20.5s-8.5-4.9-8.5-11A4.8 4.8 0 0 1 12 6.6a4.8 4.8 0 0 1 8.5 2.9c0 6.1-8.5 11-8.5 11z"/>',
}

export type IconName = keyof typeof STROKE | keyof typeof FILLED

export const icon = (name: IconName, className = 'icon'): string => {
  const filled = FILLED[name]
  if (filled) {
    return `<svg class="${className}" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">${filled}</svg>`
  }
  return `<svg class="${className}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${STROKE[name] ?? ''}</svg>`
}
