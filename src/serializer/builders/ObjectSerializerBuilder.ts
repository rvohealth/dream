import Dream from '../../Dream.js'
import { DreamOrViewModelSerializerKey, ViewModel, ViewModelClass } from '../../types/dream.js'
import {
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

export default class ObjectSerializerBuilder<
  MaybeNullDataType extends object | null,
  PassthroughDataType,
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
    protected data: MaybeNullDataType,
    protected passthroughData: PassthroughDataType = {} as PassthroughDataType
  ) {}

  /**
   * Includes an attribute from the data object in the serialized output.
   *
   * For ObjectSerializer, the `openapi` option is always required since type
   * inference is not available for plain objects or ViewModels.
   *
   * @param name - The attribute name from the data object
   * @param options - Configuration options including required OpenAPI schema, default value, and output customization
   * @returns The serializer builder for method chaining
   *
   * @example
   * ```typescript
   * // Required OpenAPI schema
   * .attribute('email', {
   *   openapi: { type: 'string', format: 'email' }
   * })
   *
   * // With default value
   * .attribute('status', {
   *   openapi: { type: 'string' },
   *   default: 'active'
   * })
   *
   * // Rename output key
   * .attribute('email', {
   *   openapi: { type: 'string' },
   *   as: 'userEmail'
   * })
   * ```
   *
   * See: {@link https://your-docs-url.com/docs/serializers/attributes | Serializer Attributes Documentation}
   */
  public attribute<
    // don't attempt to exclude 'serializers' because it breaks types when adding
    // type generics to a serializer (e.g.: `<T extends MyClass>(data: MyClass) =>`)
    AttributeName extends keyof DataType & string,
    Options extends NonAutomaticSerializerAttributeOptionsWithPossibleDecimalRenderOption,
  >(name: AttributeName, options: Options) {
    this.attributes.push({
      type: 'attribute',
      name,
      options: options ?? {},
    })

    return this
  }

  /**
   * Includes an attribute from a nested object in the serialized output.
   *
   * Pulls up an attribute from a target object property. The `openapi` option
   * is always required. If the target object or the delegated attribute
   * is null/undefined, the `default` option value will be used if provided.
   *
   * @param targetName - The property name containing the target object
   * @param name - The attribute name within the target object
   * @param options - Configuration options including required OpenAPI schema, default value, and output customization
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
   * .delegatedAttribute('profile', 'displayName', {
   *   openapi: { type: 'string' },
   *   default: 'Anonymous User'
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
   * .customAttribute('fullName', () =>
   *   `${user.firstName} ${user.lastName}`,
   *   { openapi: { type: 'string' } }
   * )
   *
   * // Flattened object properties
   * .customAttribute('coordinates', () => ({ lat: 40.7, lng: -74.0 }), {
   *   flatten: true,
   *   openapi: {
   *     lat: { type: 'number' },
   *     lng: { type: 'number' }
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
   * For ObjectSerializer, explicit serializer configuration is always required
   * since association schemas cannot be inferred from plain objects.
   *
   * @param name - The association property name
   * @param options - Configuration options including required serializer and OpenAPI schema
   * @returns The serializer builder for method chaining
   *
   * @example
   * ```typescript
   * // With explicit serializer function
   * .rendersOne('owner', UserSerializer, {
   *   openapi: { $ref: '#/components/schemas/User' }
   * })
   *
   * // With Dream class reference
   * .rendersOne('creator', {
   *   dreamClass: User,
   *   serializerKey: 'summary',
   *   openapi: { $ref: '#/components/schemas/UserSummary' }
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
              dreamClass: typeof Dream
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
          : never,
    Options = {
      as?: string
      flatten?: boolean
      optional?: boolean
    } & SerializerOptions,
  >(name: AttributeName, options: Options) {
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
   * For ObjectSerializer, explicit serializer configuration is always required
   * since association schemas cannot be inferred from plain objects.
   *
   * @param name - The association property name (should be an array)
   * @param options - Configuration options including required serializer and OpenAPI schema
   * @returns The serializer builder for method chaining
   *
   * @example
   * ```typescript
   * // With explicit serializer function
   * .rendersMany('articles', ArticleSerializer, {
   *   openapi: {
   *     type: 'array',
   *     items: { $ref: '#/components/schemas/Article' }
   *   }
   * })
   *
   * // With ViewModel class reference
   * .rendersMany('comments', {
   *   viewModelClass: CommentViewModel,
   *   serializer: CommentViewModelSerializer,
   *   openapi: {
   *     type: 'array',
   *     items: { $ref: '#/components/schemas/Comment' }
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
      ? DataType[AttributeName] extends (Dream | ViewModel | object)[]
        ? DataType[AttributeName] extends (infer U)[]
          ? U
          : never
        : never
      : ProvidedAssociatedModelType,
    SerializerOptions = AssociatedModelType extends Dream
      ?
          | {
              dreamClass: typeof Dream
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
          : never,
    Options = {
      as?: string
    } & SerializerOptions,
  >(name: AttributeName, options: Options) {
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
   * const result = UserViewModelSerializer(userVm).render()
   * // Returns: { id: '123', email: 'user@example.com', ... }
   *
   * // With passthrough data for nested serializers
   * const result = UserViewModelSerializer(userVm).render({ currentUserId: '456' })
   * ```
   *
   * See: {@link https://your-docs-url.com/docs/serializers/render | Serializer Rendering Documentation}
   */
  public render(passthrough: any = {}, opts: SerializerRendererOpts = {}) {
    return new SerializerRenderer(this, passthrough, opts).render()
  }
}
