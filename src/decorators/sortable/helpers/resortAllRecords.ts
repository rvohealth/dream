import { ExpressionBuilder, UpdateQueryBuilder, sql } from 'kysely'
import Dream from '../../../dream'
import Query from '../../../dream/query'
import ops from '../../../ops'
import getForeignKeyForSortableScope from './getForeignKeyForSortableScope'
import scopeArray from './scopeArray'

export default async function resortAllRecords(
  dreamClass: typeof Dream,
  positionField: string,
  scope?: string | string[]
) {
  const dreams = await dreamClass.order(positionField, 'asc').all()
  const hash: any = {}
  for (const dream of dreams) {
    const foreignKeys = foreignKeysForScope(dream, scope)
    hash[foreignKeys.join(':')] ||= []
    hash[foreignKeys.join(':')].push(dream)
  }

  for (const dreamArr of Object.values(hash)) {
    const dreams = dreamArr as Dream[]
    await dreamClass.transaction(async txn => {
      let counter = 1
      for (const dream of dreams) {
        await dreamClass
          // @ts-ignore
          .where({ [dream.primaryKey]: dream.primaryKeyValue })
          .toKysely('update')
          .set({
            [positionField]: counter++,
          })
          .execute()
      }
    })
  }
}

function foreignKeysForScope(dream: Dream, scope?: string | string[]) {
  return scopeArray(scope)
    .map(singleScope => getForeignKeyForSortableScope(dream, singleScope))
    .map(fk => (dream as any)[fk])
}
