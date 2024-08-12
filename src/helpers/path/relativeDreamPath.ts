import { getCachedDreamApplicationOrFail } from '../../dream-application/cache'

export default function relativeDreamPath(dreamPathType: DreamPaths) {
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
    case 'uspec':
      return dreamApp.paths.uspecs
    case 'factories':
      return dreamApp.paths.factories
  }
}

export type DreamPaths = 'models' | 'serializers' | 'db' | 'conf' | 'uspec' | 'factories'
