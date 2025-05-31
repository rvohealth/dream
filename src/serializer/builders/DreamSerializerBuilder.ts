import Dream from '../../Dream.js'
import { DreamOrViewModelSerializerKey, ViewModel, ViewModelClass } from '../../types/dream.js'
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
    protected $typeForOpenapi: DataTypeForOpenapi,
    protected data: MaybeNullDataType,
    protected passthroughData: PassthroughDataType = {} as PassthroughDataType
  ) {}

  public attribute<
    Schema extends DataType['schema'],
    TableName extends DataType['table'] & keyof Schema,
    MaybeAttributeName extends
      | keyof Schema[TableName]['columns']
      // don't attempt to exclude 'serializers' because it breaks types when adding
      // type generics to a serializer (e.g.: `<T extends MyClass>(data: MyClass) =>`)
      | (keyof DataType & string),
    AttributeName extends MaybeAttributeName extends keyof Schema[TableName]['columns']
      ? never
      : keyof DataType & string,
    Options extends NonAutomaticSerializerAttributeOptionsWithPossibleDecimalRenderOption,
  >(
    name: AttributeName,
    options: Options
  ): DreamSerializerBuilder<DataTypeForOpenapi, MaybeNullDataType, PassthroughDataType, DataType>

  public attribute<
    Schema extends DataType['schema'],
    TableName extends DataType['table'] & keyof Schema,
    AttributeName extends keyof Schema[TableName]['columns'] & keyof DataType & string,
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

  public delegatedAttribute<
    // don't attempt to exclude 'serializers' because it breaks types when adding
    // type generics to a serializer (e.g.: `<T extends MyClass>(data: MyClass) =>`)
    TargetName extends keyof DataType & string,
    TargetObject extends DataType[TargetName],
    AttributeName extends TargetObject extends object ? keyof TargetObject & string : never,
    Options extends NonAutomaticSerializerAttributeOptionsWithPossibleDecimalRenderOption,
  >(targetName: TargetName, name: AttributeName, options: Options) {
    this.attributes.push({
      type: 'delegatedAttribute',
      targetName,
      name: name as any,
      options: options ?? {},
    })

    return this
  }

  public jsonAttribute<
    // don't attempt to exclude 'serializers' because it breaks types when adding
    // type generics to a serializer (e.g.: `<T extends MyClass>(data: MyClass) =>`)
    AttributeName extends keyof DataType & string,
    Options extends NonAutomaticSerializerAttributeOptions,
  >(name: AttributeName, options: Options) {
    this.attributes.push({
      type: 'attribute',
      name,
      options,
    })

    return this
  }

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

  public rendersOne<
    // applying any type function to limit AttributeName breaks types when adding
    // type generics to a serializer (e.g.: `<T extends MyClass>(data: MyClass) =>`)
    // e.g., the following causes problems:
    // AttributeName extends NonArrayAttributes<DataType> & string,
    // and so does
    // AttributeName extends Exclude<DataType, 'serializers'> & string,
    AttributeName extends keyof DataType & string,
    AssociatedModelType extends Exclude<DataType[AttributeName], null>,
    SerializerOptions extends AssociatedModelType extends Dream
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
    } & SerializerOptions,
  >(name: AttributeName, options?: Options) {
    this.attributes.push({
      type: 'rendersOne',
      name,
      options: options ?? {},
    })

    return this
  }

  public rendersMany<
    // applying any type function to limit AttributeName breaks types when adding
    // type generics to a serializer (e.g.: `<T extends MyClass>(data: MyClass) =>`)
    // e.g., the following causes problems:
    // AttributeName extends ArrayAttributes<DataType> & string,
    AttributeName extends keyof DataType & string,
    AssociatedModelType extends DataType[AttributeName] extends (Dream | ViewModel)[]
      ? DataType[AttributeName] extends (infer U)[]
        ? U
        : object
      : object,
    SerializerOptions extends AssociatedModelType extends Dream
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
    } & SerializerOptions,
  >(name: AttributeName, options?: Options) {
    this.attributes.push({
      type: 'rendersMany',
      name,
      options: options ?? {},
    })

    return this
  }

  public render(passthrough: any = {}, opts: SerializerRendererOpts = {}) {
    return new SerializerRenderer(this, passthrough, opts).render()
  }
}
