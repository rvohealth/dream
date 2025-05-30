import { isObject } from '../helpers/typechecks.js'
import SerializerOpenapiRenderer from '../serializer/SerializerOpenapiRenderer.js'
import { OpenapiSchemaBodyShorthand, OpenapiShorthandPrimitiveTypes } from '../types/openapi.js'

export default function allSerializersToRefsInOpenapi(
  openapi: OpenapiSchemaBodyShorthand | OpenapiShorthandPrimitiveTypes | undefined
): OpenapiSchemaBodyShorthand {
  if (!openapi) return {} as OpenapiSchemaBodyShorthand

  return transformValue(openapi) as OpenapiSchemaBodyShorthand
}

function transformValue(value: any): any {
  if (!value) return value

  // If this is an object with a $serializer property, replace it with $ref
  if (value.$serializer) {
    const { $serializer, ...rest } = value
    const openapiRenderer = new SerializerOpenapiRenderer($serializer).serializerRef
    return {
      ...rest,
      ...openapiRenderer,
    }
  } else if (isObject(value)) {
    // Recurse into objects
    const transformed: any = {}
    for (const [key, val] of Object.entries(value)) {
      transformed[key] = transformValue(val)
    }

    return transformed
    //
  } else if (Array.isArray(value)) {
    // Recurse into arrays
    return value.map(val => transformValue(val))
    //
  } else {
    // Return primitive values as-is
    return value
  }
}
