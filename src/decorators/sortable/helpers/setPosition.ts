import { ExpressionBuilder, SelectQueryBuilder, UpdateQueryBuilder } from 'kysely'
import db from '../../../db'
import Dream from '../../../Dream'
import DreamTransaction from '../../../dream/DreamTransaction'
import Query from '../../../dream/Query'
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
  query,
  onlySavingChangeToScopeField,
  scope,
  txn,
}: {
  dream: Dream
  position: number
  previousPosition?: number
  positionField: string
  query: Query<Dream>
  onlySavingChangeToScopeField: boolean
  scope?: string | string[]
  txn?: DreamTransaction<any>
}) {
  console.log('UPDATING POSITION', position)
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
    if (txn) {
      await setNewPosition({
        dream,
        positionField,
        scope,
        query,
        onlySavingChangeToScopeField,
        txn,
      })
    } else {
      await (dream.constructor as typeof Dream).transaction(async txn => {
        await setNewPosition({
          dream,
          positionField,
          scope,
          query,
          onlySavingChangeToScopeField,
          txn,
        })
      })
    }
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
  onlySavingChangeToScopeField,
  scope,
  txn,
}: {
  dream: Dream
  positionField: string
  query: Query<Dream>
  onlySavingChangeToScopeField: boolean
  txn: DreamTransaction<any>
  scope?: string | string[]
}) {
  const newPosition = (await sortableQueryExcludingDream(dream, query, scope).max(positionField)) + 1

  if (onlySavingChangeToScopeField) {
    await updatePreviousScope({
      position: newPosition,
      previousPosition: dream.changes()[positionField]?.was || (dream as any)[positionField],
      dream,
      positionField,
      query,
      scope,
      txn,
    })
  }

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
    .set((eb: ExpressionBuilder<(typeof dream)['DB'], typeof dream.table>) => ({
      [positionField]: eb(positionField, increasing ? '-' : '+', 1),
    }))

  kyselyQuery = applySortableScopesToQuery(dream, kyselyQuery, column => (dream as any)[column], scope)

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
    .set((eb: ExpressionBuilder<(typeof dream)['DB'], typeof dream.table>) => {
      return {
        [positionField]: eb(positionField, '-', 1),
      }
    })

  const changes = dream.changes()
  kyselyQuery = applySortableScopesToQuery(
    dream,
    kyselyQuery,
    column => changes[column as any]?.was || (dream as any)[column],
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
    .where(dream.primaryKey as any, '=', dream.primaryKeyValue)
    .set({
      [positionField]: position,
    })
    .execute()
}
