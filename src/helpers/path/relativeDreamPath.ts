import path from 'path'
import pascalize from '../pascalize'
import dreamPath, { DreamPaths } from './dreamPath'
import sharedPrefix from './sharedPathPrefix'

export function pathDelimitedFullyQualifiedModelName(fullyQualifiedModelName: string) {
  return fullyQualifiedModelName.replace(new RegExp('/', 'g'), path.sep)
}

export default async function (
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
    additionalUpdirs = `..${path.sep}${additionalUpdirs}`
  }

  const baseRelativePath = await dreamPathTypeRelativePath(originDreamPathType, destinationDreamPathType)
  let destinationPath =
    additionalUpdirs +
    (baseRelativePath.length ? baseRelativePath + path.sep : '') +
    pathDelimitedFullyQualifiedModelName(fullyQualifiedDestinationModelName)
  if (destinationPath[0] !== '.') destinationPath = `.${path.sep}${destinationPath}`

  switch (destinationDreamPathType) {
    case 'factories':
      return `${destinationPath}Factory`

    case 'serializers':
      return `${destinationPath}Serializer`

    default:
      return destinationPath
  }
}

export async function dreamPathTypeRelativePath(
  originDreamPathType: DreamPaths,
  destinationDreamPathType: DreamPaths
) {
  const originPath = await dreamPath(originDreamPathType)
  const destinationPath = await dreamPath(destinationDreamPathType)
  const sharedPrefixLength = sharedPrefix(originPath, destinationPath).length
  const originPathToRemove = originPath.slice(sharedPrefixLength)

  const updirs =
    originPathToRemove.length === 0
      ? ''
      : originPathToRemove
          .split(path.sep)
          .map(() => '../')
          .join('')

  return updirs + destinationPath.slice(sharedPrefixLength)
}
