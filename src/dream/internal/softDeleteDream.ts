import Dream from '../../Dream.js'
import MissingDeletedAtFieldForSoftDelete from '../../errors/MissingDeletedAtFieldForSoftDelete.js'
import isDatetimeOrDatetimeArrayColumn from '../../helpers/db/types/isDatetimeOrDatetimeArrayColumn.js'
import { DateTime } from '../../utils/datetime/DateTime.js'
import DreamTransaction from '../DreamTransaction.js'

export default async function softDeleteDream(dream: Dream, txn: DreamTransaction<any>) {
  const deletedAtField = dream['_deletedAtField']
  const dreamClass = dream.constructor as typeof Dream

  if (!isDatetimeOrDatetimeArrayColumn(dreamClass, deletedAtField)) {
    throw new MissingDeletedAtFieldForSoftDelete(dream.constructor as typeof Dream)
  }

  let query = txn.kyselyTransaction
    .updateTable(dream.table)
    .where(dream['_primaryKey'], '=', dream.primaryKeyValue())
    .set(dream['_deletedAtField'], DateTime.now())

  dreamClass['sortableFields']?.forEach(sortableFieldMetadata => {
    const positionColumn = sortableFieldMetadata.positionField
    query = query.set(positionColumn, null)
  })

  await query.execute()
}
