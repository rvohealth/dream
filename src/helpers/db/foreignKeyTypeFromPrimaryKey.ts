import { PrimaryKeyType } from '../../types/dream.js'

export default function foreignKeyTypeFromPrimaryKey(primaryKey: PrimaryKeyType) {
  switch (primaryKey) {
    case 'bigserial':
      return 'bigint'

    default:
      return primaryKey
  }
}
