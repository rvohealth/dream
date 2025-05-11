export default function <DataType = object, PassthroughDataType = object>(
  $data: DataType,
  $passthroughData: PassthroughDataType
) {
  return new DreamSerializerBuilder<DataType, PassthroughDataType>($data, $passthroughData)
}

export interface Attribute<DataType> {
  name: keyof DataType
  options: object
  openapi: object
}

export interface AttributeFunction {
  name: string
  fn: (x?: any, y?: any) => any
  options: object
  openapi: object
}

export interface RendersOne<DataType> {
  name: keyof DataType
  options: object
  openapi: object
}

export interface RendersMany<DataType> {
  name: keyof DataType
  options: object
  openapi: object
}

export class DreamSerializerBuilder<DataType, PassthroughDataType> {
  private attributes: Attribute<DataType>[] = []
  private attributeFunctions: AttributeFunction[] = []
  private rendersOnes: RendersOne<DataType>[] = []
  private rendersManys: RendersMany<DataType>[] = []

  constructor(
    protected $data: DataType,
    protected $passthroughData: PassthroughDataType
  ) {}

  public attribute(
    name: keyof DataType,
    options?: object | undefined,
    openapi?: object | undefined
  ): DreamSerializerBuilder<DataType, PassthroughDataType> {
    this.attributes.push({
      name,
      options: { ...(options ?? {}) },
      openapi: { ...(openapi ?? {}) },
    })

    return this
  }

  public attributeFunction(
    name: string,
    fn: (x?: DataType | undefined, y?: PassthroughDataType | undefined) => unknown,
    options?: object | undefined,
    openapi?: object | undefined
  ): DreamSerializerBuilder<DataType, PassthroughDataType> {
    this.attributeFunctions.push({
      name,
      fn,
      options: { ...(options ?? {}) },
      openapi: { ...(openapi ?? {}) },
    })

    return this
  }

  public rendersOne(
    name: keyof DataType,
    options?: object | undefined,
    openapi?: object | undefined
  ): DreamSerializerBuilder<DataType, PassthroughDataType> {
    this.rendersOnes.push({
      name,
      options: { ...(options ?? {}) },
      openapi: { ...(openapi ?? {}) },
    })

    return this
  }

  public rendersMany(
    name: keyof DataType,
    options?: object | undefined,
    openapi?: object | undefined
  ): DreamSerializerBuilder<DataType, PassthroughDataType> {
    this.rendersManys.push({
      name,
      options: { ...(options ?? {}) },
      openapi: { ...(openapi ?? {}) },
    })

    return this
  }
}
