import Dream from '../../dream'
import { DB } from '../../sync/schema'
import { AssociationTableNames } from '../../db/reflections'
import {
  PartialAssociationStatement,
  blankAssociationsFactory,
  finalForeignKey,
  foreignKeyTypeField,
} from './shared'
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

    const partialAssociation = {
      modelCB,
      type: 'BelongsTo',
      as: key,
      optional,
      polymorphic,
    } as PartialAssociationStatement

    const association = {
      ...partialAssociation,
      foreignKey() {
        return finalForeignKey(foreignKey, dreamClass, partialAssociation)
      },
      foreignKeyTypeField() {
        return foreignKeyTypeField(foreignKey, dreamClass, partialAssociation)
      },
    } as BelongsToStatement<any>

    dreamClass.associations['belongsTo'].push(association)

    Object.defineProperty(target, key, {
      get: function (this: any) {
        return this[`__${key}__`]
      },
      set: function (this: any, associatedModel: any) {
        this[`__${key}__`] = associatedModel
        this[finalForeignKey(foreignKey, dreamClass, partialAssociation)] = associatedModel?.primaryKeyValue
        if (polymorphic)
          this[foreignKeyTypeField(foreignKey, dreamClass, partialAssociation)] =
            associatedModel?.constructor?.name
      },
    })

    if (!optional) Validates('requiredBelongsTo')(target, key)
  }
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
