import { UpdateQueryBuilder } from 'kysely'
import { DateTime } from 'luxon'
import db from '../../db'
import Dream from '../../dream'
import MissingDeletedAtFieldForSoftDelete from '../../exceptions/missing-deleted-at-field-for-soft-delete'
import isDateTimeColumn from '../../helpers/db/types/isDateTimeColumn'
import DreamTransaction from '../transaction'

export default async function softDeleteDream(dream: Dream, txn: DreamTransaction<any> | null) {
  const deletedAtField = dream.deletedAtField
  const dreamClass = dream.constructor as typeof Dream

  if (!isDateTimeColumn(dreamClass, deletedAtField)) {
    throw new MissingDeletedAtFieldForSoftDelete(dream.constructor as typeof Dream)
  }

  const query = txn
    ? buildSoftDeleteQuery(
        dream,
        txn.kyselyTransaction.updateTable(dream.table).where(dream.primaryKey, '=', dream.primaryKeyValue)
      )
    : buildSoftDeleteQuery(
        dream,
        db('primary', dream.dreamconf)
          .updateTable(dream.table)
          .where(dream.primaryKey, '=', dream.primaryKeyValue)
      )
  await query.execute()

  dream.preventDeletion()
}

function buildSoftDeleteQuery(dream: Dream, query: UpdateQueryBuilder<any, any, any, any>) {
  query = query.set(dream.deletedAtField, DateTime.now())

  const dreamClass = dream.constructor as typeof Dream

  dreamClass['sortableFields']?.forEach(sortableFieldMetadata => {
    const positionColumn = sortableFieldMetadata.positionField
    query = query.set(positionColumn, null)
  })

  return query
}
