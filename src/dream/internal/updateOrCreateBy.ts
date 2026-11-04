import Dream from '../../Dream.js'
import { UpdateablePropertiesForClass, UpdateOrCreateByExtraOpts } from '../../types/dream.js'
import DreamTransaction from '../DreamTransaction.js'
import findOrCreateLookupStatement from './findOrCreateLookupStatement.js'
import saveDream from './saveDream.js'

export default async function updateOrCreateBy<T extends typeof Dream>(
  dreamClass: T,
  txn: DreamTransaction<InstanceType<T>> | null = null,
  attributes: UpdateablePropertiesForClass<T>,
  extraOpts: UpdateOrCreateByExtraOpts<T> = {}
): Promise<InstanceType<T>> {
  // where().first() rather than findBy: a value the database rejects is raised, never read as no match,
  // so it cannot lead to creating a record that already exists
  const existingRecord = await dreamClass
    .txn(txn)
    .where(findOrCreateLookupStatement(dreamClass, attributes))
    .first()

  const { with: attrs, skipHooks } = extraOpts

  if (existingRecord) {
    existingRecord.assignAttributes(attrs ?? {})
    return await saveDream(existingRecord, txn, skipHooks ? { skipHooks } : undefined)
  }

  return await dreamClass.txn(txn).create(
    {
      ...attributes,
      ...extraOpts?.with,
    },
    skipHooks ? { skipHooks } : undefined
  )
}
