const ICONS = {
  drop: '<svg class="icon icon--drop" viewBox="0 0 16 20" aria-hidden="true"><path d="M8 1.5C8 1.5 1.5 9.6 1.5 13.3a6.5 6.5 0 0 0 13 0C14.5 9.6 8 1.5 8 1.5Z"/></svg>',
  lock: '<svg class="icon icon--lock" viewBox="0 0 12 14" aria-hidden="true"><path d="M3.5 6V4.3a2.5 2.5 0 0 1 5 0V6" fill="none" stroke="currentColor" stroke-width="1.6"/><rect x="1.5" y="6" width="9" height="7" rx="1.6" fill="currentColor"/></svg>',
  close: '<svg class="icon icon--line" viewBox="0 0 14 14" aria-hidden="true"><path d="M3 3l8 8M11 3l-8 8"/></svg>',
  town: '<svg class="icon icon--line" viewBox="0 0 24 24" aria-hidden="true"><path d="M2 20.5h20M4 20.5v-9l5-4 5 4v9M14 20.5v-6l3.5-3 3.5 3v6M7.5 20.5v-4h3v4"/></svg>',
  play: '<svg class="icon icon--line" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="8" height="8" rx="2"/><rect x="13" y="3" width="8" height="8" rx="2"/><rect x="3" y="13" width="8" height="8" rx="2"/><rect x="13" y="13" width="8" height="8" rx="2" fill="currentColor"/></svg>',
  pen: '<svg class="icon icon--line" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21.5L6.5 11 9.5 2.5h5l3 8.5z"/><path d="M12 21.5v-8.5"/><circle cx="12" cy="11" r="1.6"/></svg>',
  book: '<svg class="icon icon--line" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 6.5C10.5 5 8 4.5 3.5 4.5v14c4.5 0 7 .5 8.5 2 1.5-1.5 4-2 8.5-2v-14c-4.5 0-7 .5-8.5 2zM12 6.5v14"/></svg>',
  ring: '<svg class="icon icon--ring" viewBox="0 0 100 100" aria-hidden="true"><path d="M58 9C80 11 94 29 92 52C90 76 70 93 47 92C23 91 7 72 8 49C9 26 27 9 50 8C55 8 60 9 64 11"/></svg>',
} as const

export type IconName = keyof typeof ICONS

export const icon = (name: IconName): string => ICONS[name]
