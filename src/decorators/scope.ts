import Dream from '../dream'

export default function Scope(opts: ScopeOpts = {}): any {
  return function (target: any, key: string, _: any) {
    // target is already a typeof Dream here, because scopes
    // can only be set on static methods
    const t: typeof Dream = target

    const branch = opts.default ? 'default' : 'named'
    if (!Object.getOwnPropertyDescriptor(t, 'scopes'))
      t['scopes'] = {
        default: [...(t.scopes?.default || [])] as ScopeStatement[],
        named: [...(t.scopes?.named || [])] as ScopeStatement[],
      }

    const alreadyApplied = t.scopes[branch].find(scope => scope.method === key)

    if (!alreadyApplied) {
      t.scopes[branch].push({
        method: key,
        default: opts.default || false,
        context: opts.context || null,
      })
    }
  }
}

export type ScopeContext = string

export interface ScopeOpts {
  default?: boolean
  context?: ScopeContext
}

export interface ScopeStatement {
  method: string
  default: boolean
  context: ScopeContext | null
}
