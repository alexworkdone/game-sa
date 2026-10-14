import type { Feature } from '../../content/buildings.js'
import { MODES } from '../../content/modes.js'
import type { ModeId, ModeInfo } from '../../content/modes.js'
import { toLower } from '../../content/alphabets.js'
import { UK } from '../../i18n/uk.js'
import type { PreferencesState } from '../../meta/Preferences.js'
import { describeVariant } from '../../round/Variant.js'
import { button, chip, iconEl, nowrap } from '../components.js'
import { append, cx, formatDecimal, formatNumber, h } from '../dom.js'
import { Screen } from '../Screen.js'
import type { UiKit } from '../UiKit.js'

interface Glyphs {
  readonly letters: readonly string[]
  readonly marks: readonly number[]
}

export class PlayScreen extends Screen<void> {
  constructor(kit: UiKit) {
    super(kit, 'screen--play')
  }

  protected render(): void {
    const { perks } = this.kit.services
    const perkItems = UK.play.perks(perks.roundSeconds, formatDecimal(perks.comboCap), perks.hints, Math.round(perks.bookBonus * 100))
    append(
      this.element,
      h(
        'div',
        { class: 'screen__head' },
        h('h2', null, UK.play.title),
        h('p', null, perkItems.flatMap((item, index) => (index === 0 ? [nowrap(item)] : [' · ', nowrap(item)]))),
      ),
      h('p', { class: 'screen__note' }, UK.play.rules),
      this.prefsBlock(),
      h('div', { class: 'modes' }, MODES.map((mode) => this.modeCard(mode))),
    )
  }

  protected override bind(): void {
    const { prefs, city, records } = this.kit.services
    this.listen(prefs.onChange, () => this.refresh())
    this.listen(city.onChange, () => this.refresh())
    this.listen(records.onChange, () => this.refresh())
  }

  private get prefs(): PreferencesState {
    return this.kit.services.prefs.values
  }

  private lockFor(feature: Feature): string | null {
    const { perks } = this.kit.services
    return perks.has(feature) ? null : UK.play.unlocksAt(perks.requirementLabel(feature))
  }

  private option(label: string, pressed: boolean, patch: Partial<PreferencesState>, feature?: Feature): HTMLButtonElement {
    return chip(label, () => this.kit.services.prefs.update(patch), {
      pressed,
      locked: feature ? this.lockFor(feature) : null,
      onLocked: () => {
        if (feature) this.kit.toast.show(UK.play.needFirst(this.kit.services.perks.requirementLabel(feature)))
      },
    })
  }

  private prefsBlock(): HTMLElement {
    const prefs = this.prefs
    const uk = prefs.alphabet === 'uk'
    return h(
      'div',
      { class: 'prefs' },
      h(
        'div',
        { class: 'prefs__row' },
        h('span', { class: 'prefs__label' }, UK.play.alphabet),
        h(
          'div',
          { class: 'chips' },
          this.option(UK.play.ukrainian, uk, { alphabet: 'uk' }),
          this.option(UK.play.latin, !uk, { alphabet: 'en' }, 'latin'),
        ),
      ),
      h(
        'div',
        { class: 'prefs__row' },
        h('span', { class: 'prefs__label' }, UK.play.letters),
        h(
          'div',
          { class: 'chips' },
          this.option(UK.play.upper(uk), !prefs.lowercase, { lowercase: false }),
          this.option(UK.play.lower(uk), prefs.lowercase, { lowercase: true }, 'lowercase'),
        ),
      ),
    )
  }

  private glyphs(mode: ModeId): Glyphs {
    const prefs = this.prefs
    const uk = prefs.alphabet === 'uk'
    const cased = (letters: readonly string[]): string[] => (prefs.lowercase ? letters.map(toLower) : [...letters])
    if (mode === 'find') return { letters: cased(uk ? ['Ш', 'Щ', 'Ш', 'Ц'] : ['O', 'Q', 'O', 'C']), marks: [0, 2] }
    if (mode === 'odd') return { letters: cased(uk ? ['О', 'О', 'С', 'О'] : ['O', 'O', 'Q', 'O']), marks: [2] }
    if (mode === 'abc') {
      const reverse = prefs.direction === 'reverse'
      const letters = reverse ? (uk ? ['Я', 'Ю', 'Ь', 'Щ'] : ['Z', 'Y', 'X', 'W']) : uk ? ['А', 'Б', 'В', 'Г'] : ['A', 'B', 'C', 'D']
      return { letters: cased(letters), marks: [0] }
    }
    if (prefs.numbers === 'two') return { letters: ['2', '4', '6', '8'], marks: [0] }
    if (prefs.numbers === 'down') return { letters: ['30', '29', '28', '27'], marks: [0] }
    return { letters: ['1', '2', '3', '4'], marks: [0] }
  }

  private modeChips(mode: ModeId, locked: boolean): HTMLElement | null {
    const prefs = this.prefs
    const uk = prefs.alphabet === 'uk'
    if (mode === 'abc') {
      return h(
        'div',
        { class: 'chips' },
        this.option(UK.play.forward(uk), prefs.direction === 'forward', { direction: 'forward' }),
        this.option(UK.play.reverse(uk), prefs.direction === 'reverse', { direction: 'reverse' }, 'reverse'),
      )
    }
    if (mode === 'num' && !locked) {
      return h(
        'div',
        { class: 'chips' },
        this.option(UK.play.numbersOne, prefs.numbers === 'one', { numbers: 'one' }),
        this.option(UK.play.numbersTwo, prefs.numbers === 'two', { numbers: 'two' }, 'byTwo'),
        this.option(UK.play.numbersDown, prefs.numbers === 'down', { numbers: 'down' }, 'countdown'),
      )
    }
    return null
  }

  private modeCard(mode: ModeInfo): HTMLElement {
    const { perks, records } = this.kit.services
    const locked = mode.id === 'num' && !perks.has('numbers')
    const variant = describeVariant(mode.id, this.prefs)
    const best = records.best(variant.key)
    const glyphs = this.glyphs(mode.id)
    const foot = locked
      ? [
          h('p', { class: 'lock-note' }, iconEl('lock'), UK.play.lockedNumbers),
          button(UK.play.toCountHouse, () => this.kit.nav.go({ name: 'build', focus: 'count' }), 'line', { small: true }),
        ]
      : [
          h(
            'div',
            { class: 'mode__meta' },
            best > 0 ? h('span', null, `${UK.play.best} `, h('b', null, formatNumber(best))) : h('span', null, UK.play.noBest),
            variant.multiplier > 1 ? h('span', { class: 'mode__bonus' }, UK.play.multiplier(formatDecimal(variant.multiplier))) : null,
          ),
          button(UK.play.start, () => this.kit.nav.go({ name: 'game', mode: mode.id })),
        ]
    return h(
      'article',
      { class: cx('mode', locked && 'mode--locked') },
      h(
        'div',
        { class: 'mode__top' },
        h('h3', null, mode.name),
        h(
          'div',
          { class: 'mode__glyphs', 'aria-hidden': 'true' },
          glyphs.letters.map((letter, index) => h('span', { class: cx(glyphs.marks.includes(index) && 'mark') }, letter)),
        ),
      ),
      h('p', null, mode.text),
      this.modeChips(mode.id, locked),
      h('div', { class: 'mode__foot' }, foot),
    )
  }
}
