import { LegacyCompatiblePrimaryKeyType } from '../../../../types/db.js'

export default function foreignKeyTypeFromPrimaryKey(primaryKey: LegacyCompatiblePrimaryKeyType) {
  switch (primaryKey) {
    case 'uuid7':
    case 'uuid4':
      return 'uuid'

    case 'bigserial':
      return 'bigint'

    default:
      return primaryKey
  }
}
