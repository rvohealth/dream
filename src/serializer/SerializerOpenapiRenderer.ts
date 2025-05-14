import Dream from '../Dream.js'
import { openapiShorthandPrimitiveTypes } from '../dream/constants.js'
import snakeify from '../helpers/snakeify.js'
import openapiShorthandToOpenapi from '../openapi/openapiShorthandToOpenapi.js'
import { OpenapiSchemaBodyShorthand, OpenapiShorthandPrimitiveTypes } from '../types/openapi.js'
import { dreamColumnOpenapiShape } from './helpers/dreamAttributeOpenapiShape.js'
import { inferSerializerFromDreamClassOrViewModelClass } from './helpers/inferSerializerFromDreamOrViewModel.js'
import { DreamSerializerBuilder, RendersMany, SerializerType } from './index.js'

export default class SerializerOpenapiRenderer {
  private _casing: 'camel' | 'snake' = 'camel'

  constructor(private serializer: SerializerType) {}

  public get serializerName() {
    const globalName = (this.serializer as unknown as { globalName: string }).globalName
    if (!globalName) throw new Error(`globalName is not set on serializer:\n\n${this.serializer.toString()}`)
    return globalName.replace(/\//g, '_')
  }

  private _serializerBuilder: DreamSerializerBuilder<any, any, any>
  private get serializerBuilder(): DreamSerializerBuilder<any, any, any> {
    if (this._serializerBuilder) return this._serializerBuilder
    this._serializerBuilder = this.serializer(undefined as any, undefined as any)
    return this._serializerBuilder
  }

  public casing(casing: 'camel' | 'snake') {
    this._casing = casing

    return this
  }

  public get renderedOpenapi() {
    const openapiShape = {
      type: this.serializerBuilder['_maybeNull'] ? ['object', 'null'] : 'object',
      required: [
        ...this.serializerBuilder['attributes'].map(obj => obj.name),
        ...this.serializerBuilder['delegatedAttributes'].map(obj => obj.name),
        ...this.serializerBuilder['attributeFunctions'].map(obj => obj.name),
        ...this.serializerBuilder['rendersOnes'].map(obj => obj.name),
        ...this.serializerBuilder['rendersManys'].map(obj => obj.name),
      ],
    }

    return openapiShape
  }

  private get renderedOpenapiAttributes(): Record<string, OpenapiSchemaBodyShorthand> {
    const $typeForOpenapi = this.serializerBuilder['$typeForOpenapi']
    const dreamClass = $typeForOpenapi as typeof Dream
    let renderedOpenapi: Record<string, OpenapiSchemaBodyShorthand> = {}

    renderedOpenapi = [
      ...this.serializerBuilder['attributes'],
      ...this.serializerBuilder['attributeFunctions'],
    ].reduce((accumulator, attribute) => {
      const openapi = attribute.openapi

      accumulator[this.setCase(attribute.name)] = dreamClass?.isDream
        ? dreamColumnOpenapiShape(dreamClass, attribute.name, openapi)
        : openapiShorthandPrimitiveTypes.includes(openapi as any)
          ? openapiShorthandToOpenapi(openapi as OpenapiShorthandPrimitiveTypes)
          : (openapi as OpenapiSchemaBodyShorthand)
      return accumulator
    }, renderedOpenapi)

    renderedOpenapi = this.serializerBuilder['delegatedAttributes'].reduce((accumulator, attribute) => {
      const openapi = attribute.openapi
      accumulator[this.setCase(attribute.name)] = openapiShorthandPrimitiveTypes.includes(openapi as any)
        ? openapiShorthandToOpenapi(openapi as OpenapiShorthandPrimitiveTypes)
        : (openapi as OpenapiSchemaBodyShorthand)
      return accumulator
    }, renderedOpenapi)

    this.serializerBuilder['rendersManys'].reduce((accumulator, attribute) => {
      renderedOpenapi[this.setCase(attribute.name)] = {
        type: 'array',
        items: associationOpenapi(attribute, renderedOpenapi, dreamClass),
      }

      return renderedOpenapi
    }, renderedOpenapi)

    this.serializerBuilder['rendersOnes'].reduce((accumulator, attribute) => {
      renderedOpenapi[this.setCase(attribute.name)] = associationOpenapi(
        attribute,
        renderedOpenapi,
        dreamClass
      )
      return renderedOpenapi
    }, renderedOpenapi)

    return renderedOpenapi
  }

  private setCase(attr: string) {
    switch (this._casing) {
      case 'camel':
        return attr
      case 'snake':
        return snakeify(attr)
    }
  }
}

function associationOpenapi(
  attribute: RendersMany<any, string>,
  renderedOpenapi: Record<string, OpenapiSchemaBodyShorthand>,
  dreamClass: typeof Dream
) {
  const hasManyAssociations = dreamClass['associationMetadataByType'].hasMany
  const association = hasManyAssociations.find(association => association.as === attribute.name)
  const associatedClassOrClasses = association!.modelCB()

  if (Array.isArray(associatedClassOrClasses)) {
    const serializersOpenapi = associatedClassOrClasses.map(associatedClass =>
      inferSerializerFromDreamClassOrViewModelClass(associatedClass)
    )

    return {
      anyOf: serializersOpenapi.map(serializer => serializerToRef(serializer)),
    }
  } else {
    return serializerToRef(inferSerializerFromDreamClassOrViewModelClass(associatedClassOrClasses))
  }
}

function serializerToRef(serializer: SerializerType) {
  return {
    $ref: `#/components/schemas/${((serializer as any)['globalName'] ?? '').replace(/\//g, '_')}`,
  }
}
