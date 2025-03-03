import { ExpressionBuilder, SelectQueryBuilder, UpdateQueryBuilder } from 'kysely'
import db from '../../../db'
import Dream from '../../../Dream'
import DreamTransaction from '../../../dream/DreamTransaction'
import Query from '../../../dream/Query'
import range from '../../../helpers/range'
import getColumnForSortableScope from './getColumnForSortableScope'
import scopeArray from './scopeArray'
import sortableQueryExcludingDream from './sortableQueryExcludingDream'

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
  scope?: string | string[]
  txn?: DreamTransaction<any>
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
  previousPosition?: number
  positionField: string
  query: Query<Dream>
  scope?: string | string[]
  txn?: DreamTransaction<any>
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
  previousPosition?: number
  positionField: string
  query: Query<Dream>
  scope?: string | string[]
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
  scope?: string | string[]
  previousPosition?: number
  txn?: DreamTransaction<any>
}) {
  const newPosition = (await sortableQueryExcludingDream(dream, query, scope).max(positionField)) + 1

  const dbOrTxn = txn ? txn.kyselyTransaction : db('primary')
  await dbOrTxn
    .updateTable(dream.table as any)
    .where(dream.primaryKey as any, '=', dream.primaryKeyValue)
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
  position?: number
  previousPosition?: number
  positionField: string
  query: Query<Dream>
  scope?: string | string[]
  txn: DreamTransaction<any>
}) {
  const newPosition = position
  if (newPosition === undefined && previousPosition === undefined) return
  const increasing =
    newPosition === undefined || (previousPosition !== undefined && previousPosition < newPosition)

  let kyselyQuery = query
    .txn(txn)
    .whereNot({ [dream.primaryKey]: dream.primaryKeyValue as any })
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
        whereValueCB(column) ?? null
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
    .where(dream.primaryKey as any, '=', dream.primaryKeyValue)
    .set({
      [positionField]: position,
    })
    .execute()
}
