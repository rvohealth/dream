import Dream from '../Dream.js'
import NoSerializerFoundForRendersOneAndMany from '../errors/serializers/NoSerializerFoundForRendersOneAndMany.js'
import SimpleObjectSerializerRendersOneAndManyRequireClassType from '../errors/serializers/SimpleObjectSerializerRendersOneAndManyRequireClassType.js'
import ViewModelSerializerRendersOneAndManyRequireClassType from '../errors/serializers/ViewModelSerializerRendersOneAndManyRequireClassType.js'
import compact from '../helpers/compact.js'
import snakeify from '../helpers/snakeify.js'
import uniq from '../helpers/uniq.js'
import { dreamColumnOpenapiShape } from '../openapi/dreamAttributeOpenapiShape.js'
import expandStiSerializersInDreamsOrSerializers from '../openapi/expandStiSerializersInDreamsOrSerializers.js'
import openapiShorthandToOpenapi from '../openapi/openapiShorthandToOpenapi.js'
import { DreamOrViewModel, ViewModelClass } from '../types/dream.js'
import { OpenapiSchemaBodyShorthand } from '../types/openapi.js'
import { InternalAnyTypedSerializerRendersMany, SerializerType } from '../types/serializer.js'
import { inferSerializerFromDreamClassOrViewModelClass } from './helpers/inferSerializerFromDreamOrViewModel.js'
import { DreamSerializerBuilder } from './index.js'

export default class SerializerOpenapiRenderer {
  private _casing: 'camel' | 'snake' = 'camel'
  private allOfSiblings: OpenapiSchemaBodyShorthand[] = []

  constructor(private serializer: SerializerType<any>) {}

  private _serializerBuilder: DreamSerializerBuilder<any, any, any>

  private get serializerBuilder(): DreamSerializerBuilder<any, any, any> {
    if (this._serializerBuilder) return this._serializerBuilder
    this._serializerBuilder = this.serializer(undefined as any, undefined as any) as DreamSerializerBuilder<
      any,
      any,
      any
    >
    return this._serializerBuilder
  }

  public casing(casing: 'camel' | 'snake') {
    this._casing = casing

    return this
  }

  public get renderedOpenapi(): OpenapiSchemaBodyShorthand {
    const openapi = this._renderedOpenapi
    if (this.allOfSiblings.length) {
      return {
        allOf: [openapi, ...this.allOfSiblings],
      }
    } else {
      return openapi
    }
  }

  private get _renderedOpenapi(): OpenapiSchemaBodyShorthand {
    return {
      type: this.serializerBuilder['_maybeNull'] ? ['object', 'null'] : 'object',
      required: [
        ...this.serializerBuilder['attributes'].map(obj => obj.name),
        ...this.serializerBuilder['delegatedAttributes'].map(obj => obj.name),
        ...this.serializerBuilder['customAttributes'].map(obj => obj.name),
        ...compact(this.serializerBuilder['rendersOnes'].map(obj => (obj.options.flatten ? null : obj.name))),
        ...this.serializerBuilder['rendersManys'].map(obj => obj.name),
      ].map(attribute => this.setCase(attribute)),
      properties: this.renderedOpenapiAttributes,
    }
  }

