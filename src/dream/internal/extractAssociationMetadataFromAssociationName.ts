export default function extractAssociationMetadataFromAssociationName(associationName: string): {
  name: string
  alias: string
} {
  if (/ as /.test(associationName)) {
    const [name, alias] = associationName.split(/ as /)
    return { name: name ?? associationName, alias: alias ?? associationName }
  } else {
    return { name: associationName, alias: associationName }
  }
}
