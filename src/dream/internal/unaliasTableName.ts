import associationStringToNameAndAlias from './extractAssociationMetadataFromAssociationName.js'

export default function unaliasTableName(tableName: string) {
  return associationStringToNameAndAlias(tableName).name
}
