import pluralize = require('pluralize')
import dream, { DreamModel } from '../../dream'
import { DB } from '../../sync/schema'
import { AssociationTableNames } from '../../db/reflections'

export default function BelongsTo(
  modelCB: () => ReturnType<typeof dream<any, any>> | ReturnType<typeof dream<any, any>>[],
  {
    foreignKey,
    polymorphic = false,
  }: {
    foreignKey?: string
    polymorphic?: boolean
  } = {}
): any {
  return function (target: any, key: string, _: any) {
    Object.defineProperty((target.constructor as any).associations, 'belongsTo', {
      value: [
        ...((target.constructor as any).associations.belongsTo as BelongsToStatement<any>[]),
        {
          modelCB,
          type: 'BelongsTo',
          polymorphic,
          // TODO: abstract foreign key capture to helper, with optional override provided by the api
          foreignKey() {
            return foreignKey || pluralize.singular((modelCB() as any).table) + '_id'
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
  as: string
  foreignKey: () => keyof DB[TableName]
  foreignKeyTypeField: () => keyof DB[TableName]
  polymorphic: boolean
}
