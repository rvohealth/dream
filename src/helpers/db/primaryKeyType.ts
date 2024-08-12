import { primaryKeyTypes } from '../../dream/types'
import { getCachedDreamApplicationOrFail } from '../../dream-application/cache'

export default function primaryKeyType() {
  const dreamconf = getCachedDreamApplicationOrFail()

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
