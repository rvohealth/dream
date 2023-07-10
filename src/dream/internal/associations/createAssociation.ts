import { SyncedAssociations } from '../../../sync/associations'
import Dream from '../../../dream'
import DreamTransaction from '../../transaction'
import Query from '../../query'
import { DreamConstructorType, UpdateableFields } from '../../types'
import { HasManyStatement } from '../../../decorators/associations/has-many'
import { HasOneStatement } from '../../../decorators/associations/has-one'
import { BelongsToStatement } from '../../../decorators/associations/belongs-to'
import CannotCreateAssociationWithThroughContext from '../../../exceptions/cannot-create-association-with-through-context'

export default async function createAssociation<
  DreamInstance extends Dream,
  AssociationName extends keyof SyncedAssociations[DreamInstance['table']],
  PossibleArrayAssociationType = DreamInstance[AssociationName & keyof DreamInstance],
  AssociationType = PossibleArrayAssociationType extends (infer ElementType)[]
    ? ElementType
    : PossibleArrayAssociationType
>(
  dream: DreamInstance,
  txn: DreamTransaction | null = null,
  associationName: AssociationName,
  opts: UpdateableFields<AssociationType & typeof Dream> = {}
): Promise<NonNullable<AssociationType>> {
  const association = dream.associationMap[associationName] as
    | HasManyStatement<any>
    | HasOneStatement<any>
    | BelongsToStatement<any>

  if (association.modelCB().constructor === Array) {
    throw `
        Cannot create polymorphic associations using createAssociation
      `
  }
  const associationClass = association.modelCB() as typeof Dream

  switch (association.type) {
    case 'HasMany':
    case 'HasOne':
      if ((association as HasManyStatement<any>).through)
        throw new CannotCreateAssociationWithThroughContext({
          dreamClass: dream.constructor as typeof Dream,
          association,
        })

      let hasresult

      if (txn) {
        hasresult = await associationClass.txn(txn).create({
          [association.foreignKey()]: dream.primaryKeyValue,
          ...opts,
        })
      } else {
        hasresult = await associationClass.create({
          [association.foreignKey()]: dream.primaryKeyValue,
          ...opts,
        })
      }
      return hasresult! as unknown as NonNullable<AssociationType>

    case 'BelongsTo':
      let belongstoresult: AssociationType
      const fn = async (txn: DreamTransaction) => {
        belongstoresult = await (associationClass as any).txn(txn).create({
          ...opts,
        })
        await dream.txn(txn).update({
          [association.foreignKey() as any]: (belongstoresult as any).primaryKeyValue,
        })
      }

      if (txn) await fn(txn)
      else await Dream.transaction(fn)

      return belongstoresult! as unknown as NonNullable<AssociationType>
  }
}
