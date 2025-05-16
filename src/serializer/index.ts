import Dream from '../Dream.js'
import { DreamOrViewModelSerializerKey, ViewModel, ViewModelClass } from '../types/dream.js'
import {
  AutomaticSerializerAttributeOptions,
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
  return new SimpleObjectSerializerBuilder<DataType, PassthroughDataType>($data, $passthroughData)
}

export class DreamSerializerBuilder<
  DataTypeForOpenapi extends typeof Dream,
  MaybeNullDataType extends Dream | null,
  PassthroughDataType,
  DataType extends Exclude<MaybeNullDataType, null> = Exclude<MaybeNullDataType, null>,
> {
  protected attributes: SerializerAttribute[] = []
  protected delegatedAttributes: SerializerDelegatedAttribute[] = []
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
    AssociatedModelType extends DataType[AttributeName] extends Dream | ViewModel
      ? DataType[AttributeName]
      : never,
    SerializerOptions extends AssociatedModelType extends Dream | ViewModel
      ? {
          serializerKey?: DreamOrViewModelSerializerKey<AssociatedModelType>
        }
      : {
          serializerCallback: DreamSerializerCallback
          openapi?: { customSerializerRefPath: string }
        },
    Options extends {
      as?: string
      flatten?: boolean
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
        : never
      : never,
    SerializerOptions extends AssociatedModelType extends Dream | ViewModel
      ? {
          serializerKey?: DreamOrViewModelSerializerKey<AssociatedModelType>
        }
      : {
          serializerCallback: DreamSerializerCallback
          openapi?: { customSerializerRefPath: string }
        },
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

export class ViewModelSerializerBuilder<
  DataTypeForOpenapi extends ViewModelClass,
  MaybeNullDataType extends ViewModel | null,
  PassthroughDataType,
  DataType extends Exclude<MaybeNullDataType, null> = Exclude<MaybeNullDataType, null>,
> {
  protected attributes: SerializerAttribute[] = []
  protected delegatedAttributes: SerializerDelegatedAttribute[] = []
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
    Options extends NonAutomaticSerializerAttributeOptionsWithPossibleDecimalRenderOption,
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
    AssociatedModelType extends DataType[AttributeName] extends Dream | ViewModel
      ? DataType[AttributeName]
      : never,
    SerializerOptions extends AssociatedModelType extends Dream | ViewModel
      ? {
          serializerKey?: DreamOrViewModelSerializerKey<AssociatedModelType>
        }
      : {
          serializerCallback: DreamSerializerCallback
          openapi?: { customSerializerRefPath: string }
        },
    Options extends {
      as?: string
      flatten?: boolean
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
        : never
      : never,
    SerializerOptions extends AssociatedModelType extends Dream | ViewModel
      ? {
          serializerKey?: DreamOrViewModelSerializerKey<AssociatedModelType>
        }
      : {
          serializerCallback: DreamSerializerCallback
          openapi?: { customSerializerRefPath: string }
        },
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

export class SimpleObjectSerializerBuilder<
  MaybeNullDataType extends object | null,
  PassthroughDataType,
  DataType extends Exclude<MaybeNullDataType, null> = Exclude<MaybeNullDataType, null>,
> {
  protected attributes: SerializerAttribute[] = []
  protected delegatedAttributes: SerializerDelegatedAttribute[] = []
  protected customAttributes: SerializerCustomAttribute[] = []
  protected rendersOnes: SerializerRendersOne<DataType>[] = []
  protected rendersManys: SerializerRendersMany<DataType>[] = []
  protected _maybeNull: boolean = false
  protected serializerName: string

  constructor(
    protected $data: MaybeNullDataType,
    protected $passthroughData: PassthroughDataType = {} as PassthroughDataType
  ) {}

  public maybeNull() {
    this._maybeNull = true
    return this
  }

  public attribute<
    AttributeName extends keyof DataType & string,
    const Options extends NonAutomaticSerializerAttributeOptionsWithPossibleDecimalRenderOption,
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
    AssociatedModelType extends DataType[AttributeName] extends Dream | ViewModel
      ? DataType[AttributeName]
      : never,
    SerializerOptions extends AssociatedModelType extends Dream | ViewModel
      ? {
          serializerKey?: DreamOrViewModelSerializerKey<AssociatedModelType>
        }
      : {
          serializerCallback: DreamSerializerCallback
          openapi?: { customSerializerRefPath: string }
        },
    Options extends {
      as?: string
      flatten?: boolean
    } & SerializerOptions,
  >(name: AttributeName, options: Options) {
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
        : never
      : never,
    SerializerOptions extends AssociatedModelType extends Dream | ViewModel
      ? {
          serializerKey?: DreamOrViewModelSerializerKey<AssociatedModelType>
        }
      : {
          serializerCallback: DreamSerializerCallback
          openapi?: { customSerializerRefPath: string }
        },
    Options extends {
      as?: string
    } & SerializerOptions,
  >(name: AttributeName, options: Options) {
    this.rendersManys.push({
      name,
      options: options ?? {},
    })

    return this
  }
}
