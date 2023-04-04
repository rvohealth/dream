import pluralize = require('pluralize')
import dream from '../dream'
import { DB } from '../sync/schema'

export default function HasOne<TableName extends keyof DB & string>(
  tableName: TableName,
  modelCB: () => ReturnType<typeof dream<TableName, any>>['Dream']
): any {
  return function (target: any, key: string, _: any) {
    Object.defineProperty(target.constructor.associations, 'hasOne', {
      value: [
        ...(target.constructor.associations.hasOne as HasOneStatement<any>[]),
        {
          modelCB,
          to: tableName,
          // TODO: abstract foreign key capture to helper, with optional override provided by the api
          foreignKey: pluralize.singular(target.constructor.table) + '_id',
          as: key,
        } as HasOneStatement<any>,
      ] as HasOneStatement<any>[],
    })
  }
}

export interface HasOneStatement<ForeignTablename extends keyof DB & string> {
  modelCB: () => ReturnType<typeof dream<ForeignTablename, any>>['Dream']
  to: keyof DB & string
  foreignKey: keyof DB[ForeignTablename] & string
  as: string
}
