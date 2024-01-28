import Dream from '../../../dream'
import DreamTransaction from '../../transaction'
import { UpdateablePropertiesForClass } from '../../types'
import associationUpdateQuery from './associationUpdateQuery'

// @reduce-type-complexity
// export default async function destroyAssociation<
//   DreamInstance extends Dream,
//   SyncedAssociations extends DreamInstance['syncedAssociations'],
//   AssociationName extends keyof SyncedAssociations[DreamInstance['table']],
//   PossibleArrayAssociationType = DreamInstance[AssociationName & keyof DreamInstance],
//   AssociationType = PossibleArrayAssociationType extends (infer ElementType)[]
//     ? ElementType
//     : PossibleArrayAssociationType
// >(
//   dream: DreamInstance,
//   txn: DreamTransaction<DreamInstance['DB']> | null = null,
//   associationName: AssociationName,
//   opts: UpdateablePropertiesForClass<AssociationType & typeof Dream> = {}
// ): Promise<number> {
export default async function destroyAssociation(
  dream: any,
  txn: any = null,
  associationName: any,
  opts: any = {}
): Promise<number> {
  const query = associationUpdateQuery(dream, txn, associationName)
  return await query.where(opts as any).destroy()
}
