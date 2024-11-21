import { AssociationTableNames } from '../../db/reflections'
import Dream from '../../Dream'
import lookupModelByGlobalNameOrNames from '../../dream-application/helpers/lookupModelByGlobalNameOrNames'
import { GlobalModelNames, TableColumnNames } from '../../dream/types'
import {
  HasOptions,
  HasStatement,
  HasThroughOptions,
  OrderStatement,
  PolymorphicHasOptions,
  applyGetterAndSetter,
  associationPrimaryKeyAccessors,
  blankAssociationsFactory,
  finalForeignKey,
  foreignKeyTypeField,
  validateHasStatementArgs,
} from './shared'

export default function HasMany<
  BaseInstance extends Dream = Dream,
  AssociationGlobalNameOrNames extends
    | GlobalModelNames<BaseInstance>
    | readonly GlobalModelNames<BaseInstance>[] =
    | GlobalModelNames<BaseInstance>
    | readonly GlobalModelNames<BaseInstance>[],
>(
  globalAssociationNameOrNames: AssociationGlobalNameOrNames,
  opts?: HasManyOptions<BaseInstance, AssociationGlobalNameOrNames>
): any

export default function HasMany<
  BaseInstance extends Dream = Dream,
  AssociationGlobalNameOrNames extends
    | GlobalModelNames<BaseInstance>
    | readonly GlobalModelNames<BaseInstance>[] =
    | GlobalModelNames<BaseInstance>
    | readonly GlobalModelNames<BaseInstance>[],
>(
  globalAssociationNameOrNames: AssociationGlobalNameOrNames,
  opts?: HasManyThroughOptions<BaseInstance, AssociationGlobalNameOrNames>
): any

export default function HasMany<
  BaseInstance extends Dream = Dream,
  AssociationGlobalNameOrNames extends
    | GlobalModelNames<BaseInstance>
    | readonly GlobalModelNames<BaseInstance>[] =
    | GlobalModelNames<BaseInstance>
    | readonly GlobalModelNames<BaseInstance>[],
>(
  globalAssociationNameOrNames: AssociationGlobalNameOrNames,
  opts?: PolymorphicHasManyOptions<BaseInstance, AssociationGlobalNameOrNames>
): any

/**
 * Establishes a "HasMany" association between the base dream
 * and the child dream, where the child dream has a foreign key
 * which points back to the base dream.
 *
 * ```ts
 * class User extends ApplicationModel {
 *   @User.HasMany('Post')
 *   public posts: Post[]
 * }
 *
 * class Post extends ApplicationModel {
 *   @Post.BelongsTo('User')
 *   public user: User
 *   public userId: DreamColumn<Post, 'userId'>
 * }
 * ```
 *
 * @param opts.dependent - Can be either "destroy" or undefined. If "destroy", this record will be cascade deleted if the base model is destroyed.
 * @param opts.distinct - Can be a column name, or else a boolean. If a column name, a distinct clause will be applied to the column. If true, a distinct clause will be applied to the primary key.
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
export default function HasMany<
  BaseInstance extends Dream = Dream,
  AssociationGlobalNameOrNames = GlobalModelNames<BaseInstance> | GlobalModelNames<BaseInstance>[],
>(globalAssociationNameOrNames: AssociationGlobalNameOrNames, opts: unknown = {}): any {
  const {
    dependent,
    distinct,
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

    if (!Object.getOwnPropertyDescriptor(dreamClass, 'associationMetadataByType'))
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
        type: 'HasMany',
        as: key,
        polymorphic,
        source: source || key,
        preloadThroughColumns,
        where,
        whereNot,
        selfWhere,
        selfWhereNot,
        primaryKeyOverride,
        dependent,
        withoutDefaultScopes,
      } as any,
      dreamClass
    )

    const association = {
      ...partialAssociation,
      through,
      distinct,
      order,
      foreignKey() {
        return finalForeignKey(foreignKey, dreamClass, partialAssociation)
      },
      foreignKeyTypeField() {
        return foreignKeyTypeField(foreignKey, dreamClass, partialAssociation)
      },
    } as HasManyStatement<any, any, any, any>

    dreamClass['associationMetadataByType']['hasMany'].push(association)
    applyGetterAndSetter(target as any, association)
  }
}

export type HasManyStatement<
  BaseInstance extends Dream,
  DB,
  Schema,
  ForeignTableName extends AssociationTableNames<DB, Schema> & keyof DB,
> = HasStatement<BaseInstance, DB, Schema, ForeignTableName, 'HasMany'> & {
  distinct?: TableColumnNames<DB, ForeignTableName>
  order?: OrderStatement<DB, Schema, ForeignTableName>
}

export type HasManyOptions<
  BaseInstance extends Dream,
  AssociationGlobalNameOrNames extends
    | GlobalModelNames<BaseInstance>
    | readonly GlobalModelNames<BaseInstance>[],
> = HasOptions<BaseInstance, AssociationGlobalNameOrNames>

export type PolymorphicHasManyOptions<
  BaseInstance extends Dream,
  AssociationGlobalNameOrNames extends
    | GlobalModelNames<BaseInstance>
    | readonly GlobalModelNames<BaseInstance>[],
> = PolymorphicHasOptions<BaseInstance, AssociationGlobalNameOrNames>

export type HasManyThroughOptions<
  BaseInstance extends Dream,
  AssociationGlobalNameOrNames extends
    | GlobalModelNames<BaseInstance>
    | readonly GlobalModelNames<BaseInstance>[],
> = HasThroughOptions<BaseInstance, AssociationGlobalNameOrNames>
