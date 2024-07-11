import { DateTime } from 'luxon'
import Dream from '../../dream'
import MissingDeletedAtFieldForSoftDelete from '../../exceptions/missing-deleted-at-field-for-soft-delete'
import isDateTimeColumn from '../../helpers/db/types/isDateTimeColumn'
import DreamTransaction from '../transaction'

export default async function softDeleteDream(dream: Dream, txn: DreamTransaction<any>) {
  const deletedAtField = dream.deletedAtField
  const dreamClass = dream.constructor as typeof Dream

  if (!isDateTimeColumn(dreamClass, deletedAtField)) {
    throw new MissingDeletedAtFieldForSoftDelete(dream.constructor as typeof Dream)
  }

  let query = txn.kyselyTransaction
    .updateTable(dream.table)
    .where(dream.primaryKey, '=', dream.primaryKeyValue)
    .set(dream.deletedAtField, DateTime.now())

  dreamClass['sortableFields']?.forEach(sortableFieldMetadata => {
    const positionColumn = sortableFieldMetadata.positionField
    query = query.set(positionColumn, null)
  })

  await query.execute()
}
