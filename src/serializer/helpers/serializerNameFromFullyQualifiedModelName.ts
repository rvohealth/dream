export default function serializerNameFromFullyQualifiedModelName(
  fullyQualifiedModelName: string,
  serializerType: 'default' | 'summary' = 'default'
) {
  const name = fullyQualifiedModelName.replace(/\//g, '')

  switch (serializerType) {
    case 'default':
      return `${name}Serializer`

    case 'summary':
      return `${name}SummarySerializer`
  }
}
