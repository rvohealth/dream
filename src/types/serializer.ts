import Dream from '../Dream.js'
import { RoundingPrecision } from '../helpers/round.js'
import DreamSerializerBuilder from '../serializer/builders/DreamSerializerBuilder.js'
import ObjectSerializerBuilder from '../serializer/builders/ObjectSerializerBuilder.js'
import { DreamSerializable, DreamSerializableArray, ViewModelClass } from './dream.js'
import { OpenapiDescription, OpenapiSchemaBodyShorthand, OpenapiShorthandPrimitiveTypes } from './openapi.js'

export type SerializerCasing = 'camel' | 'snake'
export type DreamsOrSerializersOrViewModels = DreamSerializable | DreamSerializableArray

export interface InternalAnyTypedSerializerAttribute {
  type: 'attribute'
  name: string
  options: Partial<NonAutomaticSerializerAttributeOptionsWithPossibleDecimalRenderOption>
}

export interface InternalAnyTypedSerializerDelegatedAttribute {
  type: 'delegatedAttribute'
  targetName: string
  name: string
  options: {
    as?: string
    default?: any
    openapi?: OpenapiSchemaBodyShorthand | OpenapiShorthandPrimitiveTypes
    required?: false
    precision?: RoundingPrecision
    optional?: boolean
  }
}

export interface InternalAnyTypedSerializerCustomAttribute {
  type: 'customAttribute'
  name: string
  fn: (x?: any, y?: any) => any
  options: Omit<NonAutomaticSerializerAttributeOptions, 'as'> & { flatten?: boolean }
}

export interface InternalAnyRendersOneOrManyOpts {
  as?: string
  dreamClass?: typeof Dream
  viewModelClass?: ViewModelClass
  serializer?: DreamModelSerializerType | SimpleObjectSerializerType
  serializerKey?: string
}

/**
 * @internal
 *
 * How serializer resolution arrived at the class it is resolving against, threaded down to the
 * errors raised when that resolution fails so the message can say *how* it got there rather than
 * only which class it landed on.
 *
 * Every field is optional because the paths that resolve serializers do not all know the same
 * things, and a message prints only what its own path has: the three root entry points
 * (`Dream.serializationMap`, `Dream.displaySerialization`, `buildSerializerPreloadPaths`) resolve
 * with no edge at all, `SerializerRenderer` has no serializer object in scope to name as the
 * declarer, and an STI base is only recorded where expanding one produced the class the error
 * names. The serializer key is not here because it is already an argument of resolution, so every
 * error that renders this context has it in hand.
 */
export interface SerializerResolutionContext {
  edge?: SerializerResolutionEdge
  /**
   * The STI base whose expansion produced the class the error names. Absent when the class was
   * resolved directly rather than reached through `expandStiClasses`.
   */
  stiBase?: string
}

/**
 * @internal
 *
 * The `rendersOne`/`rendersMany` that led resolution to the failing class.
 */
export interface SerializerResolutionEdge {
  type: 'rendersOne' | 'rendersMany'
  associationName: string
  /**
   * The global name of the serializer that declares the edge. In scope while preload paths and
   * serialization maps are built, and absent at render time, where the renderer holds the rendered
   * attribute but not the serializer that declared it.
   */
  declaredBy?: string | undefined
}

export interface InternalAnyTypedSerializerRendersOne<
  DataType,
  AttributeName extends keyof DataType & string = keyof DataType & string,
> {
  type: 'rendersOne'
  name: AttributeName
  options: InternalAnyRendersOneOrManyOpts & {
    flatten?: boolean
    optional?: boolean
  }
}

export interface InternalAnyTypedSerializerRendersMany<
  DataType,
  AttributeName extends keyof DataType & string = keyof DataType & string,
> {
  type: 'rendersMany'
  name: AttributeName
  options: InternalAnyRendersOneOrManyOpts
}

export type AutomaticSerializerAttributeOptions = {
  as?: string
  default?: any
  openapi?: OpenapiDescription
  precision?: RoundingPrecision
  required?: false
}

export type AutomaticSerializerAttributeOptionsForType = {
  as?: string
  openapi?: OpenapiDescription & {
    type?: 'string'
    enum?: string[] | Readonly<string[]>
  }
}

export type SerializerAttributeOptionsForVirtualColumn = {
  as?: string
  default?: any
  openapi?: OpenapiDescription | OpenapiSchemaBodyShorthand | OpenapiShorthandPrimitiveTypes
  required?: false
}

export type NonAutomaticSerializerAttributeOptions = {
  as?: string
  default?: any
  openapi: OpenapiSchemaBodyShorthand | OpenapiShorthandPrimitiveTypes
  required?: false
}

export type NonAutomaticSerializerAttributeOptionsWithPossibleDecimalRenderOption =
  NonAutomaticSerializerAttributeOptions & {
    // I tried a lot to get this type to disallow precision unless openapi were decimal/decimal[], but
    // it always allowed decimal even with { openapi: 'string', precision: 7 },
    // so I'm keeping it simple (some of what I tried removed decimal/decimal[] as a suggested type for
    // openapi, which is undesirable)
    precision?: RoundingPrecision
  }

export type DreamModelSerializerType = (data: any, passthroughData?: any) => DreamSerializerBuilder<any, any>

export type SimpleObjectSerializerType = (
  data: any,
  passthroughData?: any
) => ObjectSerializerBuilder<any, any>

export type SerializerType = DreamModelSerializerType | SimpleObjectSerializerType
