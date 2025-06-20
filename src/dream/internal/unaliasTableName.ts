import extractAssociationMetadataFromAssociationName from './extractAssociationMetadataFromAssociationName.js'

export default function unaliasTableName(tableName: string) {
  return extractAssociationMetadataFromAssociationName(tableName).name
}
