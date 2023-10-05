import { ExpressionBuilder } from 'kysely'
import db from '../../db'
import Dream from '../../dream'
import Query from '../../dream/query'
import DreamTransaction from '../../dream/transaction'
import range from '../../helpers/range'
import getForeignKeyForSortableScope from './getForeignKeyForSortableScope'
import sortableQueryExcludingDream from './sortableQueryExcludingDream'

export default async function setPosition({
  position,
  previousPosition,
  dream,
  positionField,
  scope,
  query,
}: {
  dream: Dream
  position: number
  previousPosition?: number
  positionField: string
  query: Query<typeof Dream>
  scope?: string
}) {
  if (position) {
    await setPositionFromValue({
      position,
      dream,
      positionField,
      scope,
      previousPosition,
      query,
    })
  } else {
    await setNewPosition({
      dream,
      positionField,
      scope,
      query,
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
}: {
  dream: Dream
  position: number
  previousPosition?: number
  positionField: string
  query: Query<typeof Dream>
  scope?: string
}) {
  const newPosition = position

  await (dream.constructor as typeof Dream).transaction(async txn => {
    await updateConflictingRecords({
      position,
      previousPosition,
      dream,
      positionField,
      query,
      scope,
      txn,
    })

    await updatePositionForRecord(txn, dream, positionField, newPosition, scope)
  })

  await dream.reload()
}

async function setNewPosition({
  dream,
  positionField,
  query,
  scope,
}: {
  dream: Dream
  positionField: string
  query: Query<typeof Dream>
  scope?: string
}) {
  const numConflictingRecords = await sortableQueryExcludingDream(dream, query, scope).count()

  await db('primary', dream.dreamconf)
    .updateTable(dream.table as any)
    .where(dream.primaryKey as any, '=', dream.primaryKeyValue)
    .set({
      [positionField]: numConflictingRecords + 1,
    })
    .execute()

  await dream.reload()
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
  position: number
  previousPosition?: number
  positionField: string
  query: Query<typeof Dream>
  scope?: string
  txn: DreamTransaction<any>
}) {
  const newPosition = position
  const increasing = previousPosition && previousPosition < newPosition

  let kyselyQuery = query
    .txn(txn)
    .whereNot({ [dream.primaryKey]: dream.primaryKeyValue as any })
    .where({
      [positionField]: increasing
        ? range(previousPosition, newPosition)
        : range(newPosition, previousPosition),
    })
    .toKysely('update')
    .set((eb: ExpressionBuilder<(typeof dream)['DB'], typeof dream.table>) => {
      return {
        [positionField]: eb(positionField, increasing ? '-' : '+', 1),
      }
    })

  const foreignKey = getForeignKeyForSortableScope(dream, scope)
  if (foreignKey) {
    kyselyQuery = kyselyQuery.where(foreignKey, '=', (dream as any)[foreignKey])
  }

  await kyselyQuery.execute()
}

async function updatePositionForRecord(
  txn: DreamTransaction<any>,
  dream: Dream,
  positionField: string,
  position: number,
  scope?: string
) {
  await txn.kyselyTransaction
    .updateTable(dream.table as any)
    .where(dream.primaryKey as any, '=', dream.primaryKeyValue)
    .set({
      [positionField]: position,
    })
    .execute()
}
