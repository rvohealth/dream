import Dream from '../Dream.js'
import { DreamAttributeDbTypes, ViewModel, ViewModelClass } from '../types/dream.js'
import { OpenapiSchemaBodyShorthand, OpenapiShorthandPrimitiveTypes } from '../types/openapi.js'
import {
  AttributeRenderOptions,
  CustomSerializerOpenapiOpts,
  DecimalShorthandAttributeRenderOptions,
  ExtraOpenapiOptionsForAutomaticallySetOpenapi,
  RendersManyOpts,
  RendersOneOpts,
  SerializerAttribute,
  SerializerAttributeFunction,
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
  return new DreamSerializerBuilder<VMClass, DataType, PassthroughDataType>(
    viewModelClass,
    $data,
    $passthroughData
  )
}

export function SimpleObjectSerializer<
  DataType extends object | null,
  PassthroughDataType extends object = object,
>($data: DataType extends Dream ? never : DataType, $passthroughData?: PassthroughDataType) {
  return new DreamSerializerBuilder<undefined, DataType, PassthroughDataType>(
    undefined,
    $data,
    $passthroughData
  )
}

export class DreamSerializerBuilder<
  DataTypeForOpenapi extends typeof Dream | ViewModelClass | undefined,
  DataType extends Dream | ViewModel | object | null,
  PassthroughDataType,
> {
  protected attributes: SerializerAttribute<DataType>[] = []
  protected delegatedAttributes: SerializerDelegatedAttribute<DataType>[] = []
  protected customAttributes: SerializerAttributeFunction[] = []
  protected rendersOnes: SerializerRendersOne<DataType>[] = []
  protected rendersManys: SerializerRendersMany<DataType>[] = []
  protected _maybeNull: boolean = false
  protected serializerName: string

  constructor(
    protected $typeForOpenapi: DataTypeForOpenapi,
    protected $data: DataType,
    protected $passthroughData: PassthroughDataType = {} as PassthroughDataType
  ) {}

  public maybeNull() {
    this._maybeNull = true
    return this
  }

  // first overload: for non-Dream DataTypeForOpenapi
  public attribute<
    AttributeName extends keyof Exclude<DataType, null> & string,
    OpenapiOptions extends OpenapiSchemaBodyShorthand | OpenapiShorthandPrimitiveTypes | null,
    RenderOptions extends OpenapiOptions extends
      | 'decimal'
      | 'decimal[]'
      | ['decimal', 'null']
      | ['decimal[]', 'null']
      ? DecimalShorthandAttributeRenderOptions
      : AttributeRenderOptions,
  >(
    this: DreamSerializerBuilder<ViewModelClass | undefined, DataType, PassthroughDataType>,
    name: AttributeName,
    openapi: OpenapiOptions,
    renderOptions?: RenderOptions
  ): DreamSerializerBuilder<DataTypeForOpenapi, DataType, PassthroughDataType>

  // second overload: when DataTypeForOpenapi extends typeof Dream
  public attribute<
    AttributeName extends keyof Exclude<DataType, null> & string,
    OpenapiOptions extends ExtraOpenapiOptionsForAutomaticallySetOpenapi | null,
    NonNullDataType extends Exclude<DataType, null>,
    RenderOptions extends NonNullDataType extends Dream
      ? DreamAttributeDbTypes<NonNullDataType>[AttributeName] extends
          | 'decimal'
          | 'decimal[]'
          | 'numeric'
          | 'numeric[]'
        ? DecimalShorthandAttributeRenderOptions
        : AttributeRenderOptions
      : never,
  >(
    this: DreamSerializerBuilder<typeof Dream, DataType, PassthroughDataType>,
    name: AttributeName,
    openapi?: OpenapiOptions,
    renderOptions?: RenderOptions
  ): DreamSerializerBuilder<DataTypeForOpenapi, DataType, PassthroughDataType>

  // Implementation
  public attribute(
    name: any,
    openapi?: any,
    renderOptions?: any
  ): DreamSerializerBuilder<DataTypeForOpenapi, DataType, PassthroughDataType> {
    this.attributes.push({
      name,
      openapi: openapi ?? {},
      renderOptions: renderOptions ?? {},
    })

    return this
  }

  public delegatedAttribute<
    TargetName extends keyof Exclude<DataType, null> & string,
    TargetObject extends Exclude<DataType, null>[TargetName],
    AttributeName extends TargetObject extends object ? keyof TargetObject & string : never,
    OpenapiOptions extends OpenapiSchemaBodyShorthand | OpenapiShorthandPrimitiveTypes,
    RenderOptions extends OpenapiOptions extends
      | 'decimal'
      | 'decimal[]'
      | ['decimal', 'null']
      | ['decimal[]', 'null']
      ? DecimalShorthandAttributeRenderOptions
      : never,
  >(
    targetName: TargetName,
    name: AttributeName,
    openapi: OpenapiOptions,
    renderOptions?: RenderOptions
  ): DreamSerializerBuilder<DataTypeForOpenapi, DataType, PassthroughDataType> {
    this.delegatedAttributes.push({
      targetName,
      name: name as any,
      openapi,
      renderOptions: renderOptions ?? {},
    })

    return this
  }

  public jsonAttribute<
    AttributeName extends keyof Exclude<DataType, null> & string,
    OpenapiOptions extends OpenapiSchemaBodyShorthand | OpenapiShorthandPrimitiveTypes,
  >(
    name: AttributeName,
    openapi: OpenapiOptions
  ): DreamSerializerBuilder<DataTypeForOpenapi, DataType, PassthroughDataType> {
    this.attributes.push({
      name,
      openapi: openapi,
      renderOptions: {},
    })

    return this
  }

  public customAttribute<OpenapiOptions extends OpenapiSchemaBodyShorthand | OpenapiShorthandPrimitiveTypes>(
    name: string,
    fn: (x: Exclude<DataType, null>, y?: PassthroughDataType) => unknown,
    openapi: OpenapiOptions
  ): DreamSerializerBuilder<DataTypeForOpenapi, DataType, PassthroughDataType> {
    this.customAttributes.push({
      name,
      fn,
      openapi: openapi,
    })

    return this
  }

  public rendersOne<
    AttributeName extends keyof Exclude<DataType, null> & string,
    Options extends RendersOneOpts<DataTypeForOpenapi>,
    OpenapiOptions extends Options extends { serializer: any } ? CustomSerializerOpenapiOpts : never,
  >(
    name: AttributeName,
    options?: Options,
    openapi?: OpenapiOptions
  ): DreamSerializerBuilder<DataTypeForOpenapi, DataType, PassthroughDataType> {
    this.rendersOnes.push({
      name,
      openapi: openapi ?? {},
      options: options ?? {},
    })

    return this
  }

  public rendersMany<
    AttributeName extends keyof Exclude<DataType, null> & string,
    Options extends RendersManyOpts<DataTypeForOpenapi>,
    OpenapiOptions extends Options extends { serializer: any } ? CustomSerializerOpenapiOpts : never,
  >(
    name: AttributeName,
    options?: Options,
    openapi?: OpenapiOptions
  ): DreamSerializerBuilder<DataTypeForOpenapi, DataType, PassthroughDataType> {
    this.rendersManys.push({
      name,
      options: options ?? {},
      openapi: openapi ?? {},
    })

    return this
  }
}
