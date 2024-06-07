import { DreamPrimaryKeyType } from './db/primaryKeyType'

export default function primaryKeyIsOrderable(primaryKeyType: DreamPrimaryKeyType) {
  switch (primaryKeyType) {
    case 'integer':
    case 'bigserial':
    case 'bigint':
      return true

    case 'uuid':
      return false
  }
}
