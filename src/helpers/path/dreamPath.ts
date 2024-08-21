import { getCachedDreamApplicationOrFail } from '../../dream-application/cache'

export default function (dreamPathType: DreamPaths) {
  const dreamApp = getCachedDreamApplicationOrFail()

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
  }
}

export type DreamPaths = 'models' | 'serializers' | 'db' | 'conf' | 'modelSpecs' | 'factories'
