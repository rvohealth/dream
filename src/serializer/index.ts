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
  return new DreamSerializerBuilderForDream<DreamClass, DataType, PassthroughDataType>(
    dreamClass,
    $data,
    $passthroughData
  )
}

export function ViewModelSerializer<
  VMClass extends ViewModelClass,
  DataType extends ViewModel | null,
  PassthroughDataType extends object = object,
>(viewModelClass: VMClass, $data: DataType, $passthroughData?: PassthroughDataType) {
  return new DreamSerializerBuilderForNonDream<VMClass, DataType, PassthroughDataType>(
    viewModelClass,
    $data,
    $passthroughData
  )
}

export function SimpleObjectSerializer<
  DataType extends object | null,
  PassthroughDataType extends object = object,
>($data: DataType, $passthroughData?: PassthroughDataType) {
  return new DreamSerializerBuilderForNonDream<undefined, DataType, PassthroughDataType>(
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
  protected attributeFunctions: SerializerAttributeFunction[] = []
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
  >(targetName: TargetName, name: AttributeName, openapi: OpenapiOptions, renderOptions?: RenderOptions) {
    this.delegatedAttributes.push({
      targetName,
      name: name as any,
      openapi: openapi,
      renderOptions: { ...(renderOptions ?? {}) },
    })

    return this
  }

  public jsonAttribute<
    AttributeName extends keyof Exclude<DataType, null> & string,
    OpenapiOptions extends OpenapiSchemaBodyShorthand | OpenapiShorthandPrimitiveTypes,
  >(name: AttributeName, openapi: OpenapiOptions) {
    this.attributes.push({
      name,
      openapi: openapi,
      renderOptions: {},
    })

    return this
  }

  public attributeFunction<
    OpenapiOptions extends OpenapiSchemaBodyShorthand | OpenapiShorthandPrimitiveTypes,
  >(
    name: string,
    fn: (x: Exclude<DataType, null>, y?: PassthroughDataType) => unknown,
    openapi: OpenapiOptions
  ) {
    this.attributeFunctions.push({
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
  >(name: AttributeName, options?: Options, openapi?: OpenapiOptions) {
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
  >(name: AttributeName, options?: Options, openapi?: OpenapiOptions) {
    this.rendersManys.push({
      name,
      options: options ?? {},
      openapi: openapi ?? {},
    })

    return this
  }
}

class DreamSerializerBuilderForDream<
  DataTypeForOpenapi extends typeof Dream,
  DataType extends Dream | null,
  PassthroughDataType,
> extends DreamSerializerBuilder<DataTypeForOpenapi, DataType, PassthroughDataType> {
  public attribute<
    AttributeName extends keyof Exclude<DataType, null> & string,
    OpenapiOptions extends ExtraOpenapiOptionsForAutomaticallySetOpenapi,
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
  >(name: AttributeName, openapi?: OpenapiOptions, renderOptions?: RenderOptions) {
    this.attributes.push({
      name,
      openapi,
      renderOptions: { ...(renderOptions ?? {}) },
    })

    return this
  }
}

class DreamSerializerBuilderForNonDream<
  DataTypeForOpenapi extends ViewModelClass | undefined,
  DataType extends ViewModel | object | null,
  PassthroughDataType,
> extends DreamSerializerBuilder<DataTypeForOpenapi, DataType, PassthroughDataType> {
  public attribute<
    AttributeName extends keyof Exclude<DataType, null> & string,
    OpenapiOptions extends OpenapiSchemaBodyShorthand | OpenapiShorthandPrimitiveTypes,
    RenderOptions extends OpenapiOptions extends
      | 'decimal'
      | 'decimal[]'
      | ['decimal', 'null']
      | ['decimal[]', 'null']
      ? DecimalShorthandAttributeRenderOptions
      : AttributeRenderOptions,
  >(name: AttributeName, openapi: OpenapiOptions, renderOptions?: RenderOptions) {
    this.attributes.push({
      name,
      openapi,
      renderOptions: { ...(renderOptions ?? {}) },
    })

    return this
  }
}
