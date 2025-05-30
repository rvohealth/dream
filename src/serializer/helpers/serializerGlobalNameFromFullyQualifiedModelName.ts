import standardizeFullyQualifiedModelName from '../../helpers/standardizeFullyQualifiedModelName.js'

export default function serializerGlobalNameFromFullyQualifiedModelName(
  fullyQualifiedModelName: string,
  serializerType: 'default' | 'summary' = 'default'
) {
  fullyQualifiedModelName = standardizeFullyQualifiedModelName(fullyQualifiedModelName)

  switch (serializerType) {
    case 'default':
      return `${fullyQualifiedModelName}Serializer`

    case 'summary':
      return `${fullyQualifiedModelName}SummarySerializer`
  }
}
