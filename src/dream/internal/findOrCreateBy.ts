import Dream from '../../Dream.js'
import { CreateOrFindByExtraOptsForDreamInstance, UpdateablePropertiesForClass } from '../../types/dream.js'
import DreamTransaction from '../DreamTransaction.js'

export default async function findOrCreateBy<T extends typeof Dream>(
  dreamClass: T,
  txn: DreamTransaction<InstanceType<T>> | null = null,
  attributes: UpdateablePropertiesForClass<T>,
  extraOpts: CreateOrFindByExtraOptsForDreamInstance<InstanceType<T>> = {}
): Promise<InstanceType<T>> {
  if (txn) {
    const existingRecord = await dreamClass
      .txn(txn)
      .findBy(dreamClass['extractAttributesFromUpdateableProperties'](attributes))
    if (existingRecord) return existingRecord

    const dreamModel = dreamClass.new({
      ...attributes,
      ...(extraOpts?.createWith || {}),
    })

    await dreamModel.txn(txn).save()

    return dreamModel
  } else {
    const existingRecord = await dreamClass.findBy(
      dreamClass['extractAttributesFromUpdateableProperties'](attributes)
    )
    if (existingRecord) return existingRecord

    const dreamModel = dreamClass.new({
      ...attributes,
      ...(extraOpts?.createWith || {}),
    })

    await dreamModel.save()

    return dreamModel
  }
}
