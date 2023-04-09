export default function Scope(
  opts: {
    default?: boolean
  } = {}
): any {
  return function (target: any, key: string, _: any) {
    const branch = opts.default ? 'default' : 'named'
    Object.assign(target.scopes[branch], [
      ...target.scopes[branch],
      {
        className: target.name,
        method: key,
        default: opts.default || false,
      },
    ])
  }
}

export interface ScopeStatement {
  className: string
  method: string
  default: boolean
}
