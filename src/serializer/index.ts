import Dream from '../Dream.js'
import { RoundingPrecision } from '../helpers/round.js'
import { SerializableClassOrClasses } from '../types/dream.js'
import { OpenapiSchemaBodyShorthand, OpenapiShorthandPrimitiveTypes } from '../types/openapi.js'
import { RendersManyOpts } from './decorators/associations/RendersMany.js'
import { RendersOneOpts } from './decorators/associations/RendersOne.js'

export default function <DataType = object, PassthroughDataType = object>(
  $data: DataType,
  $passthroughData: PassthroughDataType
) {
  return new DreamSerializerBuilder<DataType, PassthroughDataType>($data, $passthroughData)
}

export interface Attribute<DataType> {
  name: keyof DataType
  openapiAndRenderOptions:
    | AutomaticOpenapiAndRenderOptions
    | OpenapiSchemaBodyShorthand
    | OpenapiShorthandPrimitiveTypes
    | undefined
  renderOptions:
    | DecimalShorthandAttributeOpenapiAndRenderOptions
    | AttributeRenderOptions
    | ShorthandAttributeOpenapiAndRenderOptions
    | undefined
}

export interface AttributeFunction {
  name: string
  fn: (x?: any, y?: any) => any
  openapiAndRenderOptions: OpenapiSchemaBodyShorthand | OpenapiShorthandPrimitiveTypes | undefined
  renderOptions:
    | DecimalShorthandAttributeOpenapiAndRenderOptions
    | AttributeRenderOptions
    | ShorthandAttributeOpenapiAndRenderOptions
    | undefined
}

export interface RendersOne<DataType> {
  name: keyof DataType
  serializableClassOrClasses: SerializableClassOrClasses | undefined
  options: RendersOneOpts | undefined
}

export interface RendersMany<DataType> {
  name: keyof DataType
  serializableClassOrClasses: SerializableClassOrClasses | undefined
  options: RendersOneOpts | undefined
}

interface OpenapiOnlyOptions {
  description?: string
}

interface AttributeRenderOptions {
  delegate?: string
  precision?: RoundingPrecision
}

type AutomaticOpenapiAndRenderOptions = Pick<OpenapiOnlyOptions, 'description'> &
  Pick<AttributeRenderOptions, 'precision'>

type ShorthandAttributeOpenapiAndRenderOptions = Pick<OpenapiOnlyOptions, 'description'> &
  Pick<AttributeRenderOptions, 'delegate'>

type DecimalShorthandAttributeRenderOptions = Pick<AttributeRenderOptions, 'precision'>

type DecimalShorthandAttributeOpenapiAndRenderOptions = ShorthandAttributeOpenapiAndRenderOptions &
  DecimalShorthandAttributeRenderOptions

export class DreamSerializerBuilder<DataType, PassthroughDataType> {
  private attributes: Attribute<DataType>[] = []
  private attributeFunctions: AttributeFunction[] = []
  private rendersOnes: RendersOne<DataType>[] = []
  private rendersManys: RendersMany<DataType>[] = []

  constructor(
    protected $data: DataType,
    protected $passthroughData: PassthroughDataType
  ) {}

  public attribute<
    AttributeName extends keyof DataType,
    OpenapiOptions extends DataType extends Dream
      ? AutomaticOpenapiAndRenderOptions
      : OpenapiSchemaBodyShorthand | OpenapiShorthandPrimitiveTypes,
    RenderOptions extends OpenapiOptions extends undefined
      ? never
      : OpenapiOptions extends AutomaticOpenapiAndRenderOptions
        ? never
        : OpenapiOptions extends 'decimal' | 'decimal[]'
          ? DecimalShorthandAttributeOpenapiAndRenderOptions
          : OpenapiOptions extends OpenapiSchemaBodyShorthand
            ? AttributeRenderOptions
            : ShorthandAttributeOpenapiAndRenderOptions,
  >(
    name: AttributeName,
    openapi?: OpenapiOptions,
    options?: RenderOptions
  ): DreamSerializerBuilder<DataType, PassthroughDataType> {
    this.attributes.push({
      name,
      openapiAndRenderOptions: openapi,
      renderOptions: { ...(options ?? {}) },
    })

    return this
  }

  public attributeFunction<
    OpenapiOptions extends OpenapiSchemaBodyShorthand | OpenapiShorthandPrimitiveTypes,
    RenderOptions extends OpenapiOptions extends undefined
      ? never
      : OpenapiOptions extends 'decimal' | 'decimal[]'
        ? DecimalShorthandAttributeOpenapiAndRenderOptions
        : OpenapiOptions extends OpenapiSchemaBodyShorthand
          ? AttributeRenderOptions
          : ShorthandAttributeOpenapiAndRenderOptions,
  >(
    name: string,
    fn: (x?: DataType | undefined, y?: PassthroughDataType | undefined) => unknown,
    openapi?: OpenapiOptions,
    options?: RenderOptions
  ): DreamSerializerBuilder<DataType, PassthroughDataType> {
    this.attributeFunctions.push({
      name,
      fn,
      openapiAndRenderOptions: openapi,
      renderOptions: { ...(options ?? {}) },
    })

    return this
  }

  public rendersOne<
    AttributeName extends keyof DataType,
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
  ): DreamSerializerBuilder<DataType, PassthroughDataType> {
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
    AttributeName extends keyof DataType,
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
  ): DreamSerializerBuilder<DataType, PassthroughDataType> {
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
