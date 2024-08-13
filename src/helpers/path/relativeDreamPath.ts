import pascalize from '../pascalize'
import dreamPath, { DreamPaths } from './dreamPath'
import sharedPrefix from './sharedPathPrefix'

export function pathDelimitedFullyQualifiedModelName(fullyQualifiedModelName: string) {
  return fullyQualifiedModelName.replace(/\//g, '/')
}

export default function (
  originDreamPathType: DreamPaths,
  destinationDreamPathType: DreamPaths,
  fullyQualifiedOriginModelName: string,
  fullyQualifiedDestinationModelName: string = fullyQualifiedOriginModelName
) {
  fullyQualifiedOriginModelName = pascalize(fullyQualifiedOriginModelName)
  fullyQualifiedDestinationModelName = pascalize(fullyQualifiedDestinationModelName)

  const numAdditionalUpdirs = fullyQualifiedOriginModelName.split('/').length - 1
  let additionalUpdirs = ''

  for (let i = 0; i < numAdditionalUpdirs; i++) {
    additionalUpdirs = `../${additionalUpdirs}`
  }

  const baseRelativePath = dreamPathTypeRelativePath(originDreamPathType, destinationDreamPathType)
  let destinationPath =
    additionalUpdirs +
    (baseRelativePath.length ? baseRelativePath + '/' : '') +
    pathDelimitedFullyQualifiedModelName(fullyQualifiedDestinationModelName)
  if (destinationPath[0] !== '.') destinationPath = `./${destinationPath}`

  switch (destinationDreamPathType) {
    case 'factories':
      return `${destinationPath}Factory`

    case 'serializers':
      return `${destinationPath}Serializer`

    default:
      return destinationPath
  }
}

export function dreamPathTypeRelativePath(
  originDreamPathType: DreamPaths,
  destinationDreamPathType: DreamPaths
) {
  const originPath = dreamPath(originDreamPathType)
  const destinationPath = dreamPath(destinationDreamPathType)
  const sharedPrefixLength = sharedPrefix(originPath, destinationPath).length
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
