import Dream from '../../Dream.js'
import { CreateOrFindByExtraOpts, UpdateablePropertiesForClass } from '../../types/dream.js'
import DreamTransaction from '../DreamTransaction.js'
import findOrCreateLookupStatement from './findOrCreateLookupStatement.js'

export default async function findOrCreateBy<T extends typeof Dream>(
  dreamClass: T,
  txn: DreamTransaction<InstanceType<T>> | null = null,
  attributes: UpdateablePropertiesForClass<T>,
  extraOpts: CreateOrFindByExtraOpts<T> = {}
): Promise<InstanceType<T>> {
  // where().first() rather than findBy: a value the database rejects is raised, never read as no match,
  // so it cannot lead to creating a record that already exists
  const existingRecord = await dreamClass
    .txn(txn)
    .where(findOrCreateLookupStatement(dreamClass, attributes))
    .first()

  if (existingRecord) return existingRecord

  const { createWith, skipHooks } = extraOpts

  const dreamModel = dreamClass.new({
    ...attributes,
    ...createWith,
  })

  await dreamModel.txn(txn).save(skipHooks ? { skipHooks } : undefined)

  return dreamModel
}
