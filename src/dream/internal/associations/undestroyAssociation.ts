import { SortableCascadeEdge } from '../../../decorators/field/sortable/helpers/sortableCascadeEdge.js'
import Dream from '../../../Dream.js'
import { AssociationNameToDream, DreamAssociationNames, JoinAndStatements } from '../../../types/dream.js'
import DreamTransaction from '../../DreamTransaction.js'
import associationUpdateQuery from './associationUpdateQuery.js'

/**
 * @param sortableCascadeEdge - the association a `dependent: 'destroy'` cascade
 *   is restoring through, or null when this is a consumer's own
 *   `undestroyAssociation` call. Only the cascade passes one, and it is what
 *   lets each restored record's sortable work tell a cascaded undestroy from a
 *   direct one.
 */
export default async function undestroyAssociation<
  DreamInstance extends Dream,
  DB extends DreamInstance['DB'],
  Schema extends DreamInstance['schema'],
  AssociationName extends DreamAssociationNames<DreamInstance>,
  AssociationDream extends AssociationNameToDream<DreamInstance, AssociationName>,
  AssociationTableName extends AssociationDream['table'],
>(
  dream: DreamInstance,
  txn: DreamTransaction<Dream> | null = null,
  associationName: AssociationName,
  {
    joinAndStatements,
    bypassAllDefaultScopes,
    defaultScopesToBypass,
    cascade,
    skipHooks,
  }: {
    joinAndStatements: JoinAndStatements<AssociationDream, DB, Schema, AssociationTableName, null>
    bypassAllDefaultScopes: boolean
    defaultScopesToBypass: string[]
    cascade: boolean
    skipHooks: boolean
  },
  sortableCascadeEdge: SortableCascadeEdge | null = null
): Promise<number> {
  const query = associationUpdateQuery(dream, txn, associationName, {
    joinAndStatements,
    bypassAllDefaultScopes,
    defaultScopesToBypass,
  })

  return await query.clone({ sortableCascadeEdge }).undestroy({ skipHooks, cascade })
}
