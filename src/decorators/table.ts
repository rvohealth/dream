import Dream from '../dream'
import { Tables } from '../db/reflections'

export function Table(table: Tables): ClassDecorator {
  return function (target: any) {
    const t = target as typeof Dream

    // add 'modelName' method, because calling constructor.name
    // to get the class name will sometimes reflect the parent class
    // in production.
    Object.defineProperty(t, 'tableName', {
      get: function () {
        return table
      },
    })
  }
}
