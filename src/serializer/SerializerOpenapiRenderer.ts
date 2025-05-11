import Dream from '../Dream.js'
import NoSerializerFoundForRendersOneAndMany from '../errors/serializers/NoSerializerFoundForRendersOneAndMany.js'
import ObjectSerializerRendersOneAndManyRequireClassType from '../errors/serializers/ObjectSerializerRendersOneAndManyRequireClassType.js'
import compact from '../helpers/compact.js'
import snakeify from '../helpers/snakeify.js'
import sort from '../helpers/sort.js'
import sortObjectByKey from '../helpers/sortObjectByKey.js'
import expandStiClasses from '../helpers/sti/expandStiClasses.js'
import uniq from '../helpers/uniq.js'
import { dreamColumnOpenapiShape } from '../openapi/dreamAttributeOpenapiShape.js'
import openapiShorthandToOpenapi from '../openapi/openapiShorthandToOpenapi.js'
import { ViewModelClass } from '../types/dream.js'
import {
  OpenapiSchemaBody,
  OpenapiSchemaBodyShorthand,
  OpenapiSchemaExpressionRef,
} from '../types/openapi.js'
import {
  DreamModelSerializerType,
  InternalAnyTypedSerializerRendersMany,
  ReferencedSerializersAndAttributes,
  ReferencedSerializersAndOpenapiSchemaBodyShorthand,
  SerializerCasing,
  SimpleObjectSerializerType,
} from '../types/serializer.js'
import DreamSerializerBuilder from './builders/DreamSerializerBuilder.js'
import { inferSerializersFromDreamClassOrViewModelClass } from './helpers/inferSerializerFromDreamOrViewModel.js'

const NULL_OBJECT_OPENAPI: OpenapiSchemaBody = { type: 'null' }

export default class SerializerOpenapiRenderer {
  private casing: SerializerCasing
  private schemaDelimiter: string
  private suppressResponseEnums: boolean
  private allOfSiblings: OpenapiSchemaBodyShorthand[] = []

  constructor(
    private serializer: DreamModelSerializerType | SimpleObjectSerializerType,
    {
      casing = 'camel',
      schemaDelimiter = '_',
      suppressResponseEnums = false,
    }: {
      casing?: SerializerCasing
      schemaDelimiter?: string
      suppressResponseEnums?: boolean
    } = {}
  ) {
    this.casing = casing
    this.schemaDelimiter = schemaDelimiter
    this.suppressResponseEnums = suppressResponseEnums
  }

  public get globalName(): string {
    return (this.serializer as unknown as { globalName: string })['globalName'] ?? ''
  }

