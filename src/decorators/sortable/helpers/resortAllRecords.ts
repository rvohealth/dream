import Dream from '../../../Dream.js'
import getColumnForSortableScope from './getColumnForSortableScope.js'
import isSortedCorrectly from './isSortedCorrectly.js'
import scopeArray from './scopeArray.js'

export default async function resortAllRecords(
  dreamClass: typeof Dream,
  positionField: string,
  scope?: string | string[]
) {
  const dreams = await dreamClass.order({ [positionField]: 'asc' }).all()
  const hash: any = {}
  for (const dream of dreams) {
    const foreignKeys = foreignKeysForScope(dream, scope)
    hash[foreignKeys.join(':')] ||= []
    hash[foreignKeys.join(':')].push(dream)
  }

  for (const dreamArr of Object.values(hash)) {
    const dreams = dreamArr as Dream[]

    if (isSortedCorrectly(dreams, positionField)) continue

    await dreamClass.transaction(async txn => {
      let counter = 1
      for (const dream of dreams) {
        await dreamClass
          .txn(txn)
          .where({ [dream.primaryKey]: dream.primaryKeyValue } as any)
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
    .map(singleScope => getColumnForSortableScope(dream, singleScope))
    .map(fk => (dream as any)[fk])
}
