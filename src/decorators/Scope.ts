import Dream from '../Dream'
import { DecoratorContext } from './DecoratorContextType'

export default function Scope(
  opts: {
    default?: boolean
  } = {}
): any {
  return function (_: any, context: DecoratorContext & { static: true }) {
    const key = context.name

    context.addInitializer(function (this: typeof Dream) {
      // this is already a typeof Dream here, because scopes
      // can only be set on static methods
      const t: typeof Dream = this

      scopeImplementation(t, key, opts)
    })
  }
}

export function scopeImplementation(t: typeof Dream, key: string, opts: { default?: boolean } = {}) {
  const branch = opts.default ? 'default' : 'named'
  if (!Object.getOwnPropertyDescriptor(t, 'scopes'))
    t['scopes'] = {
      default: [...(t['scopes']?.default || [])] as ScopeStatement[],
      named: [...(t['scopes']?.named || [])] as ScopeStatement[],
    }

  const alreadyApplied = !!t['scopes'][branch].find(scope => scope.method === key)

  if (!alreadyApplied) {
    t['scopes'][branch].push({
      method: key,
      default: opts.default || false,
    })
  }
}

export interface ScopeStatement {
  method: string
  default: boolean
}
