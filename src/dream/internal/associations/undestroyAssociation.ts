import { SortableCascadeEdge } from '../../../decorators/field/sortable/helpers/sortableCascadeEdge.js'
import SortableScopeRestoreBatch from '../../../decorators/field/sortable/helpers/sortableScopeRestoreBatch.js'
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

  const restoreBatch =
    sortableCascadeEdge && txn ? new SortableScopeRestoreBatch(sortableCascadeEdge, txn) : null

  const restoredCount = await query
    .clone({ sortableRestoreBatch: restoreBatch })
    .undestroy({ skipHooks, cascade })

  // Every row the restore above put into a sort scope it positions optimistically
  // is live with a NULL position until here, where each of those scopes is
  // renumbered by one idempotent whole-scope statement — one per scope, however
  // many rows landed in it, which is the cost this path exists to avoid paying
  // per record.
  //
  // **This placement is only safe because of clause 3 of
  // `cascadeCoversWholeSortScope`**: a sortable field is restored optimistically
  // only when this edge's foreign key is one of that field's sort scope columns,
  // which makes this association's children *exactly* the rows of the scopes they
  // occupy. Nothing restored later — a sibling association, a shallower level of
  // the cascade, the cascade root itself — can add a row to a scope renumbered
  // here, because any such row would have carried this foreign key and so would
  // already have been in the set above. Relax that clause to admit a `HasOne`, a
  // polymorphic edge, an STI child, or a scope sharing no column with the edge,
  // and this line renumbers a scope before all of its rows have arrived: a
  // duplicate position aborting at COMMIT, or a gap.
  //
  // After the whole `undestroy` above and never inside it. `Query#undestroy`
  // walks primary-key-ascending batches and awaits each record's own undestroy,
  // which cascades to that record's own descendants before restoring the record
  // itself, so by the time it returns every row this call reached — at any depth
  // — has been restored and collected. A flush per record would instead renumber
  // a half-restored scope once per row.
  await restoreBatch?.flush()

  return restoredCount
}
