import pluralize = require('pluralize')
import dream from '../../dream'
import { DB } from '../../sync/schema'
import { HasStatement, WhereStatement } from './shared'
import { AssociationTableNames } from '../../db/reflections'

export default function HasOne<TableName extends AssociationTableNames>(
  tableName: TableName,
  modelCB: () => ReturnType<typeof dream<TableName, any>>,
  {
    foreignKey,
    polymorphic = false,
    through,
    throughClass,
    where,
  }: {
    foreignKey?: string
    polymorphic?: boolean
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
          foreignKey() {
            return foreignKey || pluralize.singular(target.constructor.table) + '_id'
          },
          foreignKeyTypeField() {
            return (this.foreignKey() as string).replace(/_id$/, '_type')
          },

          as: key,
          polymorphic,
          through,
          throughClass,
          where,
        } as HasOneStatement<any>,
      ] as HasOneStatement<any>[],
    })
  }
}
export interface HasOneStatement<ForeignTableName extends AssociationTableNames>
  extends HasStatement<ForeignTableName, 'HasOne'> {}
