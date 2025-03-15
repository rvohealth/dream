import Dream from '../../Dream.js'
import MissingDeletedAtFieldForSoftDelete from '../../errors/MissingDeletedAtFieldForSoftDelete.js'
import DateTime from '../../helpers/DateTime.js'
import isDateTimeColumn from '../../helpers/db/types/isDateTimeColumn.js'
import DreamTransaction from '../DreamTransaction.js'

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
