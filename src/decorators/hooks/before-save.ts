export default function BeforeSave(): any {
  return function (target: any, key: string, _: any) {
    Object.defineProperty(target.constructor.hooks, 'beforeSave', {
      value: [
        ...(target.constructor.hooks.beforeSave as BeforeSaveStatement[]),
        {
          method: key,
        },
      ],
    })
  }
}

export interface BeforeSaveStatement {
  method: string
}
