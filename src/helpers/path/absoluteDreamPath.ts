import addImportSuffix from '../cli/addImportSuffix.js'
import pascalize from '../pascalize.js'
import { DreamPaths } from './dreamPath.js'

type SupportedDestinations = Extract<DreamPaths, 'factories' | 'models' | 'serializers'>

export default function absoluteDreamPath(
  destinationDreamPathType: SupportedDestinations,
  fullyQualifiedDestinationModelName: string
) {
  fullyQualifiedDestinationModelName = pascalize(fullyQualifiedDestinationModelName)

  const destinationPath = rootPath(destinationDreamPathType)

  switch (destinationDreamPathType) {
    case 'factories':
      return addImportSuffix(`${destinationPath}${fullyQualifiedDestinationModelName}Factory.js`)

    case 'serializers':
      return addImportSuffix(`${destinationPath}${fullyQualifiedDestinationModelName}Serializer.js`)

    default:
      return addImportSuffix(`${destinationPath}${fullyQualifiedDestinationModelName}.js`)
  }
}

function rootPath(destinationDreamPathType: SupportedDestinations) {
  switch (destinationDreamPathType) {
    case 'models':
      return '@models/'

    case 'serializers':
      return '@serializers/'

    case 'factories':
      return '@spec/factories/'

    default: {
      // protection so that if a new DreamPaths is ever added, this will throw a type error at build time
      const _never: never = destinationDreamPathType
      throw new Error(`Unhandled DreamPaths: ${_never as string}`)
    }
  }
}
