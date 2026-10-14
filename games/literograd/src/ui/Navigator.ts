import { Signal } from '@sa/core'
import type { BuildingId } from '../content/buildings.js'
import type { ModeId } from '../content/modes.js'
import type { TabId } from '../meta/Preferences.js'

export type Route =
  | { readonly name: 'town' | 'play' | 'album' }
  | { readonly name: 'build'; readonly focus?: BuildingId }
  | { readonly name: 'game'; readonly mode: ModeId }

export const isTab = (route: Route): route is Extract<Route, { name: TabId }> => route.name !== 'game'

export class Navigator {
  readonly onChange = new Signal<Route>()

  private route: Route = { name: 'town' }

  get current(): Route {
    return this.route
  }

  go(route: Route): void {
    this.route = route
    this.onChange.emit(route)
  }
}
