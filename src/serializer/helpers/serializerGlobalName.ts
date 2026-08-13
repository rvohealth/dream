import {
  DreamModelSerializerType,
  SerializerType,
  SimpleObjectSerializerType,
} from '../../types/serializer.js'

/**
 * @internal
 *
 * The single reader of a serializer's `globalName`.
 *
 * Serializers are plain functions; `globalName` is stamped onto them by `importSerializers` when the
 * app loads them, so the property is not on any serializer type and every reader would otherwise
 * have to invent its own cast — three different spellings of it existed before this helper.
 *
 * `undefined` is a legitimate answer: a serializer built inline (a spec, or a `{ serializer }`
 * option) is never stamped. Callers decide what that means for them — the resolution-context message
 * simply drops the declarer.
 */
export default function serializerGlobalName(
  serializer: DreamModelSerializerType | SimpleObjectSerializerType | SerializerType
): string | undefined {
  return (serializer as unknown as { globalName?: string }).globalName
}
