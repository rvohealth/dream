import DreamApplication from '../../dream-application'
import { primaryKeyTypes } from '../../dream/types'

export default function primaryKeyType() {
  const dreamconf = DreamApplication.getOrFail()

  switch (dreamconf.primaryKeyType) {
    case 'bigint':
    case 'bigserial':
    case 'uuid':
    case 'integer':
      return dreamconf.primaryKeyType

    default:
      throw new Error(`
ATTENTION!

  unrecognized primary key type "${dreamconf.primaryKeyType as string}" found in .dream.yml.
  please use one of the allowed primary key types:
    ${primaryKeyTypes.join(', ')}
      `)
  }
}
