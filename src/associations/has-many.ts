import pluralize = require('pluralize')
import dream from '../dream'
import { DB } from '../sync/schema'

export default function HasMany<TableName extends keyof DB & string>(
  tableName: TableName,
  modelCB: () => ReturnType<typeof dream<TableName, any>>,
  {
    through,
    throughKey,
  }: {
    through?: () => ReturnType<typeof dream<any, any>>
    throughKey?: string
  } = {}
): any {
  return function (target: any, key: string, _: any) {
    if ((through && !throughKey) || (throughKey && !through))
      throw `
      Must pass both 'through' and 'throughKey' to through associations
    `
    // TODO: add better validation on through associations
    // TODO: add type guards to through associations if possible

    Object.defineProperty(target.constructor.associations, 'hasMany', {
      value: [
        ...(target.constructor.associations.hasMany as HasManyStatement<any>[]),
        {
          modelCB,
          to: tableName,
          // TODO: abstract foreign key capture to helper, with optional override provided by the api
          foreignKey: () =>
            through
              ? pluralize.singular(through().table) + '_id'
              : pluralize.singular(target.constructor.table) + '_id',
          as: key,
          through,
          throughKey,
        } as HasManyStatement<any>,
      ] as HasManyStatement<any>[],
    })
  }
}

export interface HasManyStatement<ForeignTablename extends keyof DB & string> {
  modelCB: () => ReturnType<typeof dream<ForeignTablename, any>>
  to: keyof DB & string
  foreignKey: () => keyof DB[ForeignTablename] & string
  as: string
  through?: () => ReturnType<typeof dream<ForeignTablename, any>>
  throughKey?: string
}
