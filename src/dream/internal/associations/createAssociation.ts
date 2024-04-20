import Dream from '../../../dream'
import DreamTransaction from '../../transaction'
import { UpdateableAssociationProperties } from '../../types'
import { HasManyStatement } from '../../../decorators/associations/has-many'
import { HasOneStatement } from '../../../decorators/associations/has-one'
import { BelongsToStatement } from '../../../decorators/associations/belongs-to'
import CannotCreateAssociationWithThroughContext from '../../../exceptions/associations/cannot-create-association-with-through-context'

export default async function createAssociation<
  DreamInstance extends Dream,
  Schema extends DreamInstance['dreamconf']['schema'],
  AssociationName extends keyof Schema[DreamInstance['table']]['associations' &
    keyof Schema[DreamInstance['table']]],
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
  opts: UpdateableAssociationProperties<DreamInstance, RestrictedAssociationType> = {} as any
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
  let hasresult: unknown
  let belongstoresult: AssociationType
  let belongstoFn: (txn: DreamTransaction<Dream>) => Promise<void>

  switch (association.type) {
    case 'HasMany':
    case 'HasOne':
      if ((association as HasManyStatement<any, any, any, any>).through)
        throw new CannotCreateAssociationWithThroughContext({
          dreamClass: dream.constructor as typeof Dream,
          association,
        })

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
      return hasresult! as NonNullable<AssociationType>

    case 'BelongsTo':
      belongstoFn = async (txn: DreamTransaction<Dream>) => {
        belongstoresult = await (associationClass as any).txn(txn).create({
          ...opts,
        })
        await dream.txn(txn).update({
          [association.foreignKey()]: association.primaryKeyValue(belongstoresult as any),
        } as any)
      }

      if (txn) await belongstoFn(txn)
      else await (dream.constructor as any).transaction(belongstoFn)

      return belongstoresult! as unknown as NonNullable<AssociationType>
  }
}
