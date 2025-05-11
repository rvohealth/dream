import Dream from '../../Dream.js'
import { DreamOrViewModelSerializerKey, ViewModel, ViewModelClass } from '../../types/dream.js'
import {
  AutomaticSerializerAttributeOptions,
  DreamSerializerCallback,
  InternalAnyTypedSerializerAttribute,
  InternalAnyTypedSerializerCustomAttribute,
  InternalAnyTypedSerializerDelegatedAttribute,
  InternalAnyTypedSerializerRendersMany,
  InternalAnyTypedSerializerRendersOne,
  NonAutomaticSerializerAttributeOptions,
  NonAutomaticSerializerAttributeOptionsWithPossibleDecimalRenderOption,
} from '../../types/serializer.js'

export default class DreamSerializerBuilder<
  DataTypeForOpenapi extends typeof Dream,
  MaybeNullDataType extends Dream | null,
  PassthroughDataType,
  DataType extends Exclude<MaybeNullDataType, null> = Exclude<MaybeNullDataType, null>,
> {
  protected attributes: InternalAnyTypedSerializerAttribute[] = []
  protected delegatedAttributes: InternalAnyTypedSerializerDelegatedAttribute[] = []
  protected customAttributes: InternalAnyTypedSerializerCustomAttribute[] = []
  protected rendersOnes: InternalAnyTypedSerializerRendersOne<DataType>[] = []
  protected rendersManys: InternalAnyTypedSerializerRendersMany<DataType>[] = []

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
    MaybeAttributeName extends keyof Schema[TableName]['columns'] | (keyof DataType & string),
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
      name: name as any,
      options: options ?? {},
    })

    return this
  }

  public delegatedAttribute<
    TargetName extends keyof DataType & string,
    TargetObject extends DataType[TargetName],
    AttributeName extends TargetObject extends object ? keyof TargetObject & string : never,
    Options extends NonAutomaticSerializerAttributeOptionsWithPossibleDecimalRenderOption,
  >(targetName: TargetName, name: AttributeName, options: Options) {
    this.delegatedAttributes.push({
      targetName,
      name: name as any,
      options: options ?? {},
    })

    return this
  }

  public jsonAttribute<
    AttributeName extends keyof DataType & string,
    Options extends NonAutomaticSerializerAttributeOptions,
  >(name: AttributeName, options: Options) {
    this.attributes.push({
      name,
      options,
    })

    return this
  }

  public customAttribute<
    Options extends Omit<NonAutomaticSerializerAttributeOptions, 'as'>,
    CallbackFn extends () => unknown,
  >(name: string, fn: CallbackFn, options: Options) {
    this.customAttributes.push({
      name,
      fn,
      options,
    })

    return this
  }

  public rendersOne<
    AttributeName extends keyof DataType & string,
    AssociatedModelType extends Exclude<DataType[AttributeName], null>,
    SerializerOptions extends AssociatedModelType extends Dream
      ?
          | {
              serializerKey?: DreamOrViewModelSerializerKey<AssociatedModelType>
            }
          | {
              serializerCallback: DreamSerializerCallback<AssociatedModelType>
            }
      : AssociatedModelType extends ViewModel
        ?
            | {
                viewModelClass: ViewModelClass
                serializerKey?: DreamOrViewModelSerializerKey<AssociatedModelType>
              }
            | {
                serializerCallback: DreamSerializerCallback<AssociatedModelType>
              }
        : AssociatedModelType extends object
          ? {
              serializerCallback: DreamSerializerCallback<AssociatedModelType>
            }
          : object,
    Options extends {
      as?: string
      flatten?: boolean
      optional?: boolean
    } & SerializerOptions,
  >(name: AttributeName, options?: Options) {
    this.rendersOnes.push({
      name,
      options: options ?? {},
    })

    return this
  }

  public rendersMany<
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
              serializerCallback: DreamSerializerCallback<AssociatedModelType>
            }
      : AssociatedModelType extends ViewModel
        ?
            | {
                viewModelClass: ViewModelClass
                serializerKey?: DreamOrViewModelSerializerKey<AssociatedModelType>
              }
            | {
                serializerCallback: DreamSerializerCallback<AssociatedModelType>
              }
        : AssociatedModelType extends object
          ? {
              serializerCallback: DreamSerializerCallback<AssociatedModelType>
            }
          : object,
    Options extends {
      as?: string
    } & SerializerOptions,
  >(name: AttributeName, options?: Options) {
    this.rendersManys.push({
      name,
      options: options ?? {},
    })

    return this
  }
}
