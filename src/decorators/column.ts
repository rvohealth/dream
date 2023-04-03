import Dream from '../dream'

export function Column(dataType: string): any {
  // return function (target: Dream, key: any, _: any) {
  //   const t = target.constructor as typeof Dream
  //   const currentSchema = { ...t.schema }
  //   Object.defineProperty(t, 'schema', {
  //     get: () => {
  //       return {
  //         ...currentSchema,
  //         [key]: dataType,
  //       }
  //     },
  //   })
  // }
}
