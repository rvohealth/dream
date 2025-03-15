import standardizeFullyQualifiedModelName from './standardizeFullyQualifiedModelName.js'

export default function (fullyQualifiedModelName: string, serializerType: 'default' | 'summary' = 'default') {
  fullyQualifiedModelName = standardizeFullyQualifiedModelName(fullyQualifiedModelName)

  switch (serializerType) {
    case 'default':
      return `${fullyQualifiedModelName}Serializer`

    case 'summary':
      return `${fullyQualifiedModelName}SummarySerializer`
  }
}
