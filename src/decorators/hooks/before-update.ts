export default function BeforeUpdate(): any {
  return function (target: any, key: string, _: any) {
    Object.defineProperty(target.constructor.hooks, 'beforeUpdate', {
      value: [
        ...(target.constructor.hooks.beforeUpdate as BeforeUpdateStatement[]),
        {
          method: key,
        },
      ],
    })
  }
}

export interface BeforeUpdateStatement {
  method: string
}
