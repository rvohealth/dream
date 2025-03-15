import { PrimaryKeyType } from '../../dream/types.js'

export default function foreignKeyTypeFromPrimaryKey(primaryKey: PrimaryKeyType) {
  switch (primaryKey) {
    case 'bigserial':
      return 'bigint'

    default:
      return primaryKey
  }
}
