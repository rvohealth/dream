import DreamApplication, { DreamDirectoryPaths } from '../../dream-application'

export default function (dreamPathType: DreamPaths) {
  const dreamApp = DreamApplication.getOrFail()

  switch (dreamPathType) {
    case 'models':
      return dreamApp.paths.models
    case 'serializers':
      return dreamApp.paths.serializers
    case 'db':
      return dreamApp.paths.db
    case 'conf':
      return dreamApp.paths.conf
    case 'modelSpecs':
      return dreamApp.paths.modelSpecs
    case 'factories':
      return dreamApp.paths.factories
    case 'types':
      return dreamApp.paths.types
    case 'services':
      return dreamApp.paths.services
  }
}

export type DreamPaths = keyof DreamDirectoryPaths
