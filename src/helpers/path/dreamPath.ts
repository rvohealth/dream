import DreamApp, { DreamDirectoryPaths } from '../../dream-app/index.js'

export default function (dreamPathType: DreamPaths) {
  const dreamApp = DreamApp.getOrFail()

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
  }
}

export type DreamPaths = keyof DreamDirectoryPaths