  private get renderedOpenapiAttributes(): Record<string, OpenapiSchemaBodyShorthand> {
    const $typeForOpenapi = this.serializerBuilder['$typeForOpenapi']
    const DataTypeForOpenapi = $typeForOpenapi as typeof Dream | ViewModelClass | undefined
    let renderedOpenapi: Record<string, OpenapiSchemaBodyShorthand> = {}

    renderedOpenapi = this.serializerBuilder['attributes'].reduce((accumulator, attribute) => {
      const outputAttributeName = this.setCase(attribute.options?.as ?? attribute.name)
      const openapi = attribute.options.openapi

      accumulator[outputAttributeName] = (DataTypeForOpenapi as typeof Dream)?.isDream
        ? dreamColumnOpenapiShape(DataTypeForOpenapi as typeof Dream, attribute.name, openapi)
        : openapiShorthandToOpenapi(openapi as any)
      return accumulator
    }, renderedOpenapi)

    renderedOpenapi = this.serializerBuilder['customAttributes'].reduce((accumulator, attribute) => {
      const outputAttributeName = this.setCase(attribute.name)
      const openapi = attribute.options.openapi

      accumulator[outputAttributeName] = openapiShorthandToOpenapi(openapi as any)
      return accumulator
    }, renderedOpenapi)

    renderedOpenapi = this.serializerBuilder['delegatedAttributes'].reduce((accumulator, attribute) => {
      const outputAttributeName = this.setCase(attribute.options?.as ?? attribute.name)
      const openapi = attribute.options.openapi
      accumulator[outputAttributeName] = openapiShorthandToOpenapi(openapi as any)
      return accumulator
    }, renderedOpenapi)

    this.serializerBuilder['rendersOnes'].reduce((accumulator, attribute) => {
      const outputAttributeName = this.setCase(attribute.options.as ?? attribute.name)

      if (attribute.options.flatten) {
        this.allOfSiblings.push(associationOpenapi(attribute, DataTypeForOpenapi))
        return accumulator
      } else {
        accumulator[outputAttributeName] = associationOpenapi(attribute, DataTypeForOpenapi)
        return accumulator
      }
    }, renderedOpenapi)

    this.serializerBuilder['rendersManys'].reduce((accumulator, attribute) => {
      const outputAttributeName = this.setCase(attribute.options.as ?? attribute.name)
      accumulator[outputAttributeName] = {
        type: 'array',
        items: associationOpenapi(attribute, DataTypeForOpenapi),
      }

      return accumulator
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
  attribute: InternalAnyTypedSerializerRendersMany<any, string>,
  DataTypeForOpenapi: typeof Dream | ViewModelClass | undefined
): OpenapiSchemaBodyShorthand {
  const serializerOverride = attribute.options.serializerCallback?.()
  if (serializerOverride) return serializerToRef(serializerOverride)

  let associatedClasses: DreamOrViewModel[]

  if ((DataTypeForOpenapi as typeof Dream)?.isDream) {
    const association = (DataTypeForOpenapi as typeof Dream)['getAssociationMetadata'](attribute.name)
    associatedClasses = expandStiSerializersInDreamsOrSerializers(association!.modelCB())
    //
  } else {
    const associatedClass: typeof Dream | ViewModelClass | undefined =
      attribute.options.dreamClass ?? attribute.options.viewModelClass

    if (associatedClass === undefined) {
      if ((DataTypeForOpenapi as ViewModelClass)?.prototype?.serializers)
        throw new ViewModelSerializerRendersOneAndManyRequireClassType(attribute.name)
      throw new SimpleObjectSerializerRendersOneAndManyRequireClassType(attribute.name)
    }

    if ((associatedClass as typeof Dream)?.isDream) {
      associatedClasses = expandStiSerializersInDreamsOrSerializers(associatedClass)
    } else {
      associatedClasses = [associatedClass]
    }
  }

  const serializersOpenapi = uniq(
    associatedClasses.map(associatedClass =>
      inferSerializerFromDreamClassOrViewModelClass(associatedClass, attribute.options.serializerKey)
    ),
    serializer => (serializer as any)['globalName']
  )

  if (serializersOpenapi.length === 0) throw new NoSerializerFoundForRendersOneAndMany(attribute.name)
  if (serializersOpenapi.length === 1) return serializerToRef(serializersOpenapi[0]!)

  return {
    anyOf: serializersOpenapi.map(serializer => serializerToRef(serializer)),
  }
}

function serializerToRef(serializer: SerializerType<any>): OpenapiSchemaBodyShorthand {
  return {
    $ref: `#/components/schemas/${((serializer as any)['globalName'] ?? '').replace(/\//g, '_')}`,
  }
}
