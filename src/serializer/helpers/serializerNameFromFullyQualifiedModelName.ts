import standardizeFullyQualifiedModelName from '../../helpers/standardizeFullyQualifiedModelName.js'

export default function serializerNameFromFullyQualifiedModelName(
  fullyQualifiedModelName: string,
  serializerType: 'default' | 'summary' = 'default'
) {
  const delimitedFullyQualifiedModelName = standardizeFullyQualifiedModelName(fullyQualifiedModelName)
  const path = delimitedFullyQualifiedModelName.split('/').slice(0, -1)
  const pathName = `${path.join('/')}${path.length ? '/' : ''}`
  fullyQualifiedModelName = fullyQualifiedModelName.replace(/\//g, '')

  switch (serializerType) {
    case 'default':
      return `${pathName}${fullyQualifiedModelName}Serializer`

    case 'summary':
      return `${pathName}${fullyQualifiedModelName}SummarySerializer`
  }
}
