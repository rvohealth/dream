import { AssociationTableNames } from '../../db/reflections'
import Dream from '../../Dream'
import lookupModelByGlobalNameOrNames from '../../dream-application/helpers/lookupModelByGlobalNameOrNames'
import {
  DefaultScopeName,
  DefaultScopeNameForTable,
  DreamColumnNames,
  GlobalModelNames,
  GlobalModelNameTableMap,
  TableColumnNames,
  TableNameForGlobalModelName,
} from '../../dream/types'
import { DecoratorContext } from '../DecoratorContextType'
import Validates from '../validations/Validates'
import {
  applyGetterAndSetter,
  associationPrimaryKeyAccessors,
  blankAssociationsFactory,
  finalForeignKey,
  foreignKeyTypeField,
} from './shared'

export default function BelongsTo<
  BaseInstance extends Dream,
  AssociationGlobalNameOrNames extends
    | keyof GlobalModelNameTableMap<BaseInstance>
    | (keyof GlobalModelNameTableMap<BaseInstance>)[],
>(
  globalAssociationNameOrNames: AssociationGlobalNameOrNames,
  opts?: NonPolymorphicBelongsToOptions<BaseInstance, AssociationGlobalNameOrNames>
): any

export default function BelongsTo<
  BaseInstance extends Dream,
  AssociationGlobalNameOrNames extends
    | keyof GlobalModelNameTableMap<BaseInstance>
    | (keyof GlobalModelNameTableMap<BaseInstance>)[],
>(
  globalAssociationNameOrNames: AssociationGlobalNameOrNames,
  opts?: PolymorphicBelongsToOptions<BaseInstance, AssociationGlobalNameOrNames>
): any

/**
 * Establishes a "BelongsTo" association between the base dream
 * and the child dream, where the base dream has a foreign key
 * which points back to the child dream.
 *
 * ```ts
 * class UserSettings extends ApplicationModel {
 *   @UserSettings.BelongsTo('User')
 *   public user: User
 *   public userId: DreamColumn<UserSettings, 'userId'>
 * }
 *
 * class User extends ApplicationModel {
 *   @User.HasOne('UserSettings')
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
export default function BelongsTo<BaseInstance extends Dream, AssociationGlobalNameOrNames>(
  globalAssociationNameOrNames: AssociationGlobalNameOrNames,
  opts: unknown = {}
): any {
  const {
    foreignKey,
    optional = false,
    polymorphic = false,
    primaryKeyOverride = null,
    withoutDefaultScopes,
  } = opts as any

  return function (_: undefined, context: DecoratorContext) {
    const key = context.name

    context.addInitializer(function (this: BaseInstance) {
      const target = this
      const dreamClass: typeof Dream = target.constructor as typeof Dream
      if (!dreamClass.initializingDecorators) return

      if (!Object.getOwnPropertyDescriptor(dreamClass, 'associationMetadataByType'))
        dreamClass['associationMetadataByType'] = blankAssociationsFactory(dreamClass)

      const partialAssociation = associationPrimaryKeyAccessors(
        {
          modelCB: () => lookupModelByGlobalNameOrNames(globalAssociationNameOrNames as string | string[]),
          globalAssociationNameOrNames,
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
    })
  }
}

export interface BelongsToStatement<
  BaseInstance extends Dream,
  DB,
  Schema,
  TableName extends AssociationTableNames<DB, Schema> & keyof DB,
> {
  modelCB: () => typeof Dream | (typeof Dream)[]
  globalAssociationNameOrNames: string[]
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

export interface NonPolymorphicBelongsToOptions<
  BaseInstance extends Dream,
  AssociationGlobalNameOrNames extends
    | GlobalModelNames<BaseInstance>
    | readonly GlobalModelNames<BaseInstance>[],
  AssociationGlobalName = AssociationGlobalNameOrNames extends Readonly<any[]>
    ? AssociationGlobalNameOrNames[0] & string
    : AssociationGlobalNameOrNames & string,
  AssociationTableName extends AssociationTableNames<BaseInstance['DB'], BaseInstance['schema']> &
    keyof BaseInstance['DB'] = TableNameForGlobalModelName<
    BaseInstance,
    AssociationGlobalName & GlobalModelNames<BaseInstance>
  > &
    AssociationTableNames<BaseInstance['DB'], BaseInstance['schema']> &
    keyof BaseInstance['DB'],
> {
  foreignKey?: DreamColumnNames<BaseInstance>
  primaryKeyOverride?: TableColumnNames<BaseInstance['DB'], AssociationTableName> | null
  optional?: boolean
  withoutDefaultScopes?: DefaultScopeNameForTable<BaseInstance['schema'], AssociationTableName>[]
}

export interface PolymorphicBelongsToOptions<
  BaseInstance extends Dream,
  AssociationGlobalNameOrNames extends
    | GlobalModelNames<BaseInstance>
    | readonly GlobalModelNames<BaseInstance>[],
  AssociationGlobalName = AssociationGlobalNameOrNames extends Readonly<any[]>
    ? AssociationGlobalNameOrNames[0] & string
    : AssociationGlobalNameOrNames & string,
  AssociationTableName extends AssociationTableNames<BaseInstance['DB'], BaseInstance['schema']> &
    keyof BaseInstance['DB'] = TableNameForGlobalModelName<
    BaseInstance,
    AssociationGlobalName & GlobalModelNames<BaseInstance>
  > &
    AssociationTableNames<BaseInstance['DB'], BaseInstance['schema']> &
    keyof BaseInstance['DB'],
> {
  foreignKey: DreamColumnNames<BaseInstance>
  primaryKeyOverride?: TableColumnNames<BaseInstance['DB'], AssociationTableName> | null
  optional?: boolean
  polymorphic: boolean
  withoutDefaultScopes?: DefaultScopeNameForTable<BaseInstance['schema'], AssociationTableName>[]
}
