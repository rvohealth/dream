import { primaryKeyTypes } from '../../dream/types'
import { loadDreamYamlFile } from '../path'

export default async function primaryKeyType() {
  const yamlConf = await loadDreamYamlFile()

  switch (yamlConf.primary_key_type) {
    case 'bigint':
    case 'bigserial':
    case 'uuid':
    case 'integer':
      return yamlConf.primary_key_type

    default:
      throw new Error(`
ATTENTION!

  unrecognized primary key type "${yamlConf.primary_key_type}" found in .dream.yml.
  please use one of the allowed primary key types:
    ${primaryKeyTypes.join(', ')}
      `)
  }
}
