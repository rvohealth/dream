import Dream from '../../Dream.js'
import MissingDeletedAtFieldForSoftDelete from '../../errors/MissingDeletedAtFieldForSoftDelete.js'
import isDatetimeOrDatetimeArrayColumn from '../../helpers/db/types/isDatetimeOrDatetimeArrayColumn.js'
import { DateTime } from '../../utils/datetime/DateTime.js'
import DreamTransaction from '../DreamTransaction.js'

/**
 * @internal
 *
 * @returns the number of rows soft deleted — zero when the row is already gone,
 *   and zero when it is already soft deleted
 */
export default async function softDeleteDream(dream: Dream, txn: DreamTransaction<any>): Promise<number> {
  const deletedAtField = dream['_deletedAtField']
  const dreamClass = dream.constructor as typeof Dream

  if (!isDatetimeOrDatetimeArrayColumn(dreamClass, deletedAtField)) {
    throw new MissingDeletedAtFieldForSoftDelete(dream.constructor as typeof Dream)
  }

  // An already soft deleted row is logically gone, and this UPDATE is what
  // reports the deletion to the caller: matching such a row again would rewrite
  // its `deletedAt` and count a deletion this destroy did not perform, running
  // the after-destroy hooks a second time on a record nothing happened to.
  let query = txn.kyselyTransaction
    .updateTable(dream.table)
    .where(dream['_primaryKey'], '=', dream.primaryKeyValue())
    .where(deletedAtField, 'is', null)
    .set(dream['_deletedAtField'], DateTime.now())

  dreamClass['sortableFields']?.forEach(sortableFieldMetadata => {
    const positionColumn = sortableFieldMetadata.positionField
    query = query.set(positionColumn, null)
  })

  const results = await query.execute()
  return Number(results[0]?.numUpdatedRows ?? 0)
}
