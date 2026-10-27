import ObjectSerializerBuilder from './builders/ObjectSerializerBuilder.js'

/**
 * Builds a serializer for a plain object or view model. A serializer is a function
 * that takes the data to render and declares the keys to render it with:
 *
 * ```typescript
 * export const AddressSerializer = (address: Address) =>
 *   ObjectSerializer(address).attribute('city', { openapi: 'string' })
 * ```
 *
 * A serializer must not read its data or its passthrough data while being built: what it
 * declares (which keys, under which names, and which associations it renders) may not
 * depend on either. Dream and Psychic build it without data to read its shape (the OpenAPI
 * schema, the associations `preloadFor` loads, and the keys a flattened association or
 * `customAttribute` that uses it renders as `null` where its value does not supply them),
 * and without passthrough data when registering it, preloading and generating OpenAPI. A
 * serializer that reads its data while being built throws when a flattened association or
 * `customAttribute` that uses it is rendered; one that reads its passthrough data is never
 * registered, or renders keys and associations its OpenAPI schema and `preloadFor` do not
 * describe. Read either inside a `customAttribute` callback, which runs only when the
 * serializer renders, not while it is built, and hand passthrough data on to the
 * serializers it renders.
 *
 * @param data - The object to render
 * @param passthroughData - Data available to this serializer's callbacks when it renders,
 *   and passed down to the serializers it renders. It must not decide what the serializer
 *   declares.
 * @returns The serializer builder for method chaining
 */
export default function ObjectSerializer<
  DataType extends object | null,
  PassthroughDataType extends object | undefined = undefined,
  // don't attempt to exclude Dream with `DataType extends Dream ? never : DataType`
  // because it breaks types when adding type generics to a serializer
  // e.g.: `<T extends MyClass>(data: MyClass) =>`
>(data: DataType, passthroughData?: PassthroughDataType) {
  return new ObjectSerializerBuilder<DataType, PassthroughDataType>(data, passthroughData)
}