  public get openapiName(): string {
    return this.globalName.replace(/Serializer$/, '').replace(/\//g, this.schemaDelimiter)
  }

  public get serializerRef(): OpenapiSchemaExpressionRef {
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

  public renderedOpenapi(
    alreadyProcessedSerializers: Record<string, boolean> = {}
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
    alreadyProcessedSerializers: Record<string, boolean>
  ): ReferencedSerializersAndOpenapiSchemaBodyShorthand {
    const referencedSerializersAndAttributes = this.renderedOpenapiAttributes(alreadyProcessedSerializers)

    return {
      referencedSerializers: referencedSerializersAndAttributes.referencedSerializers,
      openapi: {
        type: 'object',
        required: sort(
          [
            ...this.serializerBuilder['attributes'].map(obj => obj.name),
            ...this.serializerBuilder['delegatedAttributes'].map(obj => obj.name),
            ...this.serializerBuilder['customAttributes'].map(obj => obj.name),
            ...compact(
              this.serializerBuilder['rendersOnes'].map(obj => (obj.options.flatten ? null : obj.name))
            ),
            ...this.serializerBuilder['rendersManys'].map(obj => obj.name),
          ].map(attribute => this.setCase(attribute))
        ),
        properties: sortObjectByKey(referencedSerializersAndAttributes.attributes),
      },
    }
  }

  private renderedOpenapiAttributes(
    alreadyProcessedSerializers: Record<string, boolean> = {}
  ): ReferencedSerializersAndAttributes {
    const $typeForOpenapi = this.serializerBuilder['$typeForOpenapi']
    const DataTypeForOpenapi = $typeForOpenapi as typeof Dream | ViewModelClass | undefined
    let referencedSerializers: (DreamModelSerializerType | SimpleObjectSerializerType)[] = []
    let renderedOpenapi: Record<string, OpenapiSchemaBodyShorthand> = {}

    renderedOpenapi = this.serializerBuilder['attributes'].reduce((accumulator, attribute) => {
      const outputAttributeName = this.setCase(attribute.options?.as ?? attribute.name)
      const openapi = attribute.options.openapi

      accumulator[outputAttributeName] = (DataTypeForOpenapi as typeof Dream)?.isDream
        ? dreamColumnOpenapiShape(DataTypeForOpenapi as typeof Dream, attribute.name, openapi, {
            suppressResponseEnums: this.suppressResponseEnums,
          })
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
        alreadyProcessedSerializers,
        {
          casing: this.casing,
          schemaDelimiter: this.schemaDelimiter,
          suppressResponseEnums: this.suppressResponseEnums,
        }
      )
      referencedSerializers = [
        ...referencedSerializers,
        ...referencedSerializersAndOpenapiSchemaBodyShorthand.referencedSerializers,
      ]

      if (attribute.options.flatten && attribute.options.optional) {
        this.allOfSiblings.push({
          anyOf: [referencedSerializersAndOpenapiSchemaBodyShorthand.openapi, NULL_OBJECT_OPENAPI],
        })
        return accumulator
        //
      } else if (attribute.options.flatten) {
        this.allOfSiblings.push(referencedSerializersAndOpenapiSchemaBodyShorthand.openapi)
        return accumulator
        //
      } else if (attribute.options.optional) {
        accumulator[outputAttributeName] = {
          anyOf: [referencedSerializersAndOpenapiSchemaBodyShorthand.openapi, NULL_OBJECT_OPENAPI],
        }
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
        alreadyProcessedSerializers,
        {
          casing: this.casing,
          schemaDelimiter: this.schemaDelimiter,
          suppressResponseEnums: this.suppressResponseEnums,
        }
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
    switch (this.casing) {
      case 'camel':
        return attr
      case 'snake':
        return snakeify(attr)
      default: {
        // protection so that if a new Casing is ever added, this will throw a type error at build time
        const _never: never = this.casing
        throw new Error(`Unhandled Casing: ${_never as string}`)
      }
    }
  }
}

function associationOpenapi(
  attribute: InternalAnyTypedSerializerRendersMany<any, string>,
  DataTypeForOpenapi: typeof Dream | ViewModelClass | undefined,
  alreadyProcessedSerializers: Record<string, boolean>,
  opts: {
    casing: SerializerCasing
    schemaDelimiter: string
    suppressResponseEnums: boolean
  }
): ReferencedSerializersAndOpenapiSchemaBodyShorthand {
  const serializerOverride = attribute.options.serializerCallback?.()
  if (serializerOverride)
    return {
      referencedSerializers: serializerAndDescendentSerializers(
        serializerOverride,
        alreadyProcessedSerializers,
        opts
      ),
      openapi: new SerializerOpenapiRenderer(serializerOverride, opts).serializerRef,
    }

  let associatedClasses: (typeof Dream | ViewModelClass)[]

  if ((DataTypeForOpenapi as typeof Dream)?.isDream) {
    const association = (DataTypeForOpenapi as typeof Dream)['getAssociationMetadata'](attribute.name)
    associatedClasses = expandStiClasses(association!.modelCB())
    //
  } else {
    const associatedClass: typeof Dream | ViewModelClass | undefined =
      attribute.options.dreamClass ?? attribute.options.viewModelClass

    if (associatedClass === undefined) {
      if ((DataTypeForOpenapi as ViewModelClass)?.prototype?.serializers)
        throw new ObjectSerializerRendersOneAndManyRequireClassType(attribute.name)
      throw new ObjectSerializerRendersOneAndManyRequireClassType(attribute.name)
    }

    if ((associatedClass as typeof Dream)?.isDream) {
      associatedClasses = expandStiClasses(associatedClass)
    } else {
      associatedClasses = [associatedClass]
    }
  }

  const serializersOpenapi = uniq(
    associatedClasses
      .map(associatedClass =>
        inferSerializersFromDreamClassOrViewModelClass(associatedClass, attribute.options.serializerKey)
      )
      .flat(),
    serializer => (serializer as any)['globalName']
  )

  if (serializersOpenapi.length === 0) throw new NoSerializerFoundForRendersOneAndMany(attribute.name)
  if (serializersOpenapi.length === 1) {
    const serializer = serializersOpenapi[0]!
    return {
      referencedSerializers: serializerAndDescendentSerializers(
        serializer,
        alreadyProcessedSerializers,
        opts
      ),
      openapi: new SerializerOpenapiRenderer(serializer, opts).serializerRef,
    }
  }

  return {
    referencedSerializers: uniq(
      serializersOpenapi
        .map(serializer => serializerAndDescendentSerializers(serializer, alreadyProcessedSerializers, opts))
        .flat(),
      serializer => (serializer as any).globalName
    ),
    openapi: {
      anyOf: serializersOpenapi.map(
        serializer => new SerializerOpenapiRenderer(serializer, opts).serializerRef
      ),
    },
  }
}

function serializerAndDescendentSerializers(
  serializer: DreamModelSerializerType | SimpleObjectSerializerType,
  alreadyProcessedSerializers: Record<string, boolean>,
  opts: {
    casing: SerializerCasing
    schemaDelimiter: string
    suppressResponseEnums: boolean
  }
): (DreamModelSerializerType | SimpleObjectSerializerType)[] {
  if (alreadyProcessedSerializers[(serializer as any).globalName]) return []

  return compact([
    serializer,
    ...new SerializerOpenapiRenderer(serializer, opts).renderedOpenapi({
      ...alreadyProcessedSerializers,
      [(serializer as any).globalName]: true,
    }).referencedSerializers,
  ])
}
