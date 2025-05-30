import Dream from '../Dream.js'
import AttemptedToDeriveDescendentSerializersFromNonSerializer from '../errors/serializers/AttemptedToDeriveDescendentSerializersFromNonSerializer.js'
import NonSerializerPassedToSerializerOpenapiRenderer from '../errors/serializers/NonSerializerPassedToSerializerOpenapiRenderer.js'
import NonSerializerSerializerOverrideProvided from '../errors/serializers/NonSerializerSerializerOverrideProvided.js'
import NoSerializerFoundForRendersOneAndMany from '../errors/serializers/NoSerializerFoundForRendersOneAndMany.js'
import ObjectSerializerRendersOneAndManyRequireClassType from '../errors/serializers/ObjectSerializerRendersOneAndManyRequireClassType.js'
import SerializerInsteadOfSerializerCallback from '../errors/serializers/SerializerInsteadOfSerializerCallback.js'
import compact from '../helpers/compact.js'
import snakeify from '../helpers/snakeify.js'
import sort from '../helpers/sort.js'
import sortObjectByKey from '../helpers/sortObjectByKey.js'
import expandStiClasses from '../helpers/sti/expandStiClasses.js'
import uniq from '../helpers/uniq.js'
import allSerializersFromHandWrittenOpenapi from '../openapi/allSerializersFromHandWrittenOpenapi.js'
import allSerializersToRefsInOpenapi from '../openapi/allSerializersToRefsInOpenapi.js'
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
import isDreamSerializer from './helpers/isDreamSerializer.js'

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
    if (!isDreamSerializer(this.serializer))
      throw new NonSerializerPassedToSerializerOpenapiRenderer(this.serializer)
    this.casing = casing
    this.schemaDelimiter = schemaDelimiter
    this.suppressResponseEnums = suppressResponseEnums
  }

  public get globalName(): string {
    return (this.serializer as unknown as { globalName: string })['globalName'] ?? '--unnamed--'
  }

  public get openapiName(): string {
    return (this.serializer as unknown as { openapiName: string })['openapiName'] ?? '--unnamed--'
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
          uniq(
            [
              ...this.serializerBuilder['attributes'].map(obj => obj.options?.as ?? obj.name),
              ...this.serializerBuilder['delegatedAttributes'].map(obj => obj.options?.as ?? obj.name),

              ...compact(
                this.serializerBuilder['customAttributes'].map(obj => (obj.options.flatten ? null : obj.name))
              ),

              ...compact(
                this.serializerBuilder['rendersOnes'].map(obj =>
                  obj.options.flatten ? null : (obj.options?.as ?? obj.name)
                )
              ),
              ...this.serializerBuilder['rendersManys'].map(obj => obj.options?.as ?? obj.name),
            ].map(attribute => this.setCase(attribute))
          )
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

    const openapiRenderingOpts = {
      casing: this.casing,
      schemaDelimiter: this.schemaDelimiter,
      suppressResponseEnums: this.suppressResponseEnums,
    }

    ////////////////
    // attributes //
    ////////////////
    renderedOpenapi = this.serializerBuilder['attributes'].reduce((accumulator, attribute) => {
      const outputAttributeName = this.setCase(attribute.options?.as ?? attribute.name)
      const openapi = attribute.options.openapi

      referencedSerializers = [...referencedSerializers, ...allSerializersFromHandWrittenOpenapi(openapi)]

      accumulator[outputAttributeName] = (DataTypeForOpenapi as typeof Dream)?.isDream
        ? dreamColumnOpenapiShape(DataTypeForOpenapi as typeof Dream, attribute.name, openapi, {
            suppressResponseEnums: this.suppressResponseEnums,
          })
        : allSerializersToRefsInOpenapi(openapiShorthandToOpenapi(openapi as any), this.schemaDelimiter)

      return accumulator
    }, renderedOpenapi)
    /////////////////////
    // end: attributes //
    /////////////////////

    ///////////////////////
    // custom attributes //
    ///////////////////////
    renderedOpenapi = this.serializerBuilder['customAttributes'].reduce((accumulator, attribute) => {
      const outputAttributeName = this.setCase(attribute.name)
      const openapi = attribute.options.openapi

      referencedSerializers = [...referencedSerializers, ...allSerializersFromHandWrittenOpenapi(openapi)]

      if (attribute.options.flatten) {
        this.allOfSiblings.push(
          allSerializersToRefsInOpenapi(openapiShorthandToOpenapi(openapi as any), this.schemaDelimiter)
        )
      } else {
        accumulator[outputAttributeName] = allSerializersToRefsInOpenapi(
          openapiShorthandToOpenapi(openapi as any),
          this.schemaDelimiter
        )
      }

      return accumulator
    }, renderedOpenapi)
    ////////////////////////////
    // end: custom attributes //
    ////////////////////////////

    //////////////////////////
    // delegated attributes //
    //////////////////////////
    renderedOpenapi = this.serializerBuilder['delegatedAttributes'].reduce((accumulator, attribute) => {
      const outputAttributeName = this.setCase(attribute.options?.as ?? attribute.name)
      const openapi = attribute.options.openapi

      referencedSerializers = [...referencedSerializers, ...allSerializersFromHandWrittenOpenapi(openapi)]

      accumulator[outputAttributeName] = allSerializersToRefsInOpenapi(
        openapiShorthandToOpenapi(openapi as any),
        this.schemaDelimiter
      )
      return accumulator
    }, renderedOpenapi)
    ///////////////////////////////
    // end: delegated attributes //
    ///////////////////////////////

    // rendersOnes/Manys recursively processes associated serializers, looking for nested serializers.
    // Before we process, rendersOnes/Manys, we need to recursively do the same on all of the referencedSerializers
    // we've found in the hand-written openapi shapes for attributes
    referencedSerializers = uniq(referencedSerializers)
      .map(serializer =>
        serializerAndDescendentSerializers(serializer, alreadyProcessedSerializers, openapiRenderingOpts)
      )
      .flat()

    //////////////////
    // rendersOnes  //
    //////////////////
    this.serializerBuilder['rendersOnes'].reduce((accumulator, attribute) => {
      try {
        const outputAttributeName = this.setCase(attribute.options.as ?? attribute.name)
        const referencedSerializersAndOpenapiSchemaBodyShorthand = associationOpenapi(
          attribute,
          DataTypeForOpenapi,
          alreadyProcessedSerializers,
          openapiRenderingOpts
        )
        referencedSerializers = [
          ...referencedSerializers,
          ...referencedSerializersAndOpenapiSchemaBodyShorthand.referencedSerializers,
        ]

        if (attribute.options.flatten && attribute.options.optional) {
          this.allOfSiblings.push({
            anyOf: [referencedSerializersAndOpenapiSchemaBodyShorthand.openapi, NULL_OBJECT_OPENAPI],
          })
          //
        } else if (attribute.options.flatten) {
          this.allOfSiblings.push(referencedSerializersAndOpenapiSchemaBodyShorthand.openapi)
          //
        } else if (attribute.options.optional) {
          accumulator[outputAttributeName] = {
            anyOf: [referencedSerializersAndOpenapiSchemaBodyShorthand.openapi, NULL_OBJECT_OPENAPI],
          }
        } else {
          accumulator[outputAttributeName] = referencedSerializersAndOpenapiSchemaBodyShorthand.openapi
        }

        return accumulator
      } catch (error) {
        if (error instanceof CallingSerializersThrewError) return accumulator
        if (error instanceof AttemptedToDeriveDescendentSerializersFromNonSerializer)
          throw new SerializerInsteadOfSerializerCallback('rendersOne', this.globalName, attribute)
        throw error
      }
    }, renderedOpenapi)
    ///////////////////////
    // end: rendersOnes  //
    ///////////////////////

    ///////////////////
    // rendersManys  //
    ///////////////////
    this.serializerBuilder['rendersManys'].reduce((accumulator, attribute) => {
      try {
        const outputAttributeName = this.setCase(attribute.options.as ?? attribute.name)
        const referencedSerializersAndOpenapiSchemaBodyShorthand = associationOpenapi(
          attribute,
          DataTypeForOpenapi,
          alreadyProcessedSerializers,
          openapiRenderingOpts
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
      } catch (error) {
        if (error instanceof CallingSerializersThrewError) return accumulator
        if (error instanceof AttemptedToDeriveDescendentSerializersFromNonSerializer)
          throw new SerializerInsteadOfSerializerCallback('rendersMany', this.globalName, attribute)
        throw error
      }
    }, renderedOpenapi)
    ////////////////////////
    // end: rendersManys  //
    ////////////////////////

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
  if (serializerOverride) {
    try {
      return {
        referencedSerializers: serializerAndDescendentSerializers(
          serializerOverride,
          alreadyProcessedSerializers,
          opts
        ),
        openapi: new SerializerOpenapiRenderer(serializerOverride, opts).serializerRef,
      }
    } catch (error) {
      if (error instanceof NonSerializerPassedToSerializerOpenapiRenderer)
        throw new NonSerializerSerializerOverrideProvided(attribute, serializerOverride)
      throw error
    }
  }

  let associatedClasses: (typeof Dream | ViewModelClass)[]
  const association =
    (DataTypeForOpenapi as typeof Dream)?.isDream &&
    (DataTypeForOpenapi as typeof Dream)['getAssociationMetadata'](attribute.name)

  if (association) {
    associatedClasses = expandStiClasses(association.modelCB())
    //
  } else {
    const associatedClass: typeof Dream | ViewModelClass | undefined =
      attribute.options.dreamClass ?? attribute.options.viewModelClass

    if (associatedClass === undefined) {
      let serializerCheck: DreamModelSerializerType | SimpleObjectSerializerType | undefined

      try {
        ;(DataTypeForOpenapi as ViewModelClass)?.prototype?.serializers
      } catch {
        throw new CallingSerializersThrewError()
      }

      if (serializerCheck) throw new ObjectSerializerRendersOneAndManyRequireClassType(attribute.name)
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

  if (!isDreamSerializer(serializer))
    throw new AttemptedToDeriveDescendentSerializersFromNonSerializer(serializer)

  return compact([
    serializer,
    ...new SerializerOpenapiRenderer(serializer, opts).renderedOpenapi({
      ...alreadyProcessedSerializers,
      [(serializer as any).globalName]: true,
    }).referencedSerializers,
  ])
}

// When attempting to expand STI children, we might call `.serializers` on
// an instance that throws an error just by calling `.serializers` (so that
// they can be sure to define serializers on the STI children, but in this
// case, there might be STI children that are intermediaries to the intended
// STI children, so they don't have serializers and calling `.serializers`
// throws an error)
class CallingSerializersThrewError extends Error {}
