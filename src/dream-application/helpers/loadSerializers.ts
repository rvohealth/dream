import getFiles from '../../helpers/getFiles'
import DreamSerializer from '../../serializer'
import globalNameIsAvailable from './globalNameIsAvailable'

let _serializers: Record<string, typeof DreamSerializer>

export default async function loadSerializers(
  serializersPath: string
): Promise<Record<string, typeof DreamSerializer>> {
  if (_serializers) return _serializers

  _serializers = {}
  const serializerPaths = (await getFiles(serializersPath)).filter(path => /\.[jt]s$/.test(path))

  for (const serializerPath of serializerPaths) {
    const allSerializers = await import(serializerPath)

    Object.keys(allSerializers).forEach(key => {
      const potentialSerializer = allSerializers[key]

      if ((potentialSerializer as typeof DreamSerializer)?.isDreamSerializer) {
        const serializer = potentialSerializer as typeof DreamSerializer
        if (!globalNameIsAvailable(serializer.globalName)) {
          throw new Error(
            `
Attempted to register ${serializer.name}, but another serializer was detected with the same
name. To fix this, use the "globalName" getter to distinguish one of these serializers
from the other:

export default class ${serializer.name} extends DreamSerializer {
  public static get globalName() {
    return 'MyCustomGlobalName'
  }
}
`
          )
        }

        _serializers[serializer.globalName] = potentialSerializer
      }
    })
  }

  return _serializers
}

export function getSerializersOrFail() {
  if (!_serializers) throw new Error('Must call loadSerializers before calling getSerializersOrFail')
  return _serializers
}

export function getSerializersOrBlank() {
  return _serializers || {}
}
