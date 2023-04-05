export default function Scope(
  opts: {
    default?: boolean
  } = {}
): any {
  return function (target: any, key: string, _: any) {
    const branch = opts.default ? 'default' : 'named'
    Object.defineProperty(target.scopes, branch, {
      value: [
        ...target.scopes[branch],
        {
          method: key,
          default: opts.default || false,
        },
      ],
    })
  }
}

export interface ScopeStatement {
  method: string
  default: boolean
}
