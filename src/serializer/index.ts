export default ($data: unknown, $passthroughData: unknown) =>
  new DreamSerializerBuilder($data, $passthroughData)

export interface Attribute {
  name: string
  options: object
  openapi: object
}

export interface AttributeFunction {
  name: string
  fn: (x: any, y?: any) => any
  options: object
  openapi: object
}

export interface RendersOne {
  name: string
  options: object
  openapi: object
}

export interface RendersMany {
  name: string
  options: object
  openapi: object
}

export class DreamSerializerBuilder<DataType = unknown, PassthroughDataType = unknown> {
  private attributes: Attribute[] = []
  private attributeFunctions: AttributeFunction[] = []
  private rendersOnes: RendersOne[] = []
  private rendersManys: RendersMany[] = []

  constructor(
    protected $data: DataType,
    protected $passthroughData: PassthroughDataType
  ) {}

  public attribute(
    name: keyof DataType & string,
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
    name: keyof DataType & string,
    fn: (x: DataType, y?: PassthroughDataType | undefined) => unknown,
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
    name: keyof DataType & string,
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
    name: keyof DataType & string,
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
