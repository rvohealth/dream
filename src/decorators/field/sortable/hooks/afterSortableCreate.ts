import Dream from '../../../../Dream.js'
import DreamTransaction from '../../../../dream/DreamTransaction.js'
import Query from '../../../../dream/Query.js'
import clearCachedSortableValues from '../helpers/clearCachedSortableValues.js'
import setPosition from '../helpers/setPosition.js'
import sortableCacheValuesName from '../helpers/sortableCacheValuesName.js'
import { SortableCache } from './beforeSortableSave.js'

export default async function afterSortableCreate({
  positionField,
  dream,
  query,
  txn,
  scope,
}: {
  positionField: string
  dream: Dream
  query: Query<Dream>
  txn?: DreamTransaction<any> | undefined
  scope: string | string[] | undefined
}) {
  const cachedValuesName = sortableCacheValuesName(positionField)
  const sortableCache: SortableCache | undefined = (dream as any)[cachedValuesName]

  await setPosition({
    position: sortableCache?.position,
    dream,
    positionField,
    txn,
    scope,
    query,
    changingScope: false,
    previousPosition: undefined,
    wasNewRecord: true,
  })

  clearCachedSortableValues(dream, positionField)
}
