export default function associationStringToNameAndAlias(associationName: string): {
  name: string
  alias: string | undefined
} {
  if (/ as /.test(associationName)) {
    const [name, alias] = associationName.split(/ as /)
    return { name: name ?? associationName, alias: alias ?? associationName }
  } else {
    return { name: associationName, alias: undefined }
  }
}
