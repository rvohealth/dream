import Dream from '../../../dream'
import DreamTransaction from '../../transaction'
import { UpdateablePropertiesForClass } from '../../types'
import { HasManyStatement } from '../../../decorators/associations/has-many'
import { HasOneStatement } from '../../../decorators/associations/has-one'
import CannotDestroyAssociationWithThroughContext from '../../../exceptions/associations/cannot-destroy-association-with-through-context'
import associationUpdateQuery from './associationUpdateQuery'

export default async function destroyAssociation<
  DreamInstance extends Dream,
  SyncedAssociations extends DreamInstance['syncedAssociations'],
  AssociationName extends keyof SyncedAssociations[DreamInstance['table']],
  PossibleArrayAssociationType = DreamInstance[AssociationName & keyof DreamInstance],
  AssociationType = PossibleArrayAssociationType extends (infer ElementType)[]
    ? ElementType
    : PossibleArrayAssociationType
>(
  dream: DreamInstance,
  txn: DreamTransaction<DreamInstance['DB']> | null = null,
  associationName: AssociationName,
  opts: UpdateablePropertiesForClass<AssociationType & typeof Dream> = {}
): Promise<number> {
  const association = dream.associationMap()[associationName] as
    | HasManyStatement<any, any, any>
    | HasOneStatement<any, any, any>

  const associationClass = association.modelCB()

  if (Array.isArray(associationClass)) {
    throw new Error(`
      Cannot destroy polymorphic associations using destroyAssociation
    `)
  }

  const query = associationUpdateQuery(dream, txn, associationName)
  return await query.where(opts as any).destroy()
}
