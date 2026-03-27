import Dream from '../../Dream.js'
import {
  DreamOrViewModelSerializerKey,
  DreamVirtualColumns,
  NonJsonDreamColumnNames,
  ViewModel,
  ViewModelClass,
} from '../../types/dream.js'
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

  constructor(
    protected $typeForOpenapi: DataTypeForOpenapi,
    protected data: MaybeNullDataType,
    protected passthroughData: PassthroughDataType = {} as PassthroughDataType
  ) {}

  /**
   * Includes an attribute from the data object in the serialized output.
   *
   * For DreamSerializer, OpenAPI types are automatically inferred from database columns.
   * For json/jsonb columns and virtual attributes (getters), the `openapi` option is required.
   *
   * @param name - The attribute name from the data object
   * @param options - Configuration options:
   *   - `as` - Rename the attribute key in the serialized output and OpenAPI shape
   *   - `default` - Value to use when the attribute is undefined (not available for `type` columns)
   *   - `openapi` - OpenAPI schema definition; required for json/jsonb columns and non-virtual
   *     getters, optional for standard columns (where it can supplement inferred types with a
   *     `description`), and optional for `@deco.Virtual()` columns (where the type is inferred
   *     from the decorator)
   *   - `precision` - Round decimal values to the specified number of decimal places (0–9)
   *     during rendering; does not affect the OpenAPI shape (not available for `type` or
   *     virtual columns)
   *   - `required` - Set to `false` to mark the attribute as optional in the OpenAPI schema;
   *     when omitted, attributes are required by default, meaning `undefined` values will
   *     serialize as `null` (not available for `type` columns)
   * @returns The serializer builder for method chaining
   *
   * @example
   * ```typescript
   * // With type inference (database column)
   * .attribute('email')
   *
   * // With explicit OpenAPI type (virtual attribute or json column)
   * .attribute('fullName', { openapi: { type: 'string' } })
   *
   * // With default value
   * .attribute('status', { default: 'pending' })
   *
   * // Rename output key
   * .attribute('email', { as: 'userEmail' })
   *
   * // Round decimal to 2 places
   * .attribute('price', { precision: 2 })
   *
   * // Mark as optional in OpenAPI (omitted from response when undefined)
   * .attribute('deletedAt', { required: false })
   * ```
   */

  // `type` attribute
  public attribute(
    name: NonJsonDreamColumnNames<DataType> & keyof DataType & 'type',
    options?: AutomaticSerializerAttributeOptionsForType
  ): DreamSerializerBuilder<DataTypeForOpenapi, MaybeNullDataType, PassthroughDataType, DataType>

  // attribute is a virtual column
  public attribute(
    name: DreamVirtualColumns<DataType>[number],
    options?: SerializerAttributeOptionsForVirtualColumn
  ): DreamSerializerBuilder<DataTypeForOpenapi, MaybeNullDataType, PassthroughDataType, DataType>

  // attribute is not a non-json dream column name
  public attribute<
    // `keyof DataType` includes columns listed as properties, so, in order to exclude
    // non-json columns, we include NonJsonDreamColumnNames and then set those properties as `never`
    MaybeAttributeName extends NonJsonDreamColumnNames<DataType> | (keyof DataType & string),
    AttributeName extends MaybeAttributeName extends NonJsonDreamColumnNames<DataType>
      ? never
      : Exclude<keyof DataType, keyof Dream> & string,
  >(
    name: AttributeName,
    options: NonAutomaticSerializerAttributeOptionsWithPossibleDecimalRenderOption
  ): DreamSerializerBuilder<DataTypeForOpenapi, MaybeNullDataType, PassthroughDataType, DataType>

  // attribute is a non-json dream column name
  public attribute<AttributeName extends NonJsonDreamColumnNames<DataType> & keyof DataType & string>(
    name: AttributeName,
    options?: AutomaticSerializerAttributeOptions
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
   * Accesses `targetName.name` on the data object. If the target object
   * or the delegated attribute is null/undefined, the `default` option value
   * will be used if provided.
   *
   * When the target is a Dream model, OpenAPI types may be automatically inferred
   * for standard database columns. For json/jsonb columns or non-Dream targets,
   * the `openapi` option is required.
   *
   * @param targetName - The property name containing the target object (e.g., an association name)
   * @param name - The attribute name within the target object
   * @param options - Configuration options:
   *   - `as` - Rename the attribute key in the serialized output and OpenAPI shape
   *     (e.g., delegating `'user', 'email'` with `as: 'userEmail'` outputs the value
   *     under `userEmail`)
   *   - `default` - Value to use when the target object or its attribute is null/undefined
   *   - `openapi` - OpenAPI schema definition; required for non-Dream targets and json/jsonb
   *     columns, optional for standard Dream columns (where types are inferred)
   *   - `optional` - Set to `true` to indicate the value can be null in the OpenAPI schema
   *     (wraps the type in `anyOf: [schema, { type: 'null' }]`). For Dream models, this is
   *     auto-inferred from optional BelongsTo associations. Use this when delegating through
   *     a HasOne or other nullable association.
   *   - `precision` - Round decimal values to the specified number of decimal places (0–9)
   *     during rendering; does not affect the OpenAPI shape
   *   - `required` - Set to `false` to mark the attribute as optional in the OpenAPI schema;
   *     when omitted, attributes are required by default
   * @returns The serializer builder for method chaining
   *
   * @example
   * ```typescript
   * // Delegate to a Dream association's column (type inferred)
   * .delegatedAttribute('currentLocalizedText', 'title', { openapi: 'string' })
   *
   * // With default value for null target or attribute
   * .delegatedAttribute('user', 'displayName', {
   *   openapi: { type: 'string' },
   *   default: 'Unknown User'
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
    ProvidedTargetName extends ProvidedModelType extends undefined
      ? undefined
      : Exclude<keyof ProvidedModelType, keyof Dream> = ProvidedModelType extends undefined
      ? undefined
      : Exclude<keyof ProvidedModelType, keyof Dream>,
    ActualDataType extends ProvidedModelType extends undefined
      ? InstanceType<DataTypeForOpenapi>
      : ProvidedModelType = ProvidedModelType extends undefined
      ? InstanceType<DataTypeForOpenapi>
      : ProvidedModelType,
    TargetName extends ProvidedTargetName extends undefined
      ? Exclude<keyof ActualDataType, keyof Dream>
      : ProvidedTargetName & keyof ActualDataType = ProvidedTargetName extends undefined
      ? Exclude<keyof ActualDataType, keyof Dream>
      : ProvidedTargetName & keyof ActualDataType,
    //

    AssociatedModelType = Exclude<ActualDataType[TargetName], null>,
    TargetAttributeName extends AssociatedModelType extends object
      ? Exclude<keyof AssociatedModelType, keyof Dream> & string
      : never = AssociatedModelType extends object
      ? Exclude<keyof AssociatedModelType, keyof Dream> & string
      : never,
  >(
    targetName: TargetName,
    name: TargetAttributeName,
    options?: AssociatedModelType extends Dream
      ? TargetAttributeName extends NonJsonDreamColumnNames<AssociatedModelType> &
          keyof AssociatedModelType &
          'type'
        ? AutomaticSerializerAttributeOptionsForType & { optional?: boolean }
        : TargetAttributeName extends DreamVirtualColumns<AssociatedModelType>[number]
          ? SerializerAttributeOptionsForVirtualColumn
          : TargetAttributeName extends NonJsonDreamColumnNames<AssociatedModelType> &
                keyof AssociatedModelType &
                string
            ?
                | (AutomaticSerializerAttributeOptions & { optional?: boolean })
                | NonAutomaticSerializerAttributeOptionsWithPossibleDecimalRenderOption
            : NonAutomaticSerializerAttributeOptionsWithPossibleDecimalRenderOption
      : NonAutomaticSerializerAttributeOptionsWithPossibleDecimalRenderOption
  ) {
    this.attributes.push({
      type: 'delegatedAttribute',
      targetName: targetName as any,
      name: name as any,
      options: (options as any) ?? {},
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
   * @param options - Configuration options:
   *   - `openapi` - (required) OpenAPI schema definition for the computed value
   *   - `as` - Rename the attribute key in the serialized output and OpenAPI shape
   *   - `default` - Value to use when the callback returns undefined
   *   - `flatten` - When `true`, spreads the returned object's properties directly into the
   *     parent serialized output instead of nesting them under `name`; the `openapi` option
   *     should then define each flattened property individually
   *   - `precision` - Round decimal values to the specified number of decimal places (0–9)
   *     during rendering; does not affect the OpenAPI shape
   *   - `required` - Set to `false` to mark the attribute as optional in the OpenAPI schema;
   *     when omitted, attributes are required by default
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
   * .customAttribute('coordinates', () => ({ lat: 40.7, lng: -74.0 }), {
   *   flatten: true,
   *   openapi: {
   *     lat: { type: 'number' },
   *     lng: { type: 'number' }
   *   }
   * })
   *
   * // With decimal precision
   * .customAttribute('averageRating', () => calculateAverage(ratings), {
   *   openapi: 'decimal',
   *   precision: 2
   * })
   * ```
   */

  public customAttribute(
    name: string,
    fn: () => unknown,
    options: NonAutomaticSerializerAttributeOptionsWithPossibleDecimalRenderOption & {
      flatten?: boolean
    }
  ) {
    this.attributes.push({
      type: 'customAttribute',
      name,
      fn,
      options: options as any,
    })

    return this
  }

  /**
   * Includes a single associated object in the serialized output.
   *
   * When rendering a Dream association, the serializer and OpenAPI shape are automatically
   * inferred from that associated Dream model's registered serializers.
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
   *   - `serializerKey` - Use a specific serializer key from the associated Dream model's
   *     registered serializers (e.g., `'summary'`)
   *   - `serializer` - Provide an explicit serializer function instead of using the
   *     associated model's registered serializers
   *
   *   For ViewModel associations, one of these is required:
   *   - `viewModelClass` + optional `serializerKey`
   *   - `serializer`
   *
   *   For non-Dream/non-ViewModel associations:
   *   - `serializer` is required
   * @returns The serializer builder for method chaining
   *
   * @example
   * ```typescript
   * // Auto-infer serializer from Dream association
   * .rendersOne('profile')
   *
   * // With specific serializer key
   * .rendersOne('user', { serializerKey: 'summary' })
   *
   * // Allow null association
   * .rendersOne('approver', { optional: true })
   *
   * // Flatten into parent object
   * .rendersOne('candidate', { serializerKey: 'summary', flatten: true })
   *
   * // Explicit serializer function
   * .rendersOne('owner', { serializer: CustomOwnerSerializer })
   * ```
   */
  public rendersOne<
    ProvidedModelType = undefined,
    ProvidedAttributeName extends ProvidedModelType extends undefined
      ? undefined
      : Exclude<keyof ProvidedModelType, keyof Dream> = ProvidedModelType extends undefined
      ? undefined
      : Exclude<keyof ProvidedModelType, keyof Dream>,
    ActualDataType extends ProvidedModelType extends undefined
      ? InstanceType<DataTypeForOpenapi>
      : ProvidedModelType = ProvidedModelType extends undefined
      ? InstanceType<DataTypeForOpenapi>
      : ProvidedModelType,
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
              serializer?: SerializerType
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
    BaseOptions = {
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
       * allowing `null` when the association doesn't resolve. By default,
       * `rendersOne` expects the association to be present. Set this to `true`
       * for associations that may not exist, such as passthrough-conditional
       * HasOne associations.
       *
       * ```ts
       * .rendersOne('currentUserFavorite', { optional: true })
       * ```
       */
      optional?: boolean
    },
  >(name: AttributeName, options?: BaseOptions & SerializerOptions) {
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
   * When rendering a Dream association, the serializer and OpenAPI shape are automatically
   * inferred from that associated Dream model's registered serializers.
   *
   * @param name - The association property name (should resolve to an array)
   * @param options - Configuration options:
   *   - `as` - Rename the association key in the serialized output
   *   - `serializerKey` - Use a specific serializer key from the associated Dream model's
   *     registered serializers (e.g., `'summary'`)
   *   - `serializer` - Provide an explicit serializer function instead of using the
   *     associated model's registered serializers
   *
   *   For ViewModel associations, one of these is required:
   *   - `viewModelClass` + optional `serializerKey`
   *   - `serializer`
   *
   *   For non-Dream/non-ViewModel associations:
   *   - `serializer` is required
   * @returns The serializer builder for method chaining
   *
   * @example
   * ```typescript
   * // Auto-infer serializer from Dream association
   * .rendersMany('rooms')
   *
   * // With specific serializer key
   * .rendersMany('rooms', { serializerKey: 'summary' })
   *
   * // Explicit serializer function (for non-Dream objects)
   * .rendersMany('bedTypes', { serializer: BedTypeSerializer })
   *
   * // Rename output key
   * .rendersMany('rooms', { serializerKey: 'forGuests', as: 'guestRooms' })
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
      ? InstanceType<DataTypeForOpenapi>
      : ProvidedModelType = ProvidedModelType extends undefined
      ? InstanceType<DataTypeForOpenapi>
      : ProvidedModelType,
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
              serializer?: SerializerType
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
    BaseOptions = {
      as?: string
    },
  >(name: AttributeName, options?: BaseOptions & SerializerOptions) {
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
   * const result = UserSerializer(user).render()
   * // Returns: { id: 1, email: 'user@example.com', ... }
   *
   * // With passthrough data for nested serializers
   * const result = UserSerializer(user).render({ currentUserId: 123 })
   * ```
   */
  public render(passthrough: any = {}, opts: SerializerRendererOpts = {}) {
    return new SerializerRenderer(this, passthrough, opts).render()
  }
}
