import { ExpressionBuilder, SelectQueryBuilder, UpdateQueryBuilder } from 'kysely'
import db from '../../../../db/index.js'
import Dream from '../../../../Dream.js'
import DreamTransaction from '../../../../dream/DreamTransaction.js'
import Query from '../../../../dream/Query.js'
import range from '../../../../helpers/range.js'
import getColumnForSortableScope from './getColumnForSortableScope.js'
import scopeArray from './scopeArray.js'
import sortableQueryExcludingDream from './sortableQueryExcludingDream.js'

export default async function setPosition({
  position,
  previousPosition,
  dream,
  positionField,
  scope,
  query,
  txn,
}: {
  dream: Dream
  position: number
  previousPosition?: number
  positionField: string
  query: Query<Dream>
  scope: string | string[] | undefined
  txn: DreamTransaction<any> | undefined
}) {
  if (position) {
    await setPositionFromValue({
      position,
      dream,
      positionField,
      scope,
      previousPosition,
      query,
      txn,
    })
  } else {
    await setNewPosition({
      dream,
      positionField,
      scope,
      previousPosition,
      query,
      txn,
    })
  }
}

async function setPositionFromValue({
  position,
  previousPosition,
  dream,
  positionField,
  query,
  scope,
  txn,
}: {
  dream: Dream
  position: number
  previousPosition?: number | undefined
  positionField: string
  query: Query<Dream>
  scope: string | string[] | undefined
  txn: DreamTransaction<any> | undefined
}) {
  const newPosition = position

  if (txn) {
    await applyUpdates({
      position,
      previousPosition,
      dream,
      positionField,
      query,
      scope,
      txn,
      newPosition,
    })
  } else {
    await (dream.constructor as typeof Dream).transaction(async txn => {
      await applyUpdates({
        position,
        previousPosition,
        dream,
        positionField,
        query,
        scope,
        txn,
        newPosition,
      })
    })
  }

  if (txn) {
    await dream.txn(txn).reload()
  } else {
    await dream.reload()
  }
}

async function applyUpdates({
  position,
  previousPosition,
  dream,
  positionField,
  query,
  scope,
  txn,
  newPosition,
}: {
  dream: Dream
  position: number
  previousPosition?: number | undefined
  positionField: string
  query: Query<Dream>
  scope: string | string[] | undefined
  txn: DreamTransaction<any>
  newPosition: number
}) {
  await updateConflictingRecords({
    position,
    previousPosition,
    dream,
    positionField,
    query,
    scope,
    txn,
  })

  await updatePositionForRecord(txn, dream, positionField, newPosition)
}

async function setNewPosition({
  dream,
  positionField,
  query,
  scope,
  previousPosition,
  txn,
}: {
  dream: Dream
  positionField: string
  query: Query<Dream>
  scope: string | string[] | undefined
  previousPosition?: number | undefined
  txn: DreamTransaction<any> | undefined
}) {
  const newPosition = (await sortableQueryExcludingDream(dream, query, scope).max(positionField)) + 1

  const dbOrTxn = txn ? txn.kyselyTransaction : db('primary')
  await dbOrTxn
    .updateTable(dream.table as any)
    .where(dream['_primaryKey'], '=', dream.primaryKeyValue())
    .set({
      [positionField]: newPosition,
    })
    .execute()

  if (txn) {
    await dream.txn(txn).reload()
  } else {
    await dream.reload()
  }

  if (txn) {
    await updateConflictingRecords({
      previousPosition,
      dream,
      positionField,
      query,
      scope,
      txn,
    })
  } else {
    await (dream.constructor as typeof Dream).transaction(async txn => {
      await updateConflictingRecords({
        previousPosition,
        dream,
        positionField,
        query,
        scope,
        txn,
      })
    })
  }
}

async function updateConflictingRecords({
  position,
  previousPosition,
  dream,
  positionField,
  query,
  scope,
  txn,
}: {
  dream: Dream
  position?: number | undefined
  previousPosition?: number | undefined
  positionField: string
  query: Query<Dream>
  scope: string | string[] | undefined
  txn: DreamTransaction<any>
}) {
  const newPosition = position
  if (newPosition === undefined && previousPosition === undefined) return
  const increasing =
    newPosition === undefined || (previousPosition !== undefined && previousPosition < newPosition)

  let kyselyQuery = query
    .txn(txn)
    .whereNot({ [dream['_primaryKey']]: dream.primaryKeyValue() })
    .where({
      [positionField]: increasing
        ? range(previousPosition!, newPosition)
        : range(newPosition, previousPosition),
    })
    .toKysely('update')
    .set((eb: ExpressionBuilder<(typeof dream)['DB'], typeof dream.table>) => ({
      [positionField]: eb(positionField, increasing ? '-' : '+', 1),
    }))

  kyselyQuery = applySortableScopesToQuery(
    dream,
    kyselyQuery,
    column =>
      dream.savedChangeToAttribute(column)
        ? (dream.changes()[column]?.was ?? (dream as any)[column])
        : (dream as any)[column],
    scope
  )

  await kyselyQuery.execute()
}

export function applySortableScopesToQuery<
  QB extends UpdateQueryBuilder<any, string, string, any> | SelectQueryBuilder<any, any, any>,
>(dream: Dream, kyselyQuery: QB, whereValueCB: (column: string) => any, scope?: string | string[]): QB {
  for (const singleScope of scopeArray(scope)) {
    const column = getColumnForSortableScope(dream, singleScope)
    if (column) {
      kyselyQuery = (kyselyQuery as UpdateQueryBuilder<any, string, string, any>).where(
        column,
        '=',
        whereValueCB(column)
      ) as QB
    }
  }

  return kyselyQuery
}

async function updatePositionForRecord(
  txn: DreamTransaction<any>,
  dream: Dream,
  positionField: string,
  position: number
) {
  await txn.kyselyTransaction
    .updateTable(dream.table as any)
    .where(dream['_primaryKey'], '=', dream.primaryKeyValue())
    .set({
      [positionField]: position,
    })
    .execute()
}
