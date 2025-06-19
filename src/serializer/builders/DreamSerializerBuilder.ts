import Dream from '../../Dream.js'
import {
  DreamOrViewModelSerializerKey,
  NonJsonDreamColumnNames,
  ViewModel,
  ViewModelClass,
} from '../../types/dream.js'
import {
  AutomaticSerializerAttributeOptions,
  InternalAnyTypedSerializerAttribute,
  InternalAnyTypedSerializerCustomAttribute,
  InternalAnyTypedSerializerDelegatedAttribute,
  InternalAnyTypedSerializerRendersMany,
  InternalAnyTypedSerializerRendersOne,
  NonAutomaticSerializerAttributeOptions,
  NonAutomaticSerializerAttributeOptionsWithPossibleDecimalRenderOption,
  SerializerType,
} from '../../types/serializer.js'
import SerializerRenderer, { SerializerRendererOpts } from '../SerializerRenderer.js'

export default class DreamSerializerBuilder<
  DataTypeForOpenapi extends typeof Dream,
  MaybeNullDataType extends Dream | null,
  PassthroughDataType = any,
  DataType extends Exclude<MaybeNullDataType, null> = Exclude<MaybeNullDataType, null>,
> {
  protected attributes: (
    | InternalAnyTypedSerializerAttribute
    | InternalAnyTypedSerializerDelegatedAttribute
    | InternalAnyTypedSerializerCustomAttribute
    | InternalAnyTypedSerializerRendersOne<DataType>
    | InternalAnyTypedSerializerRendersMany<DataType>
  )[] = []

  public get isSerializer() {
    return true
  }

  constructor(
    protected $typeForOpenapi: DataTypeForOpenapi,
    protected data: MaybeNullDataType,
    protected passthroughData: PassthroughDataType = {} as PassthroughDataType
  ) {}

  /**
   * Includes an attribute from the data object in the serialized output.
   *
   * For DreamSerializer, OpenAPI types can often be inferred from database columns.
   * For json and jsonb columns and also virtual attributes (getters), the `openapi` option is required.
   *
   * @param name - The attribute name from the data object
   * @param options - Configuration options including OpenAPI schema, default value, and output customization
   * @returns The serializer builder for method chaining
   *
   * @example
   * ```typescript
   * // With type inference (database column)
   * .attribute('email')
   *
   * // With explicit OpenAPI type (virtual attribute)
   * .attribute('fullName', { openapi: { type: 'string' } })
   *
   * // With default value
   * .attribute('status', { default: 'active' })
   *
   * // Rename output key
   * .attribute('email', { as: 'userEmail' })
   * ```
   *
   * See: {@link https://your-docs-url.com/docs/serializers/attributes | Serializer Attributes Documentation}
   */
  public attribute<
    MaybeAttributeName extends
      | NonJsonDreamColumnNames<DataType>
      // don't attempt to exclude 'serializers' because it breaks types when adding
      // type generics to a serializer (e.g.: `<T extends MyClass>(data: MyClass) =>`)
      | (keyof DataType & string),
    AttributeName extends MaybeAttributeName extends NonJsonDreamColumnNames<DataType>
      ? never
      : keyof DataType & string,
    Options extends NonAutomaticSerializerAttributeOptionsWithPossibleDecimalRenderOption,
  >(
    name: AttributeName,
    options: Options
  ): DreamSerializerBuilder<DataTypeForOpenapi, MaybeNullDataType, PassthroughDataType, DataType>

  public attribute<
    AttributeName extends NonJsonDreamColumnNames<DataType> & keyof DataType & string,
    Options extends AutomaticSerializerAttributeOptions<DataType, AttributeName>,
  >(
    name: AttributeName,
    options?: Options
  ): DreamSerializerBuilder<DataTypeForOpenapi, MaybeNullDataType, PassthroughDataType, DataType>

  public attribute(name: unknown, options: unknown) {
    this.attributes.push({
      type: 'attribute',
      name: name as any,
      options: options ?? {},
    })

    return this
  }

  /**
   * Includes an attribute from a nested object in the serialized output.
   *
   * Serializes an attribute from a target object. If the target object or
   * the delegated attribute is null/undefined, the `default` option value
   * will be used if provided.
   *
   * @param targetName - The property name containing the target object
   * @param name - The attribute name within the target object
   * @param options - Configuration options including OpenAPI schema, default value, and output customization
   * @returns The serializer builder for method chaining
   *
   * @example
   * ```typescript
   * // Delegate to user.email
   * .delegatedAttribute('user', 'email', {
   *   openapi: { type: 'string', format: 'email' }
   * })
   *
   * // With default value for null target or attribute
   * .delegatedAttribute('user', 'displayName', {
   *   openapi: { type: 'string' },
   *   default: 'Unknown User'
   * })
   * ```
   *
   * See: {@link https://your-docs-url.com/docs/serializers/attributes | Serializer Attributes Documentation}
   */
  public delegatedAttribute<
    ProvidedTargetObjectType = undefined,
    // don't attempt to exclude 'serializers' because it breaks types when adding
    // type generics to a serializer (e.g.: `<T extends MyClass>(data: MyClass) =>`)
    TargetName extends keyof DataType & string = keyof DataType & string,
    TargetObject extends ProvidedTargetObjectType extends undefined
      ? DataType[TargetName]
      : ProvidedTargetObjectType = ProvidedTargetObjectType extends undefined
      ? DataType[TargetName]
      : ProvidedTargetObjectType,
    AttributeName extends TargetObject extends object
      ? keyof TargetObject & string
      : never = TargetObject extends object ? keyof TargetObject & string : never,
    Options extends
      NonAutomaticSerializerAttributeOptionsWithPossibleDecimalRenderOption = NonAutomaticSerializerAttributeOptionsWithPossibleDecimalRenderOption,
  >(targetName: TargetName, name: AttributeName, options: Options) {
    this.attributes.push({
      type: 'delegatedAttribute',
      targetName,
      name: name as any,
      options: options ?? {},
    })

    return this
  }

  /**
   * Includes a computed value in the serialized output.
   *
   * Executes a callback function to generate a custom attribute value.
   * The `openapi` option is always required since the return type cannot be inferred.
   *
   * @param name - The attribute name for the computed value
   * @param fn - Callback function that returns the computed value
   * @param options - Configuration options including required OpenAPI schema and optional flattening
   * @returns The serializer builder for method chaining
   *
   * @example
   * ```typescript
   * // Simple computed value
   * .customAttribute('initials', () =>
   *   `${user.firstName?.[0]}${user.lastName?.[0]}`.toUpperCase(),
   *   { openapi: { type: 'string' } }
   * )
   *
   * // Flattened object properties
   * .customAttribute('metadata', () => ({ age: 30, city: 'NYC' }), {
   *   flatten: true,
   *   openapi: {
   *     age: { type: 'integer' },
   *     city: { type: 'string' }
   *   }
   * })
   * ```
   *
   * See: {@link https://your-docs-url.com/docs/serializers/attributes | Serializer Attributes Documentation}
   */
  public customAttribute<
    Options extends Omit<NonAutomaticSerializerAttributeOptions, 'as'> & { flatten?: boolean },
    CallbackFn extends () => unknown,
  >(name: string, fn: CallbackFn, options: Options) {
    this.attributes.push({
      type: 'customAttribute',
      name,
      fn,
      options,
    })

    return this
  }

  /**
   * Includes a single associated object in the serialized output.
   *
   * When rendering a Dream association, the OpenAPI shape is automatically
   * inferred from that associated Dream's serializer.
   *
   * @param name - The association property name
   * @param options - Configuration options for serialization and schema definition
   * @returns The serializer builder for method chaining
   *
   * @example
   * ```typescript
   * // DreamSerializer with inference
   * .rendersOne('user') // Infers from Dream association
   *
   * // With specific serializer
   * .rendersOne('user', { serializerKey: 'summary' })
   *
   * // ObjectSerializer (explicit configuration required)
   * .rendersOne('owner', UserSerializer, {
   *   openapi: { $ref: '#/components/schemas/User' }
   * })
   * ```
   *
   * See: {@link https://your-docs-url.com/docs/serializers/associations | Serializer Associations Documentation}
   */
  public rendersOne<
    ProvidedAssociatedModelType = undefined,
    // applying any type function to limit AttributeName breaks types when adding
    // type generics to a serializer (e.g.: `<T extends MyClass>(data: MyClass) =>`)
    // e.g., the following causes problems:
    // AttributeName extends NonArrayAttributes<DataType> & string,
    // and so does
    // AttributeName extends Exclude<DataType, 'serializers'> & string,
    AttributeName extends keyof DataType & string = keyof DataType & string,
    AssociatedModelType = ProvidedAssociatedModelType extends undefined
      ? Exclude<DataType[AttributeName], null>
      : ProvidedAssociatedModelType,
    SerializerOptions = AssociatedModelType extends Dream
      ?
          | {
              serializerKey?: DreamOrViewModelSerializerKey<AssociatedModelType>
            }
          | {
              serializer: SerializerType<AssociatedModelType>
            }
      : AssociatedModelType extends ViewModel
        ?
            | {
                viewModelClass: ViewModelClass
                serializerKey?: DreamOrViewModelSerializerKey<AssociatedModelType>
              }
            | {
                serializer: SerializerType<AssociatedModelType>
              }
        : AssociatedModelType extends object
          ? {
              serializer: SerializerType<AssociatedModelType>
            }
          : object,
    Options = {
      as?: string
      flatten?: boolean
      optional?: boolean
    } & SerializerOptions,
  >(name: AttributeName, options?: Options) {
    this.attributes.push({
      type: 'rendersOne',
      name,
      options: options ?? {},
    })

    return this
  }

  /**
   * Includes an array of associated objects in the serialized output.
   *
   * When rendering a Dream association, the OpenAPI shape is automatically
   * inferred from that associated Dream's serializer.
   *
   * @param name - The association property name (should be an array)
   * @param options - Configuration options for serialization and schema definition
   * @returns The serializer builder for method chaining
   *
   * @example
   * ```typescript
   * // DreamSerializer with inference
   * .rendersMany('posts') // Infers from Dream association
   *
   * // With specific serializer
   * .rendersMany('posts', { serializerKey: 'summary' })
   *
   * // ObjectSerializer (explicit configuration required)
   * .rendersMany('articles', ArticleSerializer, {
   *   openapi: {
   *     type: 'array',
   *     items: { $ref: '#/components/schemas/Article' }
   *   }
   * })
   * ```
   *
   * See: {@link https://your-docs-url.com/docs/serializers/associations | Serializer Associations Documentation}
   */
  public rendersMany<
    ProvidedAssociatedModelType = undefined,
    // applying any type function to limit AttributeName breaks types when adding
    // type generics to a serializer (e.g.: `<T extends MyClass>(data: MyClass) =>`)
    // e.g., the following causes problems:
    // AttributeName extends ArrayAttributes<DataType> & string,
    AttributeName extends keyof DataType & string = keyof DataType & string,
    AssociatedModelType = ProvidedAssociatedModelType extends undefined
      ? DataType[AttributeName] extends (Dream | ViewModel)[]
        ? DataType[AttributeName] extends (infer U)[]
          ? U
          : object
        : object
      : ProvidedAssociatedModelType,
    SerializerOptions = AssociatedModelType extends Dream
      ?
          | {
              serializerKey?: DreamOrViewModelSerializerKey<AssociatedModelType>
            }
          | {
              serializer: SerializerType<AssociatedModelType>
            }
      : AssociatedModelType extends ViewModel
        ?
            | {
                viewModelClass: ViewModelClass
                serializerKey?: DreamOrViewModelSerializerKey<AssociatedModelType>
              }
            | {
                serializer: SerializerType<AssociatedModelType>
              }
        : AssociatedModelType extends object
          ? {
              serializer: SerializerType<AssociatedModelType>
            }
          : object,
    Options = {
      as?: string
    } & SerializerOptions,
  >(name: AttributeName, options?: Options) {
    this.attributes.push({
      type: 'rendersMany',
      name,
      options: options ?? {},
    })

    return this
  }

  /**
   * Executes the serializer and returns the serialized output.
   *
   * This method processes all defined attributes, custom attributes, delegated attributes,
   * and associations to produce the final serialized object. The result is suitable for
   * JSON.stringify() and API responses.
   *
   * @param passthrough - Additional data to pass through to nested serializers
   * @param opts - Rendering options for customizing the serialization process
   * @returns The serialized object
   *
   * @example
   * ```typescript
   * const result = UserSerializer(user).render()
   * // Returns: { id: 1, email: 'user@example.com', ... }
   *
   * // With passthrough data
   * const result = UserSerializer(user).render({ currentUserId: 123 })
   * ```
   *
   * See: {@link https://your-docs-url.com/docs/serializers/render | Serializer Rendering Documentation}
   */
  public render(passthrough: any = {}, opts: SerializerRendererOpts = {}) {
    return new SerializerRenderer(this, passthrough, opts).render()
  }
}
