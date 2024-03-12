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
import { DreamColumn } from '../../dream/types'

export default function BelongsTo<
  BaseInstance extends Dream,
  AssociationDreamClass extends typeof Dream = typeof Dream,
>(
  modelCB: () => AssociationDreamClass | AssociationDreamClass[],
  { foreignKey, optional = false, polymorphic = false }: BelongsToOptions<BaseInstance> = {}
): any {
  return function (target: BaseInstance, key: string, _: any) {
    const dreamClass: typeof Dream = (target as any).constructor

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
    } as BelongsToStatement<any, any, any, any>

    dreamClass['associations']['belongsTo'].push(association)
    applyGetterAndSetter(target, association, { isBelongsTo: true, foreignKeyBase: foreignKey })
    if (!optional) Validates('requiredBelongsTo')(target, key)
  }
}

export interface BelongsToStatement<
  BaseInstance extends Dream,
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

export interface BelongsToOptions<
  BaseInstance extends Dream,
  AssociationDreamClass extends typeof Dream = typeof Dream,
> {
  foreignKey?: DreamColumn<BaseInstance>
  optional?: boolean
  polymorphic?: boolean
}
