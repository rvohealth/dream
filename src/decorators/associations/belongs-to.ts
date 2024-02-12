import Dream from '../../dream'
import { AssociationTableNames } from '../../db/reflections'
import {
  PartialAssociationStatement,
  applyGetterAndSetter,
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
      dreamClass['associations'] = blankAssociationsFactory(dreamClass)

    const partialAssociation = {
      modelCB,
      type: 'BelongsTo',
      distinct: null,
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
    } as BelongsToStatement<any, any, any>

    dreamClass['associations']['belongsTo'].push(association)
    applyGetterAndSetter(target, association, { isBelongsTo: true, foreignKeyBase: foreignKey })
    if (!optional) Validates('requiredBelongsTo')(target, key)
  }
}

export interface BelongsToStatement<
  DB extends any,
  SyncedAssociations extends any,
  TableName extends AssociationTableNames<DB, SyncedAssociations> & keyof DB,
> {
  modelCB: () => typeof Dream | (typeof Dream)[]
  type: 'BelongsTo'
  as: string
  foreignKey: () => keyof DB[TableName]
  foreignKeyTypeField: () => keyof DB[TableName]
  optional: boolean
  distinct: null
  polymorphic: boolean
}
