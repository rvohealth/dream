import DreamApp from '../../dream-app/index.js'
import { primaryKeyTypes } from '../../dream/constants.js'

export default function primaryKeyType() {
  const dreamconf = DreamApp.getOrFail()

  switch (dreamconf.primaryKeyType) {
    case 'bigint':
    case 'bigserial':
    case 'uuid':
    case 'integer':
      return dreamconf.primaryKeyType

    default: {
      // protection so that if a new EncryptAlgorithm is ever added, this will throw a type error at build time
      const _never: never = dreamconf.primaryKeyType
      throw new Error(`
ATTENTION!

  unrecognized primary key type "${_never as string}" found in .dream.yml.
  please use one of the allowed primary key types:
    ${primaryKeyTypes.join(', ')}
      `)
    }
  }
}
