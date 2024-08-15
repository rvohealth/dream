import { AssociationTableNames } from '../../db/reflections'
import Dream from '../../dream'
import lookupModelByGlobalNameOrNames from '../../dream-application/helpers/lookupModelByGlobalNameOrNames'
import { GlobalModelName } from '../../dream/types'
import {
  HasManyOnlyOptions,
  HasOptions,
  HasStatement,
  HasThroughOptions,
  applyGetterAndSetter,
  associationPrimaryKeyAccessors,
  blankAssociationsFactory,
  finalForeignKey,
  foreignKeyTypeField,
  validateHasStatementArgs,
} from './shared'

export default function HasOne<
  BaseInstance extends Dream,
  AssociationGlobalNameOrNames extends
    | GlobalModelName<BaseInstance>
    | readonly GlobalModelName<BaseInstance>[],
>(
  globalAssociationNameOrNames: AssociationGlobalNameOrNames,
  opts?: HasOneOptions<BaseInstance, AssociationGlobalNameOrNames>
): any

export default function HasOne<
  BaseInstance extends Dream,
  AssociationGlobalNameOrNames extends
    | GlobalModelName<BaseInstance>
    | readonly GlobalModelName<BaseInstance>[],
>(
  globalAssociationNameOrNames: AssociationGlobalNameOrNames,
  opts?: HasOneThroughOptions<BaseInstance, AssociationGlobalNameOrNames>
): any

/**
 * Establishes a "HasOne" association between the base dream
 * and the child dream, where the child dream has a foreign key
 * which points back to the base dream. This relationship should
 * always have a corresponding `@BelongsTo` association on the
 * child class.
 *
 * ```ts
 * class User extends ApplicationModel {
 *   @User.HasOne('UserSettings')
 *   public userSettings: UserSettings
 * }
 *
 * class UserSettings extends ApplicationModel {
 *   @UserSettings.BelongsTo('User')
 *   public user: User
 *   public userId: DreamColumn<UserSettings, 'userId'>
 * }
 * ```
 *
 * @param opts.dependent - Can be either "destroy" or undefined. If "destroy", this record will be cascade deleted if the base model is destroyed.
 * @param opts.foreignKey - A custom column name to use for the foreign key.
 * @param opts.order - A custom order statement to apply to this association.
 * @param opts.polymorphic - If true, this association will be treated as a polymorphic association.
 * @param opts.preloadThroughColumns - An array of columns to pluck off the through association attached to this association. Can only be set if `through` is also set.
 * @param opts.primaryKeyOverride - A custom column name to use for the primary key.
 * @param opts.selfWhere - Adds a where clause to an association between a column on the associated model and a column on this model.
 * @param opts.selfWhereNot - Adds a where not clause to an association between a column on the associated model and a column on this model.
 * @param opts.source - Used in conjunction with 'through' to specify the source association on a child model.
 * @param opts.through - If passed, this association will travel through another association.
 * @param opts.where - A where clause to be applied when this association is loaded
 * @param opts.whereNot - A where not clause to be applied when this association is loaded
 * @param opts.withoutDefaultScopes - A list of default scopes to bypass when loading this association
 */
export default function HasOne<
  BaseInstance extends Dream,
  AssociationGlobalNameOrNames extends
    | GlobalModelName<BaseInstance>
    | readonly GlobalModelName<BaseInstance>[],
>(globalAssociationNameOrNames: AssociationGlobalNameOrNames, opts: unknown = {}): any {
  const {
    dependent,
    foreignKey,
    order,
    polymorphic = false,
    preloadThroughColumns,
    primaryKeyOverride = null,
    selfWhere,
    selfWhereNot,
    source,
    through,
    where,
    whereNot,
    withoutDefaultScopes,
  } = opts as any

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  return function (target: BaseInstance, key: string, _: any) {
    const dreamClass: typeof Dream = (target as any).constructor

    if (!Object.getOwnPropertyDescriptor(dreamClass, 'associations'))
      dreamClass['associationMetadataByType'] = blankAssociationsFactory(dreamClass)

    validateHasStatementArgs({
      dreamClass,
      dependent: dependent ?? null,
      methodName: key,
      where: where ?? null,
    })

    const partialAssociation = associationPrimaryKeyAccessors(
      {
        modelCB: () => lookupModelByGlobalNameOrNames(globalAssociationNameOrNames as string | string[]),
        globalAssociationNameOrNames,
        type: 'HasOne',
        as: key,
        polymorphic,
        source: source || key,
        through,
        preloadThroughColumns,
        where,
        whereNot,
        selfWhere,
        selfWhereNot,
        distinct: null,
        order,
        primaryKeyOverride,
        dependent,
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
    } as HasOneStatement<any, any, any, any>

    dreamClass['associationMetadataByType']['hasOne'].push(association)
    applyGetterAndSetter(target, association)
  }
}

export interface HasOneStatement<
  BaseInstance extends Dream,
  DB,
  Schema,
  ForeignTableName extends AssociationTableNames<DB, Schema> & keyof DB,
> extends HasStatement<BaseInstance, DB, Schema, ForeignTableName, 'HasOne'> {}

export interface HasOneOptions<
  BaseInstance extends Dream,
  AssociationGlobalNameOrNames extends
    | GlobalModelName<BaseInstance>
    | readonly GlobalModelName<BaseInstance>[],
> extends Omit<HasOptions<BaseInstance, AssociationGlobalNameOrNames>, HasManyOnlyOptions> {}

export interface HasOneThroughOptions<
  BaseInstance extends Dream,
  AssociationGlobalNameOrNames extends
    | GlobalModelName<BaseInstance>
    | readonly GlobalModelName<BaseInstance>[],
> extends Omit<HasThroughOptions<BaseInstance, AssociationGlobalNameOrNames>, HasManyOnlyOptions> {}
