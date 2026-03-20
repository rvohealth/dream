import Dream from '../../Dream.js'
import { CreateOrFindByExtraOpts, UpdateablePropertiesForClass } from '../../types/dream.js'
import DreamTransaction from '../DreamTransaction.js'

export default async function findOrCreateBy<T extends typeof Dream>(
  dreamClass: T,
  txn: DreamTransaction<InstanceType<T>> | null = null,
  attributes: UpdateablePropertiesForClass<T>,
  extraOpts: CreateOrFindByExtraOpts<T> = {}
): Promise<InstanceType<T>> {
  const existingRecord = await dreamClass
    .txn(txn)
    .findBy(dreamClass['extractAttributesFromUpdateableProperties'](attributes))

  if (existingRecord) return existingRecord

  const { createWith, skipHooks } = extraOpts

  const dreamModel = dreamClass.new({
    ...attributes,
    ...createWith,
  })

  await dreamModel.txn(txn).save(skipHooks ? { skipHooks } : undefined)

  return dreamModel
}
