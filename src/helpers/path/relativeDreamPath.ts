import pascalize from '../pascalize'
import standardizeFullyQualifiedModelName from '../standardizeFullyQualifiedModelName'
import dreamPath, { DreamPaths } from './dreamPath'
import sharedPathPrefix from './sharedPathPrefix'

export default function (
  originDreamPathType: DreamPaths,
  destinationDreamPathType: DreamPaths,
  fullyQualifiedOriginModelName: string,
  fullyQualifiedDestinationModelName: string = fullyQualifiedOriginModelName
) {
  fullyQualifiedOriginModelName = standardizeFullyQualifiedModelName(fullyQualifiedOriginModelName)
  fullyQualifiedDestinationModelName = pascalize(fullyQualifiedDestinationModelName)

  let pathToRemove = fullyQualifiedOriginModelName

  if (originDreamPathType === destinationDreamPathType) {
    const sharedPrefixLength = sharedPathPrefix(
      fullyQualifiedOriginModelName,
      fullyQualifiedDestinationModelName
    ).length
    pathToRemove = fullyQualifiedOriginModelName.slice(sharedPrefixLength)
    fullyQualifiedDestinationModelName = fullyQualifiedDestinationModelName.slice(sharedPrefixLength)
  }

  const numAdditionalUpdirs = pathToRemove.split('/').length - 1
  let additionalUpdirs = ''

  for (let i = 0; i < numAdditionalUpdirs; i++) {
    additionalUpdirs = `../${additionalUpdirs}`
  }

  const baseRelativePath = dreamPathTypeRelativePath(originDreamPathType, destinationDreamPathType)
  let destinationPath = additionalUpdirs + (baseRelativePath.length ? baseRelativePath + '/' : '')

  if (destinationPath[0] !== '.') destinationPath = `./${destinationPath}`

  switch (destinationDreamPathType) {
    case 'db':
      return destinationPath

    case 'factories':
      return `${destinationPath}${fullyQualifiedDestinationModelName}Factory`

    case 'serializers':
      return `${destinationPath}${fullyQualifiedDestinationModelName}Serializer`

    default:
      return `${destinationPath}${fullyQualifiedDestinationModelName}`
  }
}

export function dreamPathTypeRelativePath(
  originDreamPathType: DreamPaths,
  destinationDreamPathType: DreamPaths
) {
  const originPath = dreamPath(originDreamPathType)
  const destinationPath = dreamPath(destinationDreamPathType)
  const sharedPrefixLength = sharedPathPrefix(originPath, destinationPath).length
  const originPathToRemove = originPath.slice(sharedPrefixLength)

  const updirs =
    originPathToRemove.length === 0
      ? ''
      : originPathToRemove
          .split('/')
          .map(() => '../')
          .join('')

  return updirs + destinationPath.slice(sharedPrefixLength)
}
