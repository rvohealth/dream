import SerializerNameConflict from '../../../errors/dream-app/SerializerNameConflict.js'
import isDreamSerializer from '../../../serializer/helpers/isDreamSerializer.js'
import { DreamModelSerializerType, SimpleObjectSerializerType } from '../../../types/serializer.js'
import DreamImporter from '../DreamImporter.js'
import globalSerializerKeyFromPath from '../globalSerializerKeyFromPath.js'

let _serializers: Record<string, DreamModelSerializerType | SimpleObjectSerializerType>

export default async function importSerializers(
  serializersPath: string,
  serializerImportCb: (path: string) => Promise<any>
): Promise<Record<string, DreamModelSerializerType | SimpleObjectSerializerType>> {
  if (_serializers) return _serializers

  const serializerClasses = await DreamImporter.importSerializers(serializersPath, serializerImportCb)
  _serializers = {}

  for (const [serializerPath, allSerializers] of serializerClasses) {
    Object.keys(allSerializers).forEach(key => {
      const potentialSerializer = allSerializers[key]

      if (potentialSerializer && isDreamSerializer(potentialSerializer)) {
        const serializerKey = globalSerializerKeyFromPath(serializerPath, serializersPath, key)

        if (_serializers[serializerKey]) throw new SerializerNameConflict(serializerKey)

        const serializer = potentialSerializer
        ;(serializer as any)['globalName'] = serializerKey

        _serializers[serializerKey] = potentialSerializer
      }
    })
  }

  return _serializers
}

export function setCachedSerializers(
  serializers: Record<string, DreamModelSerializerType | SimpleObjectSerializerType>
) {
  _serializers = serializers
}

export function getSerializersOrFail() {
  if (!_serializers) throw new Error('Must call importSerializers before calling getSerializersOrFail')
  return _serializers
}

export function getSerializersOrBlank() {
  return _serializers || {}
}
