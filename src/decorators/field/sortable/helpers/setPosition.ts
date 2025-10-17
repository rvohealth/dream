import { ExpressionBuilder, SelectQueryBuilder, UpdateQueryBuilder } from 'kysely'
import DreamApp from '../../../../dream-app/index.js'
import Dream from '../../../../Dream.js'
import DreamTransaction from '../../../../dream/DreamTransaction.js'
import Query from '../../../../dream/Query.js'
import PostgresQueryDriver from '../../../../dream/QueryDriver/Postgres.js'
import range from '../../../../helpers/range.js'
import { SortableCache } from '../hooks/beforeSortableSave.js'
import getColumnForSortableScope from './getColumnForSortableScope.js'
import scopeArray from './scopeArray.js'
import validPosition from './validPosition.js'

interface SortableCacheWithOptionalTransaction extends SortableCache {
  dream: Dream
  positionField: string
  query: Query<Dream>
  scope: string | string[] | undefined
  txn?: DreamTransaction<any> | undefined
}
export interface SortableCacheWithRequiredTransaction extends SortableCacheWithOptionalTransaction {
  txn: DreamTransaction<any>
}

interface SortableCacheWithRequiredTransactionAndRequiredPosition
  extends SortableCacheWithRequiredTransaction {
  position: number
}

export default async function setPosition(obj: SortableCacheWithOptionalTransaction) {
  const { dream, txn } = obj

  if (txn) {
    await applyUpdates({ ...obj, txn })
    await dream.txn(txn).reload()
  } else {
    await (dream.constructor as typeof Dream).transaction(async txn => {
      await applyUpdates({ ...obj, txn })
      await dream.txn(txn).reload()
    })
  }
}

async function applyUpdates(obj: SortableCacheWithRequiredTransaction) {
  const position = await validPosition(obj)
  await updateConflictingRecords({ ...obj, position })
  await updatePositionForRecord({ ...obj, position })
}

async function updateConflictingRecords(obj: SortableCacheWithRequiredTransactionAndRequiredPosition) {
  const { wasNewRecord, position, previousPosition, dream, positionField, query, scope, txn, changingScope } =
    obj
  const increasing =
    changingScope ||
    position === undefined ||
    (previousPosition !== undefined && previousPosition !== null && previousPosition < position)

  let kyselyQuery = query
    .txn(txn)
    .whereNot({ [dream['_primaryKey']]: dream.primaryKeyValue() })
    .where({
      [positionField]: increasing ? range(previousPosition, position) : range(position, previousPosition),
    })
    .toKysely('update')
    .set((eb: ExpressionBuilder<(typeof dream)['DB'], typeof dream.table>) => ({
      [positionField]: eb(positionField, increasing ? '-' : '+', 1),
    }))

  kyselyQuery = applySortableScopesToQuery(
    dream,
    kyselyQuery,
    column =>
      !wasNewRecord && dream.savedChangeToAttribute(column)
        ? (dream.changes()[column]?.was ?? (dream as any)[column])
        : (dream as any)[column],
    scope
  )

  await kyselyQuery.execute()
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

async function updatePositionForRecord(obj: SortableCacheWithRequiredTransactionAndRequiredPosition) {
  const { txn, dream, positionField, position } = obj

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
