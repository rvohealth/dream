import { AssociationTableNames } from '../../db/reflections.js'
import Dream from '../../Dream.js'
import lookupModelByGlobalNameOrNames from '../../dream-application/helpers/lookupModelByGlobalNameOrNames.js'
import { GlobalModelNameTableMap } from '../../dream/types.js'
import { DecoratorContext } from '../DecoratorContextType.js'
import {
  applyGetterAndSetter,
  associationPrimaryKeyAccessors,
  blankAssociationsFactory,
  finalForeignKey,
  foreignKeyTypeField,
  HasOptions,
  HasStatement,
  HasThroughOptions,
  PolymorphicHasOptions,
  validateHasStatementArgs,
} from './shared.js'

export default function HasOne<
  BaseInstance extends Dream,
  AssociationGlobalName extends keyof GlobalModelNameTableMap<BaseInstance>,
>(
  globalAssociationName: AssociationGlobalName,
  opts?: HasOneOptions<BaseInstance, AssociationGlobalName>
): any

export default function HasOne<
  BaseInstance extends Dream,
  AssociationGlobalName extends keyof GlobalModelNameTableMap<BaseInstance>,
>(
  globalAssociationNameOrNames: AssociationGlobalName,
  opts?: HasOneThroughOptions<BaseInstance, AssociationGlobalName>
): any

export default function HasOne<
  BaseInstance extends Dream,
  AssociationGlobalName extends keyof GlobalModelNameTableMap<BaseInstance>,
>(
  globalAssociationNameOrNames: AssociationGlobalName,
  opts?: PolymorphicHasOneOptions<BaseInstance, AssociationGlobalName>
): any

/**
 * Establishes a "HasOne" association between the base dream
 * and the child dream, where the child dream has a foreign key
 * which points back to the base dream.
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
 * @param opts.on - An on clause to be applied when this association is loaded
 * @param opts.notOn - A not on clause to be applied when this association is loaded
 * @param opts.onAny - An onAny clause to be applied when this association is loaded
 * @param opts.polymorphic - If true, this association will be treated as a polymorphic association.
 * @param opts.preloadThroughColumns - An array of columns to pluck off the through association attached to this association. Can only be set if `through` is also set.
 * @param opts.primaryKeyOverride - A custom column name to use for the primary key.
 * @param opts.selfOn - Adds an on clause to an association between a column on the associated model and a column on this model.
 * @param opts.selfNotOn - Adds a not on clause to an association between a column on the associated model and a column on this model.
 * @param opts.source - Used in conjunction with 'through' to specify the source association on a child model.
 * @param opts.through - If passed, this association will travel through another association.
 * @param opts.withoutDefaultScopes - A list of default scopes to bypass when loading this association
 */
export default function HasOne<BaseInstance extends Dream, AssociationGlobalNameOrNames>(
  globalAssociationNameOrNames: AssociationGlobalNameOrNames,
  opts: unknown = {}
): any {
  const {
    dependent,
    foreignKey,
    on,
    notOn,
    onAny,
    polymorphic = false,
    preloadThroughColumns,
    primaryKeyOverride = null,
    selfOn,
    selfNotOn,
    source,
    through,
    withoutDefaultScopes,
  } = opts as any

  return function (_: undefined, context: DecoratorContext) {
    const key = context.name

    context.addInitializer(function (this: BaseInstance) {
      const target = this
      const dreamClass: typeof Dream = target.constructor as typeof Dream

      validateHasStatementArgs({
        dreamClass,
        dependent: dependent ?? null,
        methodName: key,
        on: on ?? null,
      })

      const partialAssociation = associationPrimaryKeyAccessors(
        {
          modelCB: () => lookupModelByGlobalNameOrNames(globalAssociationNameOrNames as string | string[]),
          as: key,
          dependent,
          globalAssociationNameOrNames,
          on,
          notOn,
          onAny,
          polymorphic,
          preloadThroughColumns,
          primaryKeyOverride,
          selfOn,
          selfNotOn,
          source: source || key,
          through,
          type: 'HasOne',
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

      if (dreamClass['globallyInitializingDecorators']) {
        if (!Object.getOwnPropertyDescriptor(dreamClass, 'associationMetadataByType'))
          dreamClass['associationMetadataByType'] = blankAssociationsFactory(dreamClass)

        dreamClass['associationMetadataByType']['hasOne'].push(association)
      }

      applyGetterAndSetter(target, association)
    })
  }
}

export type HasOneStatement<
  BaseInstance extends Dream,
  DB,
  Schema,
  ForeignTableName extends AssociationTableNames<DB, Schema> & keyof DB,
> = HasStatement<BaseInstance, DB, Schema, ForeignTableName, 'HasOne'>

export type HasOneOptions<
  BaseInstance extends Dream,
  AssociationGlobalName extends keyof GlobalModelNameTableMap<BaseInstance>,
> = HasOptions<BaseInstance, AssociationGlobalName>

export type PolymorphicHasOneOptions<
  BaseInstance extends Dream,
  AssociationGlobalName extends keyof GlobalModelNameTableMap<BaseInstance>,
> = PolymorphicHasOptions<BaseInstance, AssociationGlobalName>

export type HasOneThroughOptions<
  BaseInstance extends Dream,
  AssociationGlobalName extends keyof GlobalModelNameTableMap<BaseInstance>,
> = HasThroughOptions<BaseInstance, AssociationGlobalName>
