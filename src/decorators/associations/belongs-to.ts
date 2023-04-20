import pluralize = require('pluralize')
import dream, { DreamModel } from '../../dream'
import { DB } from '../../sync/schema'
import { AssociationTableNames } from '../../db/reflections'

type TableNameOrNames = AssociationTableNames | AssociationTableNames[]

export default function BelongsTo<T extends TableNameOrNames>(
  tableName: T,
  modelCB: () => T extends AssociationTableNames
    ? ReturnType<typeof dream<T, any>>
    : T extends AssociationTableNames[]
    ? // ? ReturnType<typeof dream<T[number], any>>[]
      ReturnType<typeof dream<any, any>>[]
    : never,
  {
    foreignKey,
    polymorphic = false,
  }: {
    foreignKey?: string
    polymorphic?: boolean
  } = {}
): any {
  return function (target: any, key: string, _: any) {
    const tableNames = tableName.constructor === Array ? tableName : [tableName]
    Object.defineProperty(target.constructor.associations, 'belongsTo', {
      value: [
        ...(target.constructor.associations.belongsTo as BelongsToStatement<any>[]),
        {
          modelCB,
          type: 'BelongsTo',
          to: tableNames,
          polymorphic,
          // TODO: abstract foreign key capture to helper, with optional override provided by the api
          foreignKey() {
            return foreignKey || pluralize.singular(tableName as string) + '_id'
          },
          foreignKeyTypeField() {
            return (this.foreignKey() as string).replace(/_id$/, '_type')
          },
          as: key,
        } as BelongsToStatement<any>,
      ] as BelongsToStatement<any>[],
    })
  }
}

export interface BelongsToStatement<TableName extends AssociationTableNames> {
  modelCB: () => DreamModel<TableName, any> | DreamModel<TableName, any>[]
  type: 'BelongsTo'
  to: AssociationTableNames[]
  as: string
  foreignKey: () => keyof DB[TableName]
  foreignKeyTypeField: () => keyof DB[TableName]
  polymorphic: boolean
}
