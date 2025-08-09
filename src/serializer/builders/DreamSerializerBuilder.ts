import Dream from '../../Dream.js'
import {
  DreamOrViewModelSerializerKey,
  DreamVirtualColumns,
  NonJsonDreamColumnNames,
  ViewModel,
  ViewModelClass,
} from '../../types/dream.js'
import { OpenapiSchemaBodyShorthand, OpenapiShorthandPrimitiveTypes } from '../../types/openapi.js'
import {
  AutomaticSerializerAttributeOptions,
  AutomaticSerializerAttributeOptionsForType,
  InternalAnyTypedSerializerAttribute,
  InternalAnyTypedSerializerCustomAttribute,
  InternalAnyTypedSerializerDelegatedAttribute,
  InternalAnyTypedSerializerRendersMany,
  InternalAnyTypedSerializerRendersOne,
  NonAutomaticSerializerAttributeOptionsWithPossibleDecimalRenderOption,
  SerializerAttributeOptionsForVirtualColumn,
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

  // `type` attribute
  public attribute<
    AttributeName extends NonJsonDreamColumnNames<DataType> & keyof DataType & 'type',
    Options extends AutomaticSerializerAttributeOptionsForType,
  >(
    name: AttributeName,
    options?: Options
  ): DreamSerializerBuilder<DataTypeForOpenapi, MaybeNullDataType, PassthroughDataType, DataType>

  // attribute is a virtual column
  public attribute<
    AttributeName extends DreamVirtualColumns<DataType>[number],
    Options extends SerializerAttributeOptionsForVirtualColumn,
  >(
    name: AttributeName,
    options?: Options
  ): DreamSerializerBuilder<DataTypeForOpenapi, MaybeNullDataType, PassthroughDataType, DataType>

  // attribute is not a non-json dream column name
  public attribute<
    // `keyof DataType` includes columns listed as properties, so, in order to exclude
    // non-json columns, we include NonJsonDreamColumnNames and then set those properties as `never`
    MaybeAttributeName extends NonJsonDreamColumnNames<DataType> | (keyof DataType & string),
    AttributeName extends MaybeAttributeName extends NonJsonDreamColumnNames<DataType>
      ? never
      : Exclude<keyof DataType, keyof Dream> & string,
    Options extends NonAutomaticSerializerAttributeOptionsWithPossibleDecimalRenderOption,
  >(
    name: AttributeName,
    options: Options
  ): DreamSerializerBuilder<DataTypeForOpenapi, MaybeNullDataType, PassthroughDataType, DataType>

  // attribute is a non-json dream column name
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
    ProvidedModelType = undefined,
    ProvidedAttributeName extends ProvidedModelType extends undefined
      ? undefined
      : Exclude<keyof ProvidedModelType, keyof Dream> = ProvidedModelType extends undefined
      ? undefined
      : Exclude<keyof ProvidedModelType, keyof Dream>,
    ActualDataType extends ProvidedModelType extends undefined
      ? DataType
      : ProvidedModelType = ProvidedModelType extends undefined ? DataType : ProvidedModelType,
    TargetName extends ProvidedAttributeName extends undefined
      ? Exclude<keyof ActualDataType, keyof Dream>
      : ProvidedAttributeName & keyof ActualDataType = ProvidedAttributeName extends undefined
      ? Exclude<keyof ActualDataType, keyof Dream>
      : ProvidedAttributeName & keyof ActualDataType,
    //

    TargetObject extends ActualDataType[TargetName] = ActualDataType[TargetName],
    AttributeName extends TargetObject extends object
      ? Exclude<keyof TargetObject, keyof Dream> & string
      : never = TargetObject extends object ? Exclude<keyof TargetObject, keyof Dream> & string : never,
    Options extends
      NonAutomaticSerializerAttributeOptionsWithPossibleDecimalRenderOption = NonAutomaticSerializerAttributeOptionsWithPossibleDecimalRenderOption,
  >(targetName: TargetName, name: AttributeName, options: Options) {
    this.attributes.push({
      type: 'delegatedAttribute',
      targetName: targetName as any,
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
    Options extends {
      openapi: OpenapiSchemaBodyShorthand | OpenapiShorthandPrimitiveTypes
      flatten?: boolean
    },
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
    ProvidedModelType = undefined,
    ProvidedAttributeName extends ProvidedModelType extends undefined
      ? undefined
      : Exclude<keyof ProvidedModelType, keyof Dream> = ProvidedModelType extends undefined
      ? undefined
      : Exclude<keyof ProvidedModelType, keyof Dream>,
    ActualDataType extends ProvidedModelType extends undefined
      ? DataType
      : ProvidedModelType = ProvidedModelType extends undefined ? DataType : ProvidedModelType,
    AttributeName extends ProvidedAttributeName extends undefined
      ? Exclude<keyof ActualDataType, keyof Dream>
      : ProvidedAttributeName & keyof ActualDataType = ProvidedAttributeName extends undefined
      ? Exclude<keyof ActualDataType, keyof Dream>
      : ProvidedAttributeName & keyof ActualDataType,
    //

    AssociatedModelType = Exclude<ActualDataType[AttributeName], null>,
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
    Options extends {
      as?: string
      flatten?: boolean
      optional?: boolean
    } & SerializerOptions = {
      as?: string
      flatten?: boolean
      optional?: boolean
    } & SerializerOptions,
  >(name: AttributeName, options?: Options) {
    this.attributes.push({
      type: 'rendersOne',
      name: name as any,
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
    ProvidedModelType = undefined,
    ProvidedAttributeName extends ProvidedModelType extends undefined
      ? undefined
      : Exclude<keyof ProvidedModelType, keyof Dream> = ProvidedModelType extends undefined
      ? undefined
      : Exclude<keyof ProvidedModelType, keyof Dream>,
    ActualDataType extends ProvidedModelType extends undefined
      ? DataType
      : ProvidedModelType = ProvidedModelType extends undefined ? DataType : ProvidedModelType,
    AttributeName extends ProvidedAttributeName extends undefined
      ? Exclude<keyof ActualDataType, keyof Dream>
      : ProvidedAttributeName & keyof ActualDataType = ProvidedAttributeName extends undefined
      ? Exclude<keyof ActualDataType, keyof Dream>
      : ProvidedAttributeName & keyof ActualDataType,
    //

    AssociatedModelType = ActualDataType[AttributeName] extends (Dream | ViewModel)[]
      ? ActualDataType[AttributeName] extends (infer U)[]
        ? U
        : object
      : object,
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
    Options extends {
      as?: string
      z?: AttributeName
    } & SerializerOptions = {
      as?: string
      z?: AttributeName
    } & SerializerOptions,
  >(name: AttributeName, options?: Options) {
    this.attributes.push({
      type: 'rendersMany',
      name: name as any,
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
