import lookupModelByGlobalNameOrNames from '../../../dream-app/helpers/lookupModelByGlobalNameOrNames.js'
import Dream from '../../../Dream.js'
import ArrayTargetOnlyOnPolymorphicBelongsTo from '../../../errors/associations/ArrayTargetOnlyOnPolymorphicBelongsTo.js'
import {
  BelongsToStatement,
  NonPolymorphicBelongsToOptions,
  PolymorphicBelongsToOptions,
} from '../../../types/associations/belongsTo.js'
import { GlobalModelNameTableMap } from '../../../types/dream.js'
import { DecoratorContext } from '../../DecoratorContextType.js'
import { validatesImplementation } from '../validation/Validates.js'
import {
  applyGetterAndSetter,
  associationPrimaryKeyAccessors,
  blankAssociationsFactory,
  finalForeignKey,
  foreignKeyTypeField,
} from './shared.js'

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
 *   @deco.BelongsTo('User')
 *   public user: User
 *   public userId: DreamColumn<UserSettings, 'userId'>
 * }
 *
 * class User extends ApplicationModel {
 *   @deco.HasOne('UserSettings')
 *   public userSettings: UserSettings
 * }
 * ```
 *
 * @param opts.on - A custom column name to use for joining associations on.
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
    on: foreignKey,
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

      if (Array.isArray(globalAssociationNameOrNames) && !polymorphic)
        throw new ArrayTargetOnlyOnPolymorphicBelongsTo({ dreamClass, associationName: key })

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

      if (!Object.getOwnPropertyDescriptor(dreamClass, 'associationMetadataByType'))
        dreamClass['associationMetadataByType'] = blankAssociationsFactory(dreamClass)
      ;(
        dreamClass['associationMetadataByType']['belongsTo'] as BelongsToStatement<any, any, any, any>[]
      ).push(association)

      applyGetterAndSetter(target, association, { isBelongsTo: true, foreignKeyBase: foreignKey })
      if (!optional) validatesImplementation(target, key, 'requiredBelongsTo')
    })
  }
}
