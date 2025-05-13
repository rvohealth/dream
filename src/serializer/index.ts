import Dream from '../Dream.js'
import { RoundingPrecision } from '../helpers/round.js'
import { DreamAttributeDbTypes, SerializableClassOrClasses } from '../types/dream.js'
import { OpenapiSchemaBodyShorthand, OpenapiShorthandPrimitiveTypes } from '../types/openapi.js'
import { RendersManyOpts } from './decorators/associations/RendersMany.js'
import { RendersOneOpts } from './decorators/associations/RendersOne.js'

export function DreamModelSerializer<
  DataTypeForOpenapi extends typeof Dream,
  DataType extends Dream,
  PassthroughDataType = object,
>(dreamClass: DataTypeForOpenapi, $data: DataType, $passthroughData?: PassthroughDataType) {
  return new DreamSerializerBuilder<DataTypeForOpenapi, DataType, PassthroughDataType>(
    dreamClass,
    $data,
    $passthroughData
  )
}

export function ViewModelSerializer<DataType, PassthroughDataType = object>(
  $data: DataType,
  $passthroughData?: PassthroughDataType
) {
  return new DreamSerializerBuilder<null, DataType, PassthroughDataType>(null, $data, $passthroughData)
}

export function SimpleObjectSerializer<DataType, PassthroughDataType = object>(
  $data: DataType,
  $passthroughData?: PassthroughDataType
) {
  return new DreamSerializerBuilder<null, DataType, PassthroughDataType>(null, $data, $passthroughData)
}

export interface Attribute<
  DataType,
  AttributeName extends keyof Exclude<DataType, null> & string = keyof Exclude<DataType, null> & string,
> {
  name: AttributeName
  openapiAndRenderOptions:
    | ExtraOpenapiOptionsForAutomaticallySetOpenapi
    | OpenapiSchemaBodyShorthand
    | OpenapiShorthandPrimitiveTypes
    | undefined
  renderOptions: DecimalShorthandAttributeRenderOptions | undefined
}

export interface DelegatedAttribute<
  DataType,
  TargetName extends keyof Exclude<DataType, null> & string = keyof Exclude<DataType, null> & string,
  TargetObject extends Exclude<DataType, null>[TargetName] = Exclude<DataType, null>[TargetName],
  AttributeName extends TargetObject extends object
    ? keyof TargetObject & string
    : never = TargetObject extends object ? keyof TargetObject & string : never,
> {
  targetName: TargetName
  name: AttributeName
  openapi:
    | ExtraOpenapiOptionsForAutomaticallySetOpenapi
    | OpenapiSchemaBodyShorthand
    | OpenapiShorthandPrimitiveTypes
    | undefined
  renderOptions: DecimalShorthandAttributeRenderOptions | undefined
}

export interface AttributeFunction {
  name: string
  fn: (x?: any, y?: any) => any
  openapi: OpenapiSchemaBodyShorthand | OpenapiShorthandPrimitiveTypes | undefined
}

export interface RendersOne<
  DataType,
  AttributeName extends keyof Exclude<DataType, null> & string = keyof Exclude<DataType, null> & string,
> {
  name: AttributeName
  serializableClassOrClasses: SerializableClassOrClasses | undefined
  options: RendersOneOpts | undefined
}

export interface RendersMany<
  DataType,
  AttributeName extends keyof Exclude<DataType, null> & string = keyof Exclude<DataType, null> & string,
> {
  name: AttributeName
  serializableClassOrClasses: SerializableClassOrClasses | undefined
  options: RendersOneOpts | undefined
}

export interface ExtraOpenapiOptionsForAutomaticallySetOpenapi {
  description?: string
}
interface DecimalShorthandAttributeRenderOptions {
  precision?: RoundingPrecision
}

export class DreamSerializerBuilder<
  DataTypeForOpenapi extends typeof Dream | null,
  DataType,
  PassthroughDataType,
