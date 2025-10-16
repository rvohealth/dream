import { ExpressionBuilder, SelectQueryBuilder, sql, UpdateQueryBuilder } from 'kysely'
import DreamApp from '../../../../dream-app/index.js'
import Dream from '../../../../Dream.js'
import DreamTransaction from '../../../../dream/DreamTransaction.js'
import Query from '../../../../dream/Query.js'
import PostgresQueryDriver from '../../../../dream/QueryDriver/Postgres.js'
import range from '../../../../helpers/range.js'
import snakeify from '../../../../helpers/snakeify.js'
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
  await updatePositionForRecord(txn, dream, positionField, newPosition)

  await updateConflictingRecords({
    position,
    previousPosition,
    dream,
    positionField,
    query,
    scope,
    txn,
  })
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

  const queryDriverClass = getPostgresQueryDriver(dream.connectionName || 'default')

  const dbOrTxn = txn
    ? txn.kyselyTransaction
    : queryDriverClass.dbFor(dream.connectionName || 'default', 'primary')

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
  const positionRange = increasing
    ? range(previousPosition!, newPosition)
    : range(newPosition, previousPosition)

  const shiftOperator = previousPosition === null && newPosition !== undefined ? '+' : increasing ? '-' : '+'
  const primaryKeyField = (dream.constructor as typeof Dream).primaryKey

  let kyselyQuery = query
    .txn(txn)
    .whereNot({ [primaryKeyField]: dream.primaryKeyValue() })
    .where({ [positionField]: positionRange })
    .toKysely('update')
    .set((eb: ExpressionBuilder<(typeof dream)['DB'], typeof dream.table>) => ({
      [positionField]: eb(positionField, shiftOperator, 1),
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

  await shiftNullRecords({
    position,
    positionField,
    dream,
    query,
    scope,
    txn,
  })
}

async function shiftNullRecords({
  position,
  dream,
  positionField,
  query,
  scope,
  txn,
}: {
  dream: Dream
  position?: number | undefined
  positionField: string
  query: Query<Dream>
  scope: string | string[] | undefined
  txn: DreamTransaction<any>
}) {
  const newPosition = position
  if (!newPosition) return

  const primaryKeyField = (dream.constructor as typeof Dream).primaryKey
  const basePosition = Math.max((await query.txn(txn).max(positionField)) || 0, newPosition)
  const dbOrTxn = txn.kyselyTransaction

  const orderingField = dream.columns().has(dream['_createdAtField'])
    ? snakeify(dream['_createdAtField'])
    : primaryKeyField

  await dbOrTxn
    .with('numbered_nulls', db => {
      const subquery = db
        .selectFrom(dream.table as any)
        .select([
          sql.raw(primaryKeyField).as(primaryKeyField),
          sql`ROW_NUMBER() OVER (ORDER BY ${sql.raw(orderingField)})`.as('row_num'),
        ])
        .where(snakeify(positionField), 'is', null)
        .where(primaryKeyField, '!=', dream.primaryKeyValue())

      return applySortableScopesToQuery(
        dream,
        subquery,
        column =>
          dream.savedChangeToAttribute(column)
            ? (dream.changes()[column]?.was ?? (dream as any)[column])
            : (dream as any)[column],
        scope
      )
    })
    .updateTable(dream.table as any)
    .set({
      [positionField]: sql`${basePosition} + nn.row_num`,
    })
    .from('numbered_nulls as nn')
    .whereRef(`${dream.table}.${primaryKeyField}`, '=', 'nn.id')
    .execute()
}

export function applySortableScopesToQuery<
  QB extends UpdateQueryBuilder<any, any, any, any> | SelectQueryBuilder<any, any, any>,
>(dream: Dream, kyselyQuery: QB, whereValueCB: (column: string) => any, scope?: string | string[]): QB {
  for (const singleScope of scopeArray(scope)) {
    const column = getColumnForSortableScope(dream, singleScope)
    if (column) {
      const columnValue = whereValueCB(column)
      if (columnValue === null) {
        kyselyQuery = (kyselyQuery as UpdateQueryBuilder<any, string, string, any>).where(
          column,
          'is',
          null
        ) as QB
      } else {
        kyselyQuery = (kyselyQuery as UpdateQueryBuilder<any, string, string, any>).where(
          column,
          '=',
          columnValue
        ) as QB
      }
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

export function getPostgresQueryDriver(connectionName: string): typeof PostgresQueryDriver {
  const queryDriverClass = DreamApp.getOrFail().dbConnectionQueryDriverClass(connectionName)
  if (!(queryDriverClass === PostgresQueryDriver)) {
    throw new Error(`
      ${queryDriverClass.name} is not an instance of PostgresQueryDriver.
      You must be using the PostgresQueryDriver when leveraging the Sortable decorator
      `)
  }

  return queryDriverClass as typeof PostgresQueryDriver
}
