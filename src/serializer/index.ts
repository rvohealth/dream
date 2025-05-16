import Dream from '../Dream.js'
import { DreamOrViewModelClassSerializerKey, ViewModel, ViewModelClass } from '../types/dream.js'
import {
  AutomaticSerializerAttributeOptions,
  CustomSerializerOpenapiOpts,
  DreamSerializerCallback,
  NonAutomaticSerializerAttributeOptions,
  NonAutomaticSerializerAttributeOptionsWithPossibleDecimalRenderOption,
  SerializerAttribute,
  SerializerCustomAttribute,
  SerializerDelegatedAttribute,
  SerializerRendersMany,
  SerializerRendersOne,
} from '../types/serializer.js'

export const DEFAULT_SERIALIZER_KEY = 'default'

export function DreamSerializer<
  DreamClass extends typeof Dream,
  DataType extends Dream | null,
  PassthroughDataType extends object = object,
>(dreamClass: DreamClass, $data: DataType, $passthroughData?: PassthroughDataType) {
  return new DreamSerializerBuilder<DreamClass, DataType, PassthroughDataType>(
    dreamClass,
    $data,
    $passthroughData
  )
}

export function ViewModelSerializer<
  VMClass extends ViewModelClass,
  DataType extends ViewModel | null,
  PassthroughDataType extends object = object,
>(
  viewModelClass: VMClass,
  $data: DataType extends Dream ? never : DataType,
  $passthroughData?: PassthroughDataType
) {
  return new ViewModelSerializerBuilder<VMClass, DataType, PassthroughDataType>(
    viewModelClass,
    $data,
    $passthroughData
  )
}

export function SimpleObjectSerializer<
  DataType extends object | null,
  PassthroughDataType extends object = object,
>($data: DataType extends Dream ? never : DataType, $passthroughData?: PassthroughDataType) {
  return new SimpleObjectSerializerBuilder<DataType, PassthroughDataType>(undefined, $data, $passthroughData)
}

export class DreamSerializerBuilder<
  DataTypeForOpenapi extends typeof Dream,
  MaybeNullDataType extends Dream | null,
  PassthroughDataType,
  DataType extends Exclude<MaybeNullDataType, null> = Exclude<MaybeNullDataType, null>,
> {
  protected attributes: SerializerAttribute<DataType>[] = []
  protected delegatedAttributes: SerializerDelegatedAttribute<DataType>[] = []
  protected customAttributes: SerializerCustomAttribute[] = []
  protected rendersOnes: SerializerRendersOne<DataType>[] = []
  protected rendersManys: SerializerRendersMany<DataType>[] = []
  protected _maybeNull: boolean = false
  protected serializerName: string

  constructor(
    protected $typeForOpenapi: DataTypeForOpenapi,
    protected $data: MaybeNullDataType,
    protected $passthroughData: PassthroughDataType = {} as PassthroughDataType
  ) {}

  public maybeNull() {
    this._maybeNull = true
    return this
  }

  public attribute<
    AttributeName extends keyof DataType & string,
    Options extends AutomaticSerializerAttributeOptions<DataType, AttributeName>,
  >(name: AttributeName, options?: Options) {
    this.attributes.push({
      name,
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

  public customAttribute<Options extends Exclude<NonAutomaticSerializerAttributeOptions, 'as'>>(
    name: string,
    fn: (x: DataType, y?: PassthroughDataType) => unknown,
    options: Options
  ) {
    this.customAttributes.push({
      name,
      fn,
      options,
    })

    return this
  }

  public rendersOne<
    AttributeName extends keyof DataType & string,
    Options extends {
      as?: string
      flatten?: boolean
    } & (
      | {
          serializer: DreamSerializerCallback
          openapi: CustomSerializerOpenapiOpts
        }
      | {
          serializerKey?: DreamOrViewModelClassSerializerKey<DataTypeForOpenapi>
        }
    ),
  >(name: AttributeName, options?: Options) {
    this.rendersOnes.push({
      name,
      options: options ?? {},
    })

    return this
  }

  public rendersMany<
    AttributeName extends keyof DataType & string,
    Options extends {
      as?: string
    } & (
      | {
          serializer: DreamSerializerCallback
          openapi: CustomSerializerOpenapiOpts
        }
      | {
          serializerKey?: DreamOrViewModelClassSerializerKey<DataTypeForOpenapi>
        }
    ),
  >(name: AttributeName, options?: Options) {
    this.rendersManys.push({
      name,
      options: options ?? {},
    })

    return this
  }
}
