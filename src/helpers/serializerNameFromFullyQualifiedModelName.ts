import globalClassNameFromFullyQualifiedModelName from './globalClassNameFromFullyQualifiedModelName'

export default function (fullyQualifiedModelName: string, serializerType: 'default' | 'summary' = 'default') {
  const globalModelName = globalClassNameFromFullyQualifiedModelName(fullyQualifiedModelName)

  switch (serializerType) {
    case 'default':
      return `${globalModelName}Serializer`

    case 'summary':
      return `${globalModelName}SummarySerializer`
  }
}
