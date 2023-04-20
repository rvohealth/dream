import pluralize = require('pluralize')
import dream from '../../dream'
import { DB } from '../../sync/schema'
import { HasStatement, WhereStatement } from './shared'

export default function HasOne<TableName extends keyof DB & string>(
  tableName: TableName,
  modelCB: () => ReturnType<typeof dream<TableName, any>>,
  {
    through,
    throughClass,
    where,
  }: {
    through?: string
    throughClass?: () => ReturnType<typeof dream<any, any>>
    where?: WhereStatement<TableName>
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
          where,
        } as HasOneStatement<any>,
      ] as HasOneStatement<any>[],
    })
  }
}
export interface HasOneStatement<ForeignTableName extends keyof DB & string>
  extends HasStatement<ForeignTableName, 'HasOne'> {}
