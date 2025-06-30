import associationStringToNameAndAlias from './associationStringToNameAndAlias.js'

export default function unaliasTableName(tableName: string) {
  return associationStringToNameAndAlias(tableName).name
}
