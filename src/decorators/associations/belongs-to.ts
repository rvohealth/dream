import Dream from '../../dream'
import { AssociationTableNames } from '../../db/reflections'
import {
  PartialAssociationStatement,
  applyGetterAndSetter,
  blankAssociationsFactory,
  finalForeignKey,
  foreignKeyTypeField,
  associationPrimaryKeyAccessors,
} from './shared'
import Validates from '../validations/validates'
import { DreamColumn } from '../../dream/types'
import { isArray } from 'lodash'

export default function BelongsTo<
  BaseInstance extends Dream,
  AssociationDreamClass extends typeof Dream = typeof Dream,
>(
  modelCB: () => AssociationDreamClass | AssociationDreamClass[],
  {
    foreignKey,
    optional = false,
    polymorphic = false,
    primaryKeyOverride = null,
  }: BelongsToOptions<BaseInstance> = {}
): any {
  return function (target: BaseInstance, key: string, _: any) {
    const dreamClass: typeof Dream = (target as any).constructor

    if (!Object.getOwnPropertyDescriptor(dreamClass, 'associations'))
      dreamClass['associations'] = blankAssociationsFactory(dreamClass)

    const partialAssociation = associationPrimaryKeyAccessors(
      {
        modelCB,
        type: 'BelongsTo',
        as: key,
        optional,
        polymorphic,
        primaryKeyOverride,
      } as any,
      dreamClass
    )

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
  primaryKey: (associationInstance?: Dream) => keyof DB[TableName] & string
  primaryKeyValue: (associationInstance: Dream) => any
  primaryKeyOverride?: (keyof DB[TableName] & string) | null
  foreignKey: () => DreamColumn<BaseInstance> & string
  foreignKeyTypeField: () => DreamColumn<BaseInstance> & string
  optional: boolean
  distinct: null
  polymorphic: boolean
}

export interface BelongsToOptions<
  BaseInstance extends Dream,
  AssociationDreamClass extends typeof Dream = typeof Dream,
> {
  foreignKey?: DreamColumn<BaseInstance>
  primaryKeyOverride?: DreamColumn<InstanceType<AssociationDreamClass>> | null
  optional?: boolean
  polymorphic?: boolean
}
