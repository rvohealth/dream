export default function Scope(
  opts: {
    default?: boolean
  } = {}
): any {
  return function (target: any, key: string, _: any) {
    const branch = opts.default ? 'default' : 'named'
    if (!Object.getOwnPropertyDescriptor(target, 'scopes'))
      target['scopes'] = {
        default: [] as ScopeStatement[],
        named: [] as ScopeStatement[],
      }

    target.scopes[branch].push({
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
