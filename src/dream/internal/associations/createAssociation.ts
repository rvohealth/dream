import Dream from '../../../dream'
import DreamTransaction from '../../transaction'
import { DreamConstructorType, UpdateablePropertiesForClass } from '../../types'
import { HasManyStatement } from '../../../decorators/associations/has-many'
import { HasOneStatement } from '../../../decorators/associations/has-one'
import { BelongsToStatement } from '../../../decorators/associations/belongs-to'
import CannotCreateAssociationWithThroughContext from '../../../exceptions/associations/cannot-create-association-with-through-context'

export default async function createAssociation<
  DreamInstance extends Dream,
  SyncedAssociations extends DreamInstance['syncedAssociations'],
  AssociationName extends keyof SyncedAssociations[DreamInstance['table']],
  PossibleArrayAssociationType = DreamInstance[AssociationName & keyof DreamInstance],
  AssociationType = PossibleArrayAssociationType extends (infer ElementType)[]
    ? ElementType
    : PossibleArrayAssociationType
>(
  dream: DreamInstance,
  txn: DreamTransaction<DreamConstructorType<DreamInstance>> | null = null,
  associationName: AssociationName,
  opts: UpdateablePropertiesForClass<AssociationType & typeof Dream> = {}
): Promise<NonNullable<AssociationType>> {
  const association = dream.associationMap()[associationName] as
    | HasManyStatement<any, any, any>
    | HasOneStatement<any, any, any>
    | BelongsToStatement<any, any, any>

  if (Array.isArray(association.modelCB())) {
    throw `
        Cannot create polymorphic associations using createAssociation
      `
  }
  const associationClass = association.modelCB() as typeof Dream

  switch (association.type) {
    case 'HasMany':
    case 'HasOne':
      if ((association as HasManyStatement<any, any, any>).through)
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
      const fn = async (txn: DreamTransaction<DreamConstructorType<DreamInstance>>) => {
        belongstoresult = await (associationClass as any).txn(txn).create({
          ...opts,
        })
        await dream.txn(txn).update({
          [association.foreignKey() as any]: (belongstoresult as any).primaryKeyValue,
        })
      }

      if (txn) await fn(txn)
      else await (dream.constructor as any).transaction(fn)

      return belongstoresult! as unknown as NonNullable<AssociationType>
  }
}
