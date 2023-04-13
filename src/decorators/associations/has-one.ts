import pluralize = require('pluralize')
import dream from '../../dream'
import { DB } from '../../sync/schema'

export default function HasOne<TableName extends keyof DB & string>(
  tableName: TableName,
  modelCB: () => ReturnType<typeof dream<TableName, any>>,
  {
    through,
    throughClass,
  }: {
    through?: string
    throughClass?: () => ReturnType<typeof dream<any, any>>
  } = {}
): any {
  return function (target: any, key: string, _: any) {
    if ((through && !throughClass) || (throughClass && !through))
      throw `
      Must pass both 'through' and 'throughKey' to through associations
    `
    // TODO: add better validation on through associations
    // TODO: add type guards to through associations if possible

    Object.defineProperty(target.constructor.associations, 'hasOne', {
      value: [
        ...(target.constructor.associations.hasOne as HasOneStatement<any>[]),
        {
          modelCB,
          type: 'HasOne',
          to: tableName,
          // TODO: abstract foreign key capture to helper, with optional override provided by the api
          foreignKey: () =>
            through
              ? pluralize.singular(throughClass!().table) + '_id'
              : pluralize.singular(target.constructor.table) + '_id',
          as: key,
          through,
          throughClass,
        } as HasOneStatement<any>,
      ] as HasOneStatement<any>[],
    })
  }
}

export interface HasOneStatement<ForeignTablename extends keyof DB & string> {
  modelCB: () => ReturnType<typeof dream<ForeignTablename, any>>
  type: 'HasOne'
  to: keyof DB & string
  foreignKey: () => keyof DB[ForeignTablename] & string
  as: string
  through?: string
  throughClass?: () => ReturnType<typeof dream<ForeignTablename, any>>
}
