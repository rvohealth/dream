import { ExpressionBuilder, UpdateQueryBuilder } from 'kysely'
import db from '../../../db'
import Dream from '../../../dream'
import Query from '../../../dream/query'
import DreamTransaction from '../../../dream/transaction'
import range from '../../../helpers/range'
import ops from '../../../ops'
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

  await updatePreviousScope({
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
  txn,
}: {
  dream: Dream
  positionField: string
  query: Query<Dream>
  scope?: string | string[]
  txn?: DreamTransaction<any>
}) {
  const newPosition = (await sortableQueryExcludingDream(dream, query, scope).max(positionField)) + 1

  const dbOrTxn = txn ? txn.kyselyTransaction : db('primary', dream.dreamconf)
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
  query: Query<Dream>
  scope?: string | string[]
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
    .set((eb: ExpressionBuilder<(typeof dream)['dreamconf']['DB'], typeof dream.table>) => {
      return {
        [positionField]: eb(positionField, increasing ? '-' : '+', 1),
      }
    })

  kyselyQuery = applyScopesToQuery(dream, kyselyQuery, column => (dream as any)[column], scope)

  await kyselyQuery.execute()
}

// this function allows us to handle the case where, rather than a position being updated,
// an attribute or association that is tied to the scope is updated. In these contexts, A
// dream is now leaving the scope and entering a new one, in which case we need to make
// sure the previous scope is updated so that holes in the positioning are correctly adapted.
async function updatePreviousScope({
  position,
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
  txn: DreamTransaction<any>
}) {
  const savingChangeToScopeField = scopeArray(scope).filter(
    scopeField =>
      (!dream['getAssociationMetadata'](scopeField) && dream.savedChangeToAttribute(scopeField as any)) ||
      (dream['getAssociationMetadata'](scopeField) &&
        dream.savedChangeToAttribute(dream['getAssociationMetadata'](scopeField).foreignKey()))
  ).length

  if (dream.changes()[dream.primaryKey] && dream.changes()[dream.primaryKey]!.was === undefined) return
  if (!savingChangeToScopeField) return

  let kyselyQuery = query
    .txn(txn)
    .whereNot({ [dream.primaryKey]: dream.primaryKeyValue as any })
    .where({
      [positionField]: ops.greaterThan(position),
    })
    .toKysely('update')
    .set((eb: ExpressionBuilder<(typeof dream)['dreamconf']['DB'], typeof dream.table>) => {
      return {
        [positionField]: eb(positionField, '-', 1),
      }
    })

  const changes = dream.changes()
  kyselyQuery = applyScopesToQuery(
    dream,
    kyselyQuery,
    column => changes[column as any]?.was || (dream as any)[column],
    scope
  )

  await kyselyQuery.execute()
}

function applyScopesToQuery(
  dream: Dream,
  kyselyQuery: UpdateQueryBuilder<any, string, string, any>,
  whereValueCB: (column: string) => any,
  scope?: string | string[]
) {
  for (const singleScope of scopeArray(scope)) {
    const column = getColumnForSortableScope(dream, singleScope)
    if (column) {
      kyselyQuery = kyselyQuery.where(column, '=', whereValueCB(column))
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