> {
  protected attributes: Attribute<DataType>[] = []
  protected delegatedAttributes: DelegatedAttribute<DataType>[] = []
  protected attributeFunctions: AttributeFunction[] = []
  protected rendersOnes: RendersOne<DataType>[] = []
  protected rendersManys: RendersMany<DataType>[] = []
  protected _maybeNull: boolean = false

  constructor(
    protected $typeForOpenapi: DataTypeForOpenapi,
    protected $data: DataType,
    protected $passthroughData: PassthroughDataType = {} as PassthroughDataType
  ) {}

  public maybeNull() {
    this._maybeNull = true
    return this
  }

  // First overload: When DataTypeForOpenapi extends typeof Dream
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
        : never
      : never,
  >(
    this: DreamSerializerBuilder<typeof Dream, DataType, PassthroughDataType>,
    name: AttributeName,
    openapi?: OpenapiOptions,
    renderOptions?: RenderOptions
  ): DreamSerializerBuilder<DataTypeForOpenapi, DataType, PassthroughDataType>

  // Second overload: For other cases (not Dream)
  public attribute<
    AttributeName extends keyof Exclude<DataType, null> & string,
    OpenapiOptions extends OpenapiSchemaBodyShorthand | OpenapiShorthandPrimitiveTypes,
    RenderOptions extends OpenapiOptions extends
      | 'decimal'
      | 'decimal[]'
      | ['decimal', 'null']
      | ['decimal[]', 'null']
      ? DecimalShorthandAttributeRenderOptions
      : never,
  >(
    this: DreamSerializerBuilder<null, DataType, PassthroughDataType>,
    name: AttributeName,
    openapi: OpenapiOptions,
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
      openapiAndRenderOptions: openapi,
      renderOptions: { ...(renderOptions ?? {}) },
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
      openapi: openapi,
      renderOptions: { ...(renderOptions ?? {}) },
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
      openapiAndRenderOptions: openapi,
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
  ): DreamSerializerBuilder<DataTypeForOpenapi, DataType, PassthroughDataType> {
    this.attributeFunctions.push({
      name,
      fn,
      openapi: openapi,
    })

    return this
  }

  public rendersOne<
    AttributeName extends keyof Exclude<DataType, null> & string,
    SerializableClassOrClassesOrOptions extends DataType extends Dream
      ? RendersOneOpts
      : SerializableClassOrClasses,
    Options extends SerializableClassOrClassesOrOptions extends undefined
      ? never
      : SerializableClassOrClassesOrOptions extends SerializableClassOrClasses
        ? RendersOneOpts
        : never,
  >(
    name: AttributeName,
    serializableClassOrClassesOrOptions?: SerializableClassOrClassesOrOptions,
    options?: Options
  ): DreamSerializerBuilder<DataTypeForOpenapi, DataType, PassthroughDataType> {
    this.rendersOnes.push({
      name,
      serializableClassOrClasses: (this.$data as Dream)?.isDreamInstance
        ? undefined
        : (serializableClassOrClassesOrOptions as SerializableClassOrClasses),
      options: (this.$data as Dream)?.isDreamInstance
        ? (serializableClassOrClassesOrOptions as RendersOneOpts)
        : options,
    })

    return this
  }

  public rendersMany<
    AttributeName extends keyof Exclude<DataType, null> & string,
    SerializableClassOrClassesOrOptions extends DataType extends Dream
      ? RendersManyOpts
      : SerializableClassOrClasses,
    Options extends SerializableClassOrClassesOrOptions extends undefined
      ? never
      : SerializableClassOrClassesOrOptions extends SerializableClassOrClasses
        ? RendersManyOpts
        : never,
  >(
    name: AttributeName,
    serializableClassOrClassesOrOptions?: SerializableClassOrClassesOrOptions,
    options?: Options
  ): DreamSerializerBuilder<DataTypeForOpenapi, DataType, PassthroughDataType> {
    this.rendersManys.push({
      name,
      serializableClassOrClasses: (this.$data as Dream)?.isDreamInstance
        ? undefined
        : (serializableClassOrClassesOrOptions as SerializableClassOrClasses),
      options: (this.$data as Dream)?.isDreamInstance
        ? (serializableClassOrClassesOrOptions as RendersManyOpts)
        : options,
    })

    return this
  }
}
