import Dream from '../../../dream'
import DreamTransaction from '../../transaction'
import { UpdateablePropertiesForAssociatedClass, UpdateablePropertiesForClass } from '../../types'
import { HasManyStatement } from '../../../decorators/associations/has-many'
import { HasOneStatement } from '../../../decorators/associations/has-one'
import { BelongsToStatement } from '../../../decorators/associations/belongs-to'
import CannotCreateAssociationWithThroughContext from '../../../exceptions/associations/cannot-create-association-with-through-context'
import { AssociationTableNames } from '../../../db/reflections'

export default async function createAssociation<
  DreamInstance extends Dream,
  SyncedAssociations extends DreamInstance['syncedAssociations'],
  AssociationName extends keyof SyncedAssociations[DreamInstance['table']],
  PossibleArrayAssociationType = DreamInstance[AssociationName & keyof DreamInstance],
  AssociationType = PossibleArrayAssociationType extends (infer ElementType)[]
    ? ElementType & typeof Dream
    : PossibleArrayAssociationType & typeof Dream,
  RestrictedAssociationType extends AssociationType extends Dream
    ? AssociationType
    : never = AssociationType extends Dream ? AssociationType : never,
>(
  dream: DreamInstance,
  txn: DreamTransaction<Dream> | null = null,
  associationName: AssociationName,
  opts: UpdateablePropertiesForAssociatedClass<DreamInstance, RestrictedAssociationType> = {} as any
): Promise<NonNullable<AssociationType>> {
  const association = dream.associationMap()[associationName as any] as
    | HasManyStatement<any, any, any, any>
    | HasOneStatement<any, any, any, any>
    | BelongsToStatement<any, any, any, any>

  if (Array.isArray(association.modelCB())) {
    throw new Error(`
        Cannot create polymorphic associations using createAssociation
      `)
  }
  const associationClass = association.modelCB() as typeof Dream

  switch (association.type) {
    case 'HasMany':
    case 'HasOne':
      if ((association as HasManyStatement<any, any, any, any>).through)
        throw new CannotCreateAssociationWithThroughContext({
          dreamClass: dream.constructor as typeof Dream,
          association,
        })

      let hasresult

      if (txn) {
        hasresult = await associationClass.txn(txn).create({
          [association.foreignKey()]: association.primaryKeyValue(dream),
          ...opts,
        })
      } else {
        hasresult = await associationClass.create({
          [association.foreignKey()]: association.primaryKeyValue(dream),
          ...opts,
        })
      }
      return hasresult! as unknown as NonNullable<AssociationType>

    case 'BelongsTo':
      let belongstoresult: AssociationType
      const fn = async (txn: DreamTransaction<Dream>) => {
        belongstoresult = await (associationClass as any).txn(txn).create({
          ...opts,
        })
        await dream.txn(txn).update({
          [association.foreignKey()]: association.primaryKeyValue(belongstoresult as any),
        } as any)
      }

      if (txn) await fn(txn)
      else await (dream.constructor as any).transaction(fn)

      return belongstoresult! as unknown as NonNullable<AssociationType>
  }
}
