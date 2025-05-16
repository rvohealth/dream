import hasSerializersGetter from './hasSerializersGetter.js'
import maybeSerializableToDreamSerializerCallbackFunction from './maybeSerializableToDreamSerializerCallbackFunction.js'

// TODO: remove this file if unused in Dream and Psychic
// Extracted from shared serializer decorators
export function isSerializable(dreamOrSerializerClass: any) {
  return (
    Array.isArray(dreamOrSerializerClass) ||
    hasSerializersGetter(dreamOrSerializerClass) ||
    !!maybeSerializableToDreamSerializerCallbackFunction(dreamOrSerializerClass)
  )
}
