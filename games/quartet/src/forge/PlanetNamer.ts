import type { IRandom } from '@sa/core'

const HEADS = ['Ве', 'Ка', 'Лу', 'Ор', 'Та', 'Зе', 'Мі', 'Ар', 'Ні', 'Со', 'Ел', 'Ді', 'Ри', 'Ю', 'Фе', 'Ґа', 'Ір', 'Не', 'Ки', 'Ха', 'Ас', 'Ол']
const MIDDLES = ['ра', 'лі', 'мо', 'ре', 'на', 'ві', 'ло', 'та', 'ри', 'зо', 'ме', 'са', 'ти', 'ля', 'ке', 'до']
const TAILS = ['ра', 'ія', 'он', 'ус', 'ея', 'ан', 'іс', 'ар', 'ель', 'от', 'ина', 'ада', 'ікс']
const SUFFIXES = ['', '', '', ' Прайм', ' II', ' IV', ' VII', '-7', '-9b', ' Альфа', ' Бета', '-12']

export interface IPlanetNamer {
  name(random: IRandom): string
}

export class PlanetNamer implements IPlanetNamer {
  name(random: IRandom): string {
    const middle = random.bool(0.55) ? random.pick(MIDDLES) : ''
    const base = `${random.pick(HEADS)}${middle}${random.pick(TAILS)}`
    return `${base}${random.pick(SUFFIXES)}`
  }
}
