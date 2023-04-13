import pluralize = require('pluralize')
import dream from '../../dream'
import { DB } from '../../sync/schema'

export default function BelongsTo<TableName extends keyof DB & string>(
  tableName: TableName,
  modelCB: () => ReturnType<typeof dream<TableName, any>>
): any {
  return function (target: any, key: string, _: any) {
    Object.defineProperty(target.constructor.associations, 'belongsTo', {
      value: [
        ...(target.constructor.associations.belongsTo as BelongsToStatement<any>[]),
        {
          modelCB,
          type: 'BelongsTo',
          to: tableName,
          // TODO: abstract foreign key capture to helper, with optional override provided by the api
          foreignKey: () => pluralize.singular(tableName) + '_id',
          as: key,
        } as BelongsToStatement<any>,
      ] as BelongsToStatement<any>[],
    })
  }
}

export interface BelongsToStatement<ForeignTablename extends keyof DB & string> {
  modelCB: () => ReturnType<typeof dream<ForeignTablename, any>>
  type: 'BelongsTo'
  to: keyof DB & string
  foreignKey: () => keyof DB[ForeignTablename] & string
  as: string
}
