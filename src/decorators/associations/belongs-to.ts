import Dream from '../../dream'
import { AssociationTableNames } from '../../db/reflections'
import {
  applyGetterAndSetter,
  blankAssociationsFactory,
  finalForeignKey,
  foreignKeyTypeField,
  associationPrimaryKeyAccessors,
} from './shared'
import Validates from '../validations/validates'
import { DreamColumns } from '../../dream/types'

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
  return function (
    target: BaseInstance,
    key: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _: any
  ) {
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
  DB,
  SyncedAssociations,
  TableName extends AssociationTableNames<DB, SyncedAssociations> & keyof DB,
> {
  modelCB: () => typeof Dream | (typeof Dream)[]
  type: 'BelongsTo'
  as: string
  primaryKey: (associationInstance?: Dream) => keyof DB[TableName] & string
  primaryKeyValue: (associationInstance: Dream | null) => any
  primaryKeyOverride?: (keyof DB[TableName] & string) | null
  foreignKey: () => DreamColumns<BaseInstance> & string
  foreignKeyTypeField: () => DreamColumns<BaseInstance> & string
  optional: boolean
  distinct: null
  polymorphic: boolean
}

export interface BelongsToOptions<
  BaseInstance extends Dream,
  AssociationDreamClass extends typeof Dream = typeof Dream,
> {
  foreignKey?: DreamColumns<BaseInstance>
  primaryKeyOverride?: DreamColumns<InstanceType<AssociationDreamClass>> | null
  optional?: boolean
  polymorphic?: boolean
}
