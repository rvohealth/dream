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
            return finalForeignKey(foreignKey, modelCB)
          },
          foreignKeyTypeField() {
            return foreignKeyTypeField(foreignKey, modelCB)
          },
          as: key,
        } as BelongsToStatement<any>,
      ] as BelongsToStatement<any>[],
    })

    Object.defineProperty(target, key, {
      get: function (this: any) {
        return this[`__${key}__`]
      },
      set: function (
        this: any,
        associatedModel: any
        // this: InstanceType<ReturnType<typeof dream<any, any>>>,
        // associatedModel: InstanceType<ReturnType<typeof dream<any, any>>>
      ) {
        this[`__${key}__`] = associatedModel
        this[finalForeignKey(foreignKey, modelCB)] = associatedModel.primaryKeyValue
        if (polymorphic) this[foreignKeyTypeField(foreignKey, modelCB)] = associatedModel.constructor.name
      },
    })
  }
}

function finalForeignKey(foreignKey: any, modelCB: any): string {
  return foreignKey || pluralize.singular(modelCB().table) + '_id'
}

function foreignKeyTypeField(foreignKey: any, modelCB: any): string {
  return finalForeignKey(foreignKey, modelCB).replace(/_id$/, '_type')
}

export interface BelongsToStatement<TableName extends AssociationTableNames> {
  modelCB: () => DreamModel<TableName, any> | DreamModel<TableName, any>[]
  type: 'BelongsTo'
  as: string
  foreignKey: () => keyof DB[TableName]
  foreignKeyTypeField: () => keyof DB[TableName]
  polymorphic: boolean
}
