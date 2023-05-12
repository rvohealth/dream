import Dream from '../dream'

export default function Scope(
  opts: {
    default?: boolean
  } = {}
): any {
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

    t.scopes[branch].push({
      className: target.name,
      method: key,
      default: opts.default || false,
    })
  }
}

export interface ScopeStatement {
  className: string
  method: string
  default: boolean
}
