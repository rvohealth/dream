import pluralize = require('pluralize')
import Dream from '../../dream'
import { DB } from '../../sync/schema'
import { AssociationTableNames } from '../../db/reflections'
import { blankAssociationsFactory } from './shared'
import Validates from '../validations/validates'

export default function BelongsTo(
  modelCB: () => typeof Dream | (typeof Dream)[],
  {
    foreignKey,
    optional = false,
    polymorphic = false,
  }: {
    foreignKey?: string
    optional?: boolean
    polymorphic?: boolean
  } = {}
): any {
  return function (target: any, key: string, _: any) {
    const dreamClass: typeof Dream = target.constructor

    if (!Object.getOwnPropertyDescriptor(dreamClass, 'associations'))
      dreamClass.associations = blankAssociationsFactory(dreamClass)

    dreamClass.associations['belongsTo'].push({
      modelCB,
      type: 'BelongsTo',
      optional,
      polymorphic,
      foreignKey() {
        return finalForeignKey(foreignKey, modelCB)
      },
      foreignKeyTypeField() {
        return foreignKeyTypeField(foreignKey, modelCB)
      },
      as: key,
    })

    Object.defineProperty(target, key, {
      get: function (this: any) {
        return this[`__${key}__`]
      },
      set: function (this: any, associatedModel: any) {
        this[`__${key}__`] = associatedModel
        this[finalForeignKey(foreignKey, modelCB)] = associatedModel.primaryKeyValue
        if (polymorphic) this[foreignKeyTypeField(foreignKey, modelCB)] = associatedModel.constructor.name
      },
    })

    if (!optional) Validates('requiredBelongsTo')(target, key)
  }
}

function finalForeignKey(foreignKey: any, modelCB: any): string {
  return foreignKey || pluralize.singular(modelCB().prototype.table) + '_id'
}

function foreignKeyTypeField(foreignKey: any, modelCB: any): string {
  return finalForeignKey(foreignKey, modelCB).replace(/_id$/, '_type')
}

export interface BelongsToStatement<TableName extends AssociationTableNames> {
  modelCB: () => typeof Dream | (typeof Dream)[]
  type: 'BelongsTo'
  as: string
  foreignKey: () => keyof DB[TableName]
  foreignKeyTypeField: () => keyof DB[TableName]
  optional: boolean
  polymorphic: boolean
}
