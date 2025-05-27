import { isObject } from '../helpers/typechecks.js'
import { OpenapiSchemaBodyShorthand, OpenapiShorthandPrimitiveTypes } from '../types/openapi.js'
import { DreamModelSerializerType, SimpleObjectSerializerType } from '../types/serializer.js'

export default function allSerializersFromHandWrittenOpenapi(
  openapi: OpenapiSchemaBodyShorthand | OpenapiShorthandPrimitiveTypes | undefined
): (DreamModelSerializerType | SimpleObjectSerializerType)[] {
  const serializers = new Set<DreamModelSerializerType | SimpleObjectSerializerType>()

  extractSerializers(openapi, serializers)

  return [...serializers]
}

function extractSerializers(
  value: any,
  serializers: Set<DreamModelSerializerType | SimpleObjectSerializerType>
) {
  if (!value) return

  if (value.$serializer) {
    serializers.add(value.$serializer)
    //
  } else if (isObject(value)) {
    // Recurse into objects
    Object.values(value).forEach(val => extractSerializers(val, serializers))
    //
  } else if (Array.isArray(value)) {
    // Recurse into arrays
    value.forEach(val => extractSerializers(val, serializers))
  }
}
