import SerializerGlobalNameConflict from '../../exceptions/dream-application/serializer-global-name-conflict'
import getFiles from '../../helpers/getFiles'
import DreamSerializer from '../../serializer'
import globalNameIsAvailable from './globalNameIsAvailable'
import pathToGlobalKey from './pathToGlobalKey'

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
        const serializerKey = pathToGlobalKey(serializerPath, /^.*app\/serializers\//, key)

        if (!globalNameIsAvailable(serializerKey)) throw new SerializerGlobalNameConflict(serializerKey)

        const serializer = potentialSerializer as typeof DreamSerializer
        serializer.setGlobalName(serializerKey)

        _serializers[serializerKey] = potentialSerializer
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
