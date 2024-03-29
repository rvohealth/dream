import { PrimaryKeyType } from '../../dream/types'

export default function foreignKeyTypeFromPrimaryKey(primaryKey: PrimaryKeyType) {
  switch (primaryKey) {
    case 'bigserial':
      return 'bigint'

    default:
      return primaryKey
  }
}
