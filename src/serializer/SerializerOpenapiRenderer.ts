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

  public get globalName(): string {
    return (this.serializer as unknown as { globalName: string })['globalName'] ?? ''
  }

  public get openapiName(): string {
    return this.globalName.replace(/\//g, '_')
  }

  public get serializerRef(): OpenapiSchemaBodyShorthand {
    return {
      $ref: `#/components/schemas/${this.openapiName}`,
    }
  }

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

  public renderedOpenapi(
    alreadyProcessedSerializers: string[] = []
  ): ReferencedSerializersAndOpenapiSchemaBodyShorthand {
    const referencedSerializersAndOpenapiSchemaBodyShorthand =
      this._renderedOpenapi(alreadyProcessedSerializers)
    if (this.allOfSiblings.length) {
      const openapi = referencedSerializersAndOpenapiSchemaBodyShorthand.openapi

      return {
        ...referencedSerializersAndOpenapiSchemaBodyShorthand,
        openapi: {
          allOf: [openapi, ...this.allOfSiblings],
        },
      }
    } else {
      return referencedSerializersAndOpenapiSchemaBodyShorthand
    }
  }

  private _renderedOpenapi(
    alreadyProcessedSerializers: string[]
  ): ReferencedSerializersAndOpenapiSchemaBodyShorthand {
    const referencedSerializersAndAttributes = this.renderedOpenapiAttributes(alreadyProcessedSerializers)

    return {
      referencedSerializers: referencedSerializersAndAttributes.referencedSerializers,
      openapi: {
        type: this.serializerBuilder['_maybeNull'] ? ['object', 'null'] : 'object',
        required: [
          ...this.serializerBuilder['attributes'].map(obj => obj.name),
          ...this.serializerBuilder['delegatedAttributes'].map(obj => obj.name),
          ...this.serializerBuilder['customAttributes'].map(obj => obj.name),
          ...compact(
            this.serializerBuilder['rendersOnes'].map(obj => (obj.options.flatten ? null : obj.name))
          ),
          ...this.serializerBuilder['rendersManys'].map(obj => obj.name),
        ].map(attribute => this.setCase(attribute)),
        properties: referencedSerializersAndAttributes.attributes,
      },
    }
  }

  private renderedOpenapiAttributes(
    alreadyProcessedSerializers: string[] = []
  ): ReferencedSerializersAndAttributes {
    const $typeForOpenapi = this.serializerBuilder['$typeForOpenapi']
    const DataTypeForOpenapi = $typeForOpenapi as typeof Dream | ViewModelClass | undefined
    let referencedSerializers: SerializerType<any>[] = []
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
      const referencedSerializersAndOpenapiSchemaBodyShorthand = associationOpenapi(
        attribute,
        DataTypeForOpenapi,
        alreadyProcessedSerializers
      )
      referencedSerializers = [
        ...referencedSerializers,
        ...referencedSerializersAndOpenapiSchemaBodyShorthand.referencedSerializers,
      ]

      if (attribute.options.flatten) {
        this.allOfSiblings.push(referencedSerializersAndOpenapiSchemaBodyShorthand.openapi)
        return accumulator
      } else {
        accumulator[outputAttributeName] = referencedSerializersAndOpenapiSchemaBodyShorthand.openapi
        return accumulator
      }
    }, renderedOpenapi)

    this.serializerBuilder['rendersManys'].reduce((accumulator, attribute) => {
      const outputAttributeName = this.setCase(attribute.options.as ?? attribute.name)
      const referencedSerializersAndOpenapiSchemaBodyShorthand = associationOpenapi(
        attribute,
        DataTypeForOpenapi,
        alreadyProcessedSerializers
      )
      referencedSerializers = [
        ...referencedSerializers,
        ...referencedSerializersAndOpenapiSchemaBodyShorthand.referencedSerializers,
      ]

      accumulator[outputAttributeName] = {
        type: 'array',
        items: referencedSerializersAndOpenapiSchemaBodyShorthand.openapi,
      }

      return accumulator
    }, renderedOpenapi)

    return {
      referencedSerializers,
      attributes: renderedOpenapi,
    }
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
  DataTypeForOpenapi: typeof Dream | ViewModelClass | undefined,
  alreadyProcessedSerializers: string[]
): ReferencedSerializersAndOpenapiSchemaBodyShorthand {
  const serializerOverride = attribute.options.serializerCallback?.()
  if (serializerOverride)
    return {
      referencedSerializers: serializerAndDescendentSerializers(
        serializerOverride,
        alreadyProcessedSerializers
      ),
      openapi: new SerializerOpenapiRenderer(serializerOverride).serializerRef,
    }

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
  if (serializersOpenapi.length === 1) {
    const serializer = serializersOpenapi[0]!
    return {
      referencedSerializers: serializerAndDescendentSerializers(serializer, alreadyProcessedSerializers),
      openapi: new SerializerOpenapiRenderer(serializer).serializerRef,
    }
  }

  return {
    referencedSerializers: uniq(
      serializersOpenapi
        .map(serializer => serializerAndDescendentSerializers(serializer, alreadyProcessedSerializers))
        .flat(),
      serializer => (serializer as any).globalName
    ),
    openapi: {
      anyOf: serializersOpenapi.map(serializer => new SerializerOpenapiRenderer(serializer).serializerRef),
    },
  }
}

function serializerAndDescendentSerializers(
  serializer: SerializerType<any>,
  alreadyProcessedSerializers: string[]
): SerializerType<any>[] {
  if (alreadyProcessedSerializers.includes((serializer as any).globalName)) return []

  return compact([
    serializer,
    ...new SerializerOpenapiRenderer(serializer).renderedOpenapi([
      ...alreadyProcessedSerializers,
      (serializer as any).globalName,
    ]).referencedSerializers,
  ])
}

interface ReferencedSerializersAndOpenapiSchemaBodyShorthand {
  referencedSerializers: SerializerType<any>[]
  openapi: OpenapiSchemaBodyShorthand
}

interface ReferencedSerializersAndAttributes {
  referencedSerializers: SerializerType<any>[]
  attributes: Record<string, OpenapiSchemaBodyShorthand>
}
