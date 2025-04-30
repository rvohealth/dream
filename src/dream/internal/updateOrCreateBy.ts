import Dream from '../../Dream.js'
import { UpdateablePropertiesForClass, UpdateOrCreateByExtraOpts } from '../../types/dream.js'
import DreamTransaction from '../DreamTransaction.js'
import saveDream from './saveDream.js'

export default async function updateOrCreateBy<T extends typeof Dream>(
  dreamClass: T,
  txn: DreamTransaction<InstanceType<T>> | null = null,
  attributes: UpdateablePropertiesForClass<T>,
  extraOpts: UpdateOrCreateByExtraOpts<T> = {}
): Promise<InstanceType<T>> {
  let existingRecord: InstanceType<T> | null

  if (txn) {
    existingRecord = await dreamClass
      .txn(txn)
      .findBy(dreamClass['extractAttributesFromUpdateableProperties'](attributes))
  } else {
    existingRecord = await dreamClass.findBy(
      dreamClass['extractAttributesFromUpdateableProperties'](attributes)
    )
  }

  const { with: attrs, skipHooks } = extraOpts

  if (existingRecord) {
    existingRecord.assignAttributes(attrs ?? {})
    return await saveDream(existingRecord, txn, skipHooks ? { skipHooks } : undefined)
  }

  if (txn) {
    return await dreamClass.txn(txn).create(
      {
        ...attributes,
        ...(extraOpts?.with || {}),
      },
      skipHooks ? { skipHooks } : undefined
    )
  } else {
    return await dreamClass.create(
      {
        ...attributes,
        ...(extraOpts?.with || {}),
      },
      skipHooks ? { skipHooks } : undefined
    )
  }
}
