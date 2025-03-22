import pluralize from 'pluralize-esm'
import Dream from '../../../Dream.js'
import { DreamConst } from '../../../dream/constants.js'
import { checkForeignKey } from '../../../errors/associations/InvalidComputedForeignKey.js'
import NonLoadedAssociation from '../../../errors/associations/NonLoadedAssociation.js'
import CannotDefineAssociationWithBothDependentAndPassthrough from '../../../errors/CannotDefineAssociationWithBothDependentAndPassthrough.js'
import CannotDefineAssociationWithBothDependentAndRequiredOnClause from '../../../errors/CannotDefineAssociationWithBothDependentAndRequiredOnClause.js'
import camelize from '../../../helpers/camelize.js'
import { DependentOptions, PartialAssociationStatement } from '../../../types/associations.js'
import { DreamBelongsToAssociationMetadata } from '../../../types/dream.js'
import associationToGetterSetterProp from './associationToGetterSetterProp.js'

export type MAX_JOINED_TABLES_DEPTH = 25

export type AssociatedBelongsToModelType<
  I extends Dream,
  AssociationName extends keyof DreamBelongsToAssociationMetadata<I>,
  PossibleArrayAssociationType extends I[AssociationName & keyof I] = I[AssociationName & keyof I],
  AssociationType extends PossibleArrayAssociationType extends (infer ElementType)[]
    ? ElementType
    : PossibleArrayAssociationType = PossibleArrayAssociationType extends (infer ElementType)[]
    ? ElementType
    : PossibleArrayAssociationType,
> = AssociationType

export function finalForeignKey(
  foreignKey: string | undefined,
  dreamClass: typeof Dream,
  partialAssociation: PartialAssociationStatement
): string {
  let computedForeignKey = foreignKey

  if (!computedForeignKey) {
    const table =
      partialAssociation.type === 'BelongsTo'
        ? modelCBtoSingleDreamClass(dreamClass, partialAssociation).table
        : dreamClass.table

    computedForeignKey = camelize(pluralize.singular(table)) + 'Id'
  }

  if (partialAssociation.type === 'BelongsTo' || !partialAssociation.through)
    checkForeignKey(foreignKey, computedForeignKey, dreamClass, partialAssociation)

  return computedForeignKey
}

export function foreignKeyTypeField(
  foreignKey: any,
  dream: typeof Dream,
  partialAssociation: PartialAssociationStatement
): string {
  return finalForeignKey(foreignKey, dream, partialAssociation).replace(/Id$/, 'Type')
}

export function modelCBtoSingleDreamClass(
  dreamClass: typeof Dream,
  partialAssociation: PartialAssociationStatement
): typeof Dream {
  if (Array.isArray(partialAssociation.modelCB()))
    throw new Error(
      `Polymorphic association ${partialAssociation.as} on model ${dreamClass.sanitizedName} requires an explicit foreignKey`
    )

  return partialAssociation.modelCB() as typeof Dream
}

export function applyGetterAndSetter(
  target: Dream,
  partialAssociation: PartialAssociationStatement,
  {
    foreignKeyBase,
    isBelongsTo,
  }: {
    foreignKeyBase?: string
    isBelongsTo?: boolean
  } = {}
) {
  const dreamPrototype = Object.getPrototypeOf(target)
  const dreamClass: typeof Dream = target.constructor as typeof Dream

  Object.defineProperty(dreamPrototype, partialAssociation.as, {
    configurable: true,

    get: function (this: Dream) {
      const value = (this as any)[associationToGetterSetterProp(partialAssociation)]
      if (value === undefined)
        throw new NonLoadedAssociation({ dreamClass, associationName: partialAssociation.as })
      else return value
    },

    set: function (this: Dream, associatedModel: any) {
      /**
       *
       * Modern Javascript sets all properties that do not have an explicit
       * assignment within the constructor to undefined in an implicit constructor.
       * Since the Dream constructor sets the value of properties of instances of
       * classes that extend Dream (e.g. when passing attributes to #new or #create
       * or when loading a model via one of the #find methods or #all), we need to
       * prevent those properties from being set back to undefined. Since all
       * properties corresponding to a database column get a setter, we achieve this
       * protection by including a guard in the setters that returns if this
       * property is set.
       *
       */

      if (this['columnSetterGuardActivated']) return
      ;(this as any)[associationToGetterSetterProp(partialAssociation)] = associatedModel

      if (isBelongsTo) {
        ;(this as any)[finalForeignKey(foreignKeyBase, dreamClass, partialAssociation)] =
          partialAssociation.primaryKeyValue(associatedModel)
        if (partialAssociation.polymorphic)
          (this as any)[foreignKeyTypeField(foreignKeyBase, dreamClass, partialAssociation)] =
            associatedModel?.['sanitizedConstructorName']
      }
    },
  })
}

export function associationPrimaryKeyAccessors(
  partialAssociation: Exclude<PartialAssociationStatement, 'primaryKey' | 'primaryKeyValue'>,
  dreamClass: typeof Dream
): PartialAssociationStatement {
  return {
    ...partialAssociation,

    primaryKey(associationInstance?: Dream) {
      if (this.primaryKeyOverride) return this.primaryKeyOverride
      if (associationInstance) return associationInstance.primaryKey

      const associationClass = this.modelCB()
      if (Array.isArray(associationClass)) {
        throw new Error(`
Cannot lookup primaryKey on polymorphic association:
dream class: ${dreamClass.sanitizedName}
association: ${this.as}
          `)
      }

      return associationClass.primaryKey
    },

    primaryKeyValue(associationInstance: Dream | null) {
      if (associationInstance === undefined) return undefined
      if (associationInstance === null) return null
      return (associationInstance as any)[this.primaryKey(associationInstance)]
    },
  }
}

export function validateHasStatementArgs({
  dreamClass,
  dependent,
  methodName,
  on,
}: {
  dreamClass: typeof Dream
  dependent: DependentOptions | null
  methodName: string
  on: object | null
}) {
  const hasPassthroughOn = Object.values(on || {}).find(val => val === DreamConst.passthrough)
  const hasRequiredOn = Object.values(on || {}).find(val => val === DreamConst.required)
  if (dependent && hasPassthroughOn)
    throw new CannotDefineAssociationWithBothDependentAndPassthrough(dreamClass, methodName)
  if (dependent && hasRequiredOn)
    throw new CannotDefineAssociationWithBothDependentAndRequiredOnClause(dreamClass, methodName)
}

// function hydratedSourceValue(dream: Dream | typeof Dream | undefined, sourceName: string) {
//   if (!dream) return
//   if (!sourceName) return
//   return (dream as any)[sourceName] || (dream as any)[singular(sourceName)]
// }
