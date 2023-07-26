import Dream from '../../dream'
import DreamTransaction from '../transaction'
import saveDream from './saveDream'

export default async function saveUnsavedAssociations<DreamInstance extends Dream>(
  dream: DreamInstance,
  txn: DreamTransaction | null
) {
  const self = dream as any

  for (const associationMetadata of dream.unsavedAssociations) {
    const associationRecord = self[associationMetadata.as] as Dream

    await saveDream(associationRecord, txn)

    self[associationMetadata.foreignKey()] = associationRecord.primaryKeyValue
  }
}
