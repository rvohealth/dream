import { AssociationTableNames } from '../../db/reflections'
import Dream from '../../dream'
import { DefaultScopeName, DreamColumnNames } from '../../dream/types'
import Validates from '../validations/validates'
import {
  applyGetterAndSetter,
  associationPrimaryKeyAccessors,
  blankAssociationsFactory,
  finalForeignKey,
  foreignKeyTypeField,
} from './shared'

/**
 * Establishes a "BelongsTo" association between the base dream
 * and the child dream, where the base dream has a foreign key
 * which points back to the child dream. This relationship should
 * always have a corresponding `@HasOne` or `@HasMany` association
 * on the child class.
 *
 * ```ts
 * class UserSettings extends ApplicationModel {
 *   @BelongsTo(() => User)
 *   public user: User
 *   public userId: DreamColumn<UserSettings, 'userId'>
 * }
 *
 * class User extends ApplicationModel {
 *   @HasOne(() => UserSettings)
 *   public userSettings: UserSettings
 * }
 * ```
 *
 * @param opts.foreignKey - A custom column name to use for the foreign key.
 * @param opts.optional - Whether or not this association is optional. Defaults to false.
 * @param opts.polymorphic - If true, this association will be treated as a polymorphic association.
 * @param opts.primaryKeyOverride - A custom column name to use for the primary key.
 * @param opts.withoutDefaultScopes - A list of default scopes to bypass when loading this association
 */
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
    withoutDefaultScopes,
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
      dreamClass['associationMetadataByType'] = blankAssociationsFactory(dreamClass)

    const partialAssociation = associationPrimaryKeyAccessors(
      {
        modelCB,
        type: 'BelongsTo',
        as: key,
        optional,
        polymorphic,
        primaryKeyOverride,
        withoutDefaultScopes,
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

    dreamClass['associationMetadataByType']['belongsTo'].push(association)
    applyGetterAndSetter(target, association, { isBelongsTo: true, foreignKeyBase: foreignKey })
    if (!optional) Validates('requiredBelongsTo')(target, key)
  }
}

export interface BelongsToStatement<
  BaseInstance extends Dream,
  DB,
  Schema,
  TableName extends AssociationTableNames<DB, Schema> & keyof DB,
> {
  modelCB: () => typeof Dream | (typeof Dream)[]
  type: 'BelongsTo'
  as: string
  primaryKey: (associationInstance?: Dream) => keyof DB[TableName] & string
  primaryKeyValue: (associationInstance: Dream | null) => any
  primaryKeyOverride?: (keyof DB[TableName] & string) | null
  foreignKey: () => DreamColumnNames<BaseInstance> & string
  foreignKeyTypeField: () => DreamColumnNames<BaseInstance> & string
  optional: boolean
  distinct: null
  polymorphic: boolean
  withoutDefaultScopes?: DefaultScopeName<BaseInstance>[]
}

export interface BelongsToOptions<
  BaseInstance extends Dream,
  AssociationDreamClass extends typeof Dream = typeof Dream,
> {
  foreignKey?: DreamColumnNames<BaseInstance>
  primaryKeyOverride?: DreamColumnNames<InstanceType<AssociationDreamClass>> | null
  optional?: boolean
  polymorphic?: boolean
  withoutDefaultScopes?: DefaultScopeName<InstanceType<AssociationDreamClass>>[]
}
