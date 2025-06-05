import lookupModelByGlobalNameOrNames from '../../../dream-app/helpers/lookupModelByGlobalNameOrNames.js'
import Dream from '../../../Dream.js'
import {
  HasManyOptions,
  HasManyStatement,
  HasManyThroughOptions,
  PolymorphicHasManyOptions,
} from '../../../types/associations/hasMany.js'
import { GlobalModelIdentifier, TableNameForGlobalModelName } from '../../../types/dream.js'
import { DecoratorContext } from '../../DecoratorContextType.js'
import {
  applyGetterAndSetter,
  associationPrimaryKeyAccessors,
  blankAssociationsFactory,
  finalForeignKey,
  foreignKeyTypeField,
  validateHasStatementArgs,
} from './shared.js'

export default function HasMany<
  I extends Dream,
  const AssociationGlobalId extends GlobalModelIdentifier<I>,
  AssociationTableName extends TableNameForGlobalModelName<I, AssociationGlobalId>,
>(globalAssociationNameOrNames: AssociationGlobalId, opts?: HasManyOptions<I, AssociationTableName>): any

export default function HasMany<
  I extends Dream,
  const AssociationGlobalId extends GlobalModelIdentifier<I>,
  AssociationTableName extends TableNameForGlobalModelName<I, AssociationGlobalId>,
>(
  globalAssociationNameOrNames: AssociationGlobalId,
  opts?: HasManyThroughOptions<I, AssociationTableName>
): any

export default function HasMany<
  I extends Dream,
  const AssociationGlobalId extends GlobalModelIdentifier<I>,
  AssociationTableName extends TableNameForGlobalModelName<I, AssociationGlobalId>,
>(
  globalAssociationNameOrNames: AssociationGlobalId,
  opts?: PolymorphicHasManyOptions<I, AssociationTableName>
): any

/**
 * Establishes a "HasMany" association between the base dream
 * and the child dream, where the child dream has a foreign key
 * which points back to the base dream.
 *
 * ```ts
 * class User extends ApplicationModel {
 *   @deco.HasMany('Post')
 *   public posts: Post[]
 * }
 *
 * class Post extends ApplicationModel {
 *   @deco.BelongsTo('User')
 *   public user: User
 *   public userId: DreamColumn<Post, 'userId'>
 * }
 * ```
 *
 * @param opts.dependent - Can be either "destroy" or undefined. If "destroy", this record will be cascade deleted if the base model is destroyed.
 * @param opts.distinct - Can be a column name, or else a boolean. If a column name, a distinct clause will be applied to the column. If true, a distinct clause will be applied to the primary key.
 * @param opts.foreignKey - A custom column name to use for the foreign key.
 * @param opts.and - An and-clause to be applied when this association is loaded
 * @param opts.andNot - A not and-clause to be applied when this association is loaded
 * @param opts.andAny - An andAny clause to be applied when this association is loaded
 * @param opts.order - A custom order statement to apply to this association.
 * @param opts.polymorphic - If true, this association will be treated as a polymorphic association.
 * @param opts.preloadThroughColumns - An array of columns to pluck off the through association attached to this association. Can only be set if `through` is also set.
 * @param opts.primaryKeyOverride - A custom column name to use for the primary key.
 * @param opts.selfAnd - Adds an and-clause to an association between a column on the associated model and a column on this model.
 * @param opts.selfAndNot - Adds a not and-clause to an association between a column on the associated model and a column on this model.
 * @param opts.source - Used in conjunction with 'through' to specify the source association on a child model.
 * @param opts.through - If passed, this association will travel through another association.
 * @param opts.withoutDefaultScopes - A list of default scopes to bypass when loading this association
 */
export default function HasMany<BaseInstance extends Dream, AssociationTableNameOrNames>(
  globalAssociationNameOrNames: AssociationTableNameOrNames,
  opts: unknown = {}
): any {
  const {
    dependent,
    distinct,
    foreignKey,
    and,
    andNot,
    andAny,
    order,
    polymorphic = false,
    preloadThroughColumns,
    primaryKeyOverride = null,
    selfAnd,
    selfAndNot,
    source,
    through,
    withoutDefaultScopes,
  } = opts as any

  return function (_: undefined, context: DecoratorContext) {
    const key = context.name

    context.addInitializer(function (this: BaseInstance) {
      const target = this
      const dreamClass: typeof Dream = target.constructor as typeof Dream
      if (!dreamClass['globallyInitializingDecorators']) {
        /**
         * Modern Javascript applies implicit accessors to instance properties
         * that don't have an accessor explicitly defined in the class definition.
         * The instance accessors shadow prototype accessors.
         * `addInitializer` is called by Decorators after an instance has been fully
         * constructed. We leverage this opportunity to delete the instance accessors
         * so that the prototype accessors applied by this decorator can be reached.
         */
        delete (this as any)[key]
        return
      }

      validateHasStatementArgs({
        dreamClass,
        dependent: dependent ?? null,
        methodName: key,
        and: and ?? null,
      })

      const partialAssociation = associationPrimaryKeyAccessors(
        {
          modelCB: () => lookupModelByGlobalNameOrNames(globalAssociationNameOrNames as string | string[]),
          as: key,
          dependent,
          globalAssociationNameOrNames,
          and,
          andNot,
          andAny,
          polymorphic,
          preloadThroughColumns,
          primaryKeyOverride,
          selfAnd,
          selfAndNot,
          source: source || key,
          type: 'HasMany',
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

      if (!Object.getOwnPropertyDescriptor(dreamClass, 'associationMetadataByType'))
        dreamClass['associationMetadataByType'] = blankAssociationsFactory(dreamClass)
      ;(dreamClass['associationMetadataByType']['hasMany'] as HasManyStatement<any, any, any, any>[]).push(
        association
      )

      applyGetterAndSetter(target as any, association)
    })
  }
}
