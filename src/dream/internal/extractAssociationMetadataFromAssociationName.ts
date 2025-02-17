export default function extractAssociationMetadataFromAssociationName(associationName: string) {
  const name = / as /.test(associationName) ? associationName.split(/ as /)[0] : associationName
  const alias = / as /.test(associationName) ? associationName.split(/ as /)[1] : associationName
  return { name, alias }
}
