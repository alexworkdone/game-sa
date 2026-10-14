import { Signal } from '@sa/core'

export type TabId = 'home' | 'levels' | 'forge' | 'galaxy' | 'profile'

export type Route =
  | { readonly name: TabId }
  | { readonly name: 'game'; readonly mode: 'level'; readonly level: number }
  | { readonly name: 'game'; readonly mode: 'daily' }

export const TAB_ORDER: readonly TabId[] = ['levels', 'forge', 'home', 'galaxy', 'profile']

export class Navigator {
  readonly onChange = new Signal<Route>()

  private route: Route = { name: 'home' }

  get current(): Route {
    return this.route
  }

  go(route: Route): void {
    this.route = route
    this.onChange.emit(route)
  }
}
