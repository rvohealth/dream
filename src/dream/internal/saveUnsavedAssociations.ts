import Dream from '../../dream'
import DreamTransaction from '../transaction'
import { DreamConstructorType } from '../types'
import saveDream from './saveDream'

export default async function saveUnsavedAssociations<DreamInstance extends Dream>(
  dream: DreamInstance,
  txn: DreamTransaction<DreamConstructorType<DreamInstance>> | null
) {
  const self = dream as any

  for (const associationMetadata of dream.unsavedAssociations) {
    const associationRecord = self[associationMetadata.as] as Dream

    await saveDream(associationRecord, txn)

    self[associationMetadata.foreignKey()] = associationRecord.primaryKeyValue
  }
}
