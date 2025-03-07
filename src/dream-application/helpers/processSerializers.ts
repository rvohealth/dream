import SerializerNameConflict from '../../errors/dream-application/SerializerNameConflict.js'
import DreamSerializer from '../../serializer/index.js'
import globalSerializerKeyFromPath from './globalSerializerKeyFromPath.js'

let _serializers: Record<string, typeof DreamSerializer>

export default function processSerializers(
  serializersPath: string,
  serializerClasses: [string, Record<string, typeof DreamSerializer>][]
): Record<string, typeof DreamSerializer> {
  if (_serializers) return _serializers
  /**
   * Certain features (e.g. building OpenAPI specs from Attribute and RendersOne/Many decorators)
   * need static access to things set up by decorators. Stage 3 Decorators change the context that is available
   * at decoration time such that the class of a property being decorated is only avilable during instance instantiation. In order
   * to only apply static values once, on boot, `globallyInitializingDecorators` is set to true on DreamSerializer, and all serializers are instantiated.
   */
  DreamSerializer['globallyInitializingDecorators'] = true

  _serializers = {}

  for (const [serializerPath, allSerializers] of serializerClasses) {
    Object.keys(allSerializers).forEach(key => {
      const potentialSerializer = allSerializers[key]

      if (potentialSerializer?.isDreamSerializer) {
        const serializerKey = globalSerializerKeyFromPath(serializerPath, serializersPath, key)

        if (_serializers[serializerKey]) throw new SerializerNameConflict(serializerKey)

        const serializerClass = potentialSerializer
        serializerClass['setGlobalName'](serializerKey)

        /**
         * Certain features (e.g. building OpenAPI specs from Attribute and RendersOne/Many decorators)
         * need static access to things set up by decorators. Stage 3 Decorators change the context that is available
         * at decoration time such that the class of a property being decorated is only avilable during instance instantiation. In order
         * to only apply static values once, on boot, `globallyInitializingDecorators` is set to true on DreamSerializer, and all serializers are instantiated.
         */
        new serializerClass({})

        _serializers[serializerKey] = potentialSerializer
      }
    })
  }

  /**
   * Certain features (e.g. building OpenAPI specs from Attribute and RendersOne/Many decorators)
   * need static access to things set up by decorators. Stage 3 Decorators change the context that is available
   * at decoration time such that the class of a property being decorated is only avilable during instance instantiation. In order
   * to only apply static values once, on boot, `globallyInitializingDecorators` is set to true on DreamSerializer, and all serializers are instantiated.
   */
  DreamSerializer['globallyInitializingDecorators'] = false

  return _serializers
}

export function setCachedSerializers(serializers: Record<string, typeof DreamSerializer>) {
  _serializers = serializers
}

export function getSerializersOrFail() {
  if (!_serializers) throw new Error('Must call loadSerializers before calling getSerializersOrFail')
  return _serializers
}

export function getSerializersOrBlank() {
  return _serializers || {}
}
