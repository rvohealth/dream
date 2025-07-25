import Dream from '../../../Dream.js'
import CannotCreateAssociationWithThroughContext from '../../../errors/associations/CannotCreateAssociationWithThroughContext.js'
import UnexpectedUndefined from '../../../errors/UnexpectedUndefined.js'
import { HasManyStatement } from '../../../types/associations/hasMany.js'
import { DreamAssociationNames, UpdateableAssociationProperties } from '../../../types/dream.js'
import DreamTransaction from '../../DreamTransaction.js'

export default async function createAssociation<
  DreamInstance extends Dream,
  AssociationName extends DreamAssociationNames<DreamInstance>,
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
  const association = dream['associationMetadataMap']()[associationName as any]
  if (association === undefined) throw new UnexpectedUndefined()

  if (Array.isArray(association.modelCB())) {
    throw new Error(`
        Cannot create polymorphic associations using createAssociation
      `)
  }
  const associationClass = association.modelCB() as typeof Dream
  let hasresult: unknown
  let belongstoresult: AssociationType
  let belongstoFn: (txn: DreamTransaction<Dream>) => Promise<void>

  const hasAssociation = association as HasManyStatement<any, any, any, any>
  let modifiedOpts: Record<string, any>
  switch (association.type) {
    case 'HasMany':
    case 'HasOne':
      if (hasAssociation.through)
        throw new CannotCreateAssociationWithThroughContext({
          dreamClass: dream.constructor as typeof Dream,
          association,
        })

      modifiedOpts = {
        [association.foreignKey()]: association.primaryKeyValue(dream),
        ...opts,
      }
      if (hasAssociation.polymorphic) {
        modifiedOpts[hasAssociation.foreignKeyTypeField()] = dream.referenceTypeString
      }

      hasresult = await associationClass.txn(txn).create(modifiedOpts)

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
