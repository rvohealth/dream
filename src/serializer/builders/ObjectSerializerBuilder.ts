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
   * @param options - Configuration options:
   *   - `openapi` - (required) OpenAPI schema definition for the attribute
   *   - `as` - Rename the attribute key in the serialized output and OpenAPI shape
   *   - `default` - Value to use when the attribute is undefined
   *   - `precision` - Round decimal values to the specified number of decimal places (0–9)
   *     during rendering; does not affect the OpenAPI shape
   *   - `required` - Set to `false` to mark the attribute as optional in the OpenAPI schema;
   *     when omitted, attributes are required by default, meaning `undefined` values will
   *     serialize as `null`
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
   *
   * // Round decimal to 2 places
   * .attribute('price', {
   *   openapi: 'decimal',
   *   precision: 2
   * })
   *
   * // Mark as optional in OpenAPI (omitted from response when undefined)
   * .attribute('nickname', {
   *   openapi: 'string',
   *   required: false
   * })
   * ```
   */
  public attribute<
    // don't attempt to exclude 'serializers' because it breaks types when adding
    // type generics to a serializer (e.g.: `<T extends MyClass>(data: MyClass) =>`)
    AttributeName extends keyof DataType & string,
  >(name: AttributeName, options: NonAutomaticSerializerAttributeOptionsWithPossibleDecimalRenderOption) {
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
   * Accesses `targetName.name` on the data object. The `openapi` option is always
   * required. If the target object or the delegated attribute is null/undefined,
   * the `default` option value will be used if provided.
   *
   * @param targetName - The property name containing the target object
   * @param name - The attribute name within the target object
   * @param options - Configuration options:
   *   - `openapi` - (required) OpenAPI schema definition for the attribute
   *   - `as` - Rename the attribute key in the serialized output and OpenAPI shape
   *     (e.g., delegating `'profile', 'avatarUrl'` with `as: 'avatar'` outputs the value
   *     under `avatar`)
   *   - `default` - Value to use when the target object or its attribute is null/undefined
   *   - `precision` - Round decimal values to the specified number of decimal places (0–9)
   *     during rendering; does not affect the OpenAPI shape
   *   - `required` - Set to `false` to mark the attribute as optional in the OpenAPI schema;
   *     when omitted, attributes are required by default
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
   *
   * // Rename the output key
   * .delegatedAttribute('profile', 'avatarUrl', {
   *   openapi: 'string',
   *   as: 'avatar'
   * })
   * ```
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
  >(
    targetName: TargetName,
    name: AttributeName,
    options: NonAutomaticSerializerAttributeOptionsWithPossibleDecimalRenderOption
  ) {
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
   * Unlike DreamSerializerBuilder's `customAttribute`, this version does not support `as`
   * or `precision`.
   *
   * @param name - The attribute name for the computed value
   * @param fn - Callback function that returns the computed value
   * @param options - Configuration options:
   *   - `openapi` - (required) OpenAPI schema definition for the computed value
   *   - `default` - Value to use when the callback returns undefined
   *   - `flatten` - When `true`, spreads the returned object's properties directly into the
   *     parent serialized output instead of nesting them under `name`; the `openapi` option
   *     should then define each flattened property individually
   *   - `required` - Set to `false` to mark the attribute as optional in the OpenAPI schema;
   *     when omitted, attributes are required by default
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
   */
  public customAttribute(
    name: string,
    fn: () => unknown,
    options: Omit<NonAutomaticSerializerAttributeOptions, 'as'> & { flatten?: boolean }
  ) {
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
   * @param options - Configuration options:
   *   - `as` - Rename the association key in the serialized output
   *   - `flatten` - When `true`, spreads the rendered association's attributes directly into
   *     the parent serialized output instead of nesting them under `name`. Be aware of
   *     attribute shadowing: if the parent and flattened association share attribute names
   *     (e.g., `id`), the flattened association's values overwrite the parent's
   *   - `optional` - When `true`, allows the association to be null/missing without causing
   *     an `OpenapiResponseValidationFailure` during Psychic controller unit specs. By default,
   *     `rendersOne` expects the association to be present (mirroring the `optional` option on
   *     `@deco.BelongsTo`). Set this to `true` when the association is genuinely nullable
   *
   *   For Dream associations:
   *   - `dreamClass` - The Dream model class, enabling serializer inference; when specified,
   *     `serializerKey` may also be provided to select a specific registered serializer
   *   - `serializer` - Provide an explicit serializer function
   *
   *   For ViewModel associations:
   *   - `viewModelClass` + optional `serializerKey`
   *   - `serializer`
   *
   *   For non-Dream/non-ViewModel associations:
   *   - `serializer` is required
   * @returns The serializer builder for method chaining
   *
   * @example
   * ```typescript
   * // With explicit serializer function
   * .rendersOne('owner', { serializer: CustomOwnerSerializer })
   *
   * // With Dream class reference and serializer key
   * .rendersOne('creator', {
   *   dreamClass: User,
   *   serializerKey: 'summary'
   * })
   *
   * // Allow null association
   * .rendersOne('approver', { serializer: UserSerializer, optional: true })
   *
   * // Flatten into parent object
   * .rendersOne('profile', { serializer: ProfileSerializer, flatten: true })
   * ```
   */
  public rendersOne<
    ProvidedModelType = undefined,
    ProvidedAttributeName extends ProvidedModelType extends undefined
      ? undefined
      : keyof ProvidedModelType = ProvidedModelType extends undefined ? undefined : keyof ProvidedModelType,
    ActualDataType extends ProvidedModelType extends undefined
      ? DataType
      : ProvidedModelType = ProvidedModelType extends undefined ? DataType : ProvidedModelType,
    AttributeName extends ProvidedAttributeName extends undefined
      ? keyof ActualDataType
      : ProvidedAttributeName & keyof ActualDataType = ProvidedAttributeName extends undefined
      ? keyof ActualDataType
      : ProvidedAttributeName & keyof ActualDataType,
    //

    AssociatedModelType = Exclude<ActualDataType[AttributeName], null>,
    SerializerOptions = AssociatedModelType extends Dream
      ?
          | {
              dreamClass: typeof Dream
              serializerKey?: DreamOrViewModelSerializerKey<AssociatedModelType>
            }
          | {
              serializer: SerializerType
            }
      : AssociatedModelType extends ViewModel
        ?
            | {
                viewModelClass: ViewModelClass
                serializerKey?: DreamOrViewModelSerializerKey<AssociatedModelType>
              }
            | {
                serializer: SerializerType
              }
        : {
            serializer: SerializerType
          },
  >(
    name: AttributeName,
    options: {
      /**
       * Rename the association key in the serialized output.
       */
      as?: string

      /**
       * If `true`, the rendered association's attributes are merged directly into
       * the parent object instead of being nested under the association key.
       */
      flatten?: boolean

      /**
       * If `true`, the association is treated as nullable in the OpenAPI spec,
       * allowing `null` when the association doesn't resolve. Set this for
       * associations that may not exist.
       */
      optional?: boolean
    } & SerializerOptions
  ) {
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
   * For ObjectSerializer, explicit serializer configuration is always required
   * since association schemas cannot be inferred from plain objects.
   *
   * @param name - The association property name (should resolve to an array)
   * @param options - Configuration options:
   *   - `as` - Rename the association key in the serialized output
   *
   *   For Dream associations:
   *   - `dreamClass` - The Dream model class, enabling serializer inference; when specified,
   *     `serializerKey` may also be provided to select a specific registered serializer
   *   - `serializer` - Provide an explicit serializer function
   *
   *   For ViewModel associations:
   *   - `viewModelClass` + optional `serializerKey`
   *   - `serializer`
   *
   *   For non-Dream/non-ViewModel associations:
   *   - `serializer` is required
   * @returns The serializer builder for method chaining
   *
   * @example
   * ```typescript
   * // With explicit serializer function
   * .rendersMany('articles', { serializer: ArticleSerializer })
   *
   * // With Dream class reference and serializer key
   * .rendersMany('posts', {
   *   dreamClass: Post,
   *   serializerKey: 'summary'
   * })
   *
   * // With ViewModel class reference
   * .rendersMany('comments', {
   *   viewModelClass: CommentViewModel,
   *   serializer: CommentViewModelSerializer
   * })
   *
   * // Rename output key
   * .rendersMany('articles', { serializer: ArticleSerializer, as: 'posts' })
   * ```
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
              dreamClass: typeof Dream
              serializerKey?: DreamOrViewModelSerializerKey<AssociatedModelType>
            }
          | {
              serializer: SerializerType
            }
      : AssociatedModelType extends ViewModel
        ?
            | {
                viewModelClass: ViewModelClass
                serializerKey?: DreamOrViewModelSerializerKey<AssociatedModelType>
              }
            | {
                serializer: SerializerType
              }
        : {
            serializer: SerializerType
          },
  >(
    name: AttributeName,
    options: {
      as?: string
      preRender?: (records: any[]) => any[]
    } & SerializerOptions
  ) {
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
   * Processes all defined attributes, custom attributes, delegated attributes,
   * and associations to produce the final serialized object.
   *
   * @param passthrough - Additional data to pass through to nested serializers
   *   (e.g., locale, current user context)
   * @param opts - Rendering options for customizing the serialization process
   * @returns The serialized object, suitable for JSON responses
   *
   * @example
   * ```typescript
   * const result = UserViewModelSerializer(userVm).render()
   * // Returns: { id: '123', email: 'user@example.com', ... }
   *
   * // With passthrough data for nested serializers
   * const result = UserViewModelSerializer(userVm).render({ currentUserId: '456' })
   * ```
   */
  public render(passthrough: any = {}, opts: SerializerRendererOpts = {}) {
    return new SerializerRenderer(this, passthrough, opts).render()
  }
}
