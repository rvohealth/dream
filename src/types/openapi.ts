import Dream from '../Dream.js'
import { openapiPrimitiveTypes, openapiShorthandPrimitiveTypes } from '../dream/constants.js'
import { ViewModelClass } from './dream.js'
import { DreamModelSerializerType, SimpleObjectSerializerType } from './serializer.js'

export type OpenapiSchemaBody =
  | OpenapiSchemaBase
  | OpenapiSchemaPrimitiveGeneric
  | OpenapiSchemaExpressionAnyOf
  | OpenapiSchemaExpressionOneOf
  | OpenapiSchemaExpressionAllOf
  | OpenapiSchemaObject
  | OpenapiSchemaArray

/**
 * The reference forms a shorthand shape may contain: `$ref`, `$schema`,
 * `$serializer` and `$serializable`.
 */
export type OpenapiShorthandRefs =
  | OpenapiSchemaExpressionRef
  | OpenapiSchemaExpressionRefSchemaShorthand
  | OpenapiSchemaShorthandExpressionSerializerRef
  | OpenapiSchemaShorthandExpressionSerializableRef

/**
 * An OpenAPI shape, shorthand allowed. `Refs` is the reference forms it may
 * contain, at any depth; by default every one of them. A shape whose `Refs` is
 * `never` contains no reference (see `OpenapiSchemaBodyShorthandWithoutRefs`)
 * and is still an `OpenapiSchemaBodyShorthand`.
 */
export type OpenapiSchemaBodyShorthand<Refs extends OpenapiShorthandRefs = OpenapiShorthandRefs> =
  | OpenapiSchemaString
  | OpenapiSchemaInteger
  | OpenapiSchemaNumber
  | OpenapiSchemaNull // no shorthand for type: null
  | OpenapiSchemaShorthandPrimitiveGeneric
  | OpenapiSchemaShorthandExpressionAnyOf<Refs>
  | OpenapiSchemaShorthandExpressionOneOf<Refs>
  | OpenapiSchemaShorthandExpressionAllOf<Refs>
  | OpenapiSchemaObjectShorthand<Refs>
  | OpenapiSchemaArrayShorthand<Refs>
  | Refs

/**
 * An OpenAPI shape, shorthand allowed, that contains no reference (`$ref`,
 * `$schema`, `$serializer` or `$serializable`) at any depth: the shape a model
 * declares with `@deco.JSON`, `@deco.Virtual` or `@deco.Encrypted`.
 */
export type OpenapiSchemaBodyShorthandWithoutRefs = OpenapiSchemaBodyShorthand<never>

export type OpenapiSchemaBase =
  | OpenapiSchemaString
  | OpenapiSchemaInteger
  | OpenapiSchemaNumber
  | OpenapiSchemaNull
  | OpenapiSchemaExpressionRef

export type OpenapiSchemaShorthandExpressionAnyOf<Refs extends OpenapiShorthandRefs = OpenapiShorthandRefs> =
  OpenapiSchemaCombinatorFields<{
    anyOf: OpenapiSchemaBodyShorthand<Refs>[]
  }>

export type OpenapiSchemaShorthandExpressionOneOf<Refs extends OpenapiShorthandRefs = OpenapiShorthandRefs> =
  OpenapiSchemaCombinatorFields<{
    oneOf: OpenapiSchemaBodyShorthand<Refs>[]
  }>

export type OpenapiSchemaShorthandExpressionAllOf<Refs extends OpenapiShorthandRefs = OpenapiShorthandRefs> =
  OpenapiSchemaCombinatorFields<{
    allOf: OpenapiSchemaBodyShorthand<Refs>[]
  }>

export type OpenapiSchemaShorthandExpressionSerializerRef = {
  $serializer: DreamModelSerializerType | SimpleObjectSerializerType
  many?: boolean
  maybeNull?: boolean
}

export type OpenapiSchemaShorthandExpressionSerializableRef = {
  $serializable: typeof Dream | ViewModelClass
  $serializableSerializerKey?: string
  key?: string
  many?: boolean
  maybeNull?: boolean
}

export type OpenapiSchemaExpressionRef = {
  $ref: string
}

export type OpenapiSchemaExpressionRefSchemaShorthand = {
  $schema: string
}

export type OpenapiSchemaExpressionAllOf = OpenapiSchemaCombinatorFields<{
  allOf: OpenapiSchemaBody[]
}>

export type OpenapiSchemaExpressionAnyOf = OpenapiSchemaCombinatorFields<{
  anyOf: OpenapiSchemaBody[]
}>

export type OpenapiSchemaExpressionOneOf = OpenapiSchemaCombinatorFields<{
  oneOf: OpenapiSchemaBody[]
}>

/**
 * The fields of a schema that declares a `type`. `anyOf` and `oneOf` are not
 * among them: they apply to every value, `null` included, so a nullable `type`
 * beside one cannot admit `null`. A schema that may be null lists a
 * `{ type: 'null' }` branch in its `anyOf` or `oneOf` instead.
 */
export type OpenapiSchemaCommonFields<T> = T & {
  description?: string
  summary?: string
  anyOf?: never
  oneOf?: never
}

/**
 * The fields of a schema that is an `allOf`, `anyOf` or `oneOf`: the
 * combinator and the fields that describe it, but no `type` (see
 * `OpenapiSchemaCommonFields`).
 */
export type OpenapiSchemaCombinatorFields<T> = T & {
  description?: string
  summary?: string
  type?: never
}

export type OpenapiSchemaString = OpenapiSchemaCommonFields<{
  type: 'string' | ['string', 'null'] | ['null', 'string']
  enum?: (string | null)[] | Readonly<(string | null)[]>
  format?: string
  pattern?: string
  minLength?: number
  maxLength?: number
}>

export type OpenapiSchemaInteger = OpenapiSchemaCommonFields<{
  type: 'integer' | ['integer', 'null'] | ['null', 'integer']
  minimum?: number
  maximum?: number
}>

export type OpenapiSchemaNumber = OpenapiSchemaCommonFields<{
  type: 'number' | ['number', 'null'] | ['null', 'number']
  format?: OpenapiNumberFormats
  multipleOf?: number
  minimum?: number
  maximum?: number
}>

export type OpenapiSchemaNull = {
  type: 'null'
  anyOf?: never
  oneOf?: never
}

export type OpenapiNumberFormats = 'decimal' | 'double'

export type OpenapiSchemaObject = OpenapiSchemaObjectBase | OpenapiSchemaObjectAllOf

export type OpenapiSchemaObjectBase = CommonOpenapiSchemaObjectFields<{
  minProperties?: number
  maxProperties?: number
  properties?:
    | OpenapiSchemaProperties
    | OpenapiSchemaExpressionOneOf
    | OpenapiSchemaExpressionAnyOf
    | OpenapiSchemaExpressionAllOf
  additionalProperties?:
    | OpenapiSchemaObject
    | OpenapiSchemaExpressionOneOf
    | OpenapiSchemaExpressionAnyOf
    | OpenapiSchemaExpressionAllOf
    | false
  allOf?: never
}>

/**
 * An object schema that is also an `allOf`. Its `type` cannot be nullable:
 * `allOf` applies to every value, so `null` would have to match each of its
 * object members. A schema that may be null is an `anyOf` or `oneOf` with a
 * `{ type: 'null' }` branch.
 */
export type OpenapiSchemaObjectAllOf = OpenapiSchemaCommonFields<{
  type: 'object'
  required?: string[]
  allOf?: OpenapiSchemaBody[]
}>

export type OpenapiSchemaObjectShorthand<Refs extends OpenapiShorthandRefs = OpenapiShorthandRefs> =
  | OpenapiSchemaObjectBaseShorthand<Refs>
  | OpenapiSchemaObjectAllOfShorthand<Refs>

export type OpenapiSchemaObjectBaseShorthand<Refs extends OpenapiShorthandRefs = OpenapiShorthandRefs> =
  CommonOpenapiSchemaObjectFields<{
    minProperties?: number
    maxProperties?: number
    properties?:
      | OpenapiSchemaPropertiesShorthand<Refs>
      | OpenapiSchemaShorthandExpressionOneOf<Refs>
      | OpenapiSchemaShorthandExpressionAnyOf<Refs>
      | OpenapiSchemaShorthandExpressionAllOf<Refs>
      | OpenapiSchemaShorthandPropertiesRef<Refs>
    additionalProperties?: OpenapiShorthandPrimitiveTypes | OpenapiSchemaBodyShorthand<Refs> | false
    allOf?: never
  }>

/**
 * The serializer references that may stand in for an object's whole
 * `properties` (never `$ref` or `$schema`). Written as an intersection with
 * `Refs`, rather than a conditional type, so that a shape without references
 * stays assignable to one that allows them.
 */
type OpenapiSchemaShorthandPropertiesRef<Refs extends OpenapiShorthandRefs> = Refs &
  (OpenapiSchemaShorthandExpressionSerializerRef | OpenapiSchemaShorthandExpressionSerializableRef)

/**
 * The shorthand form of `OpenapiSchemaObjectAllOf`.
 */
export type OpenapiSchemaObjectAllOfShorthand<Refs extends OpenapiShorthandRefs = OpenapiShorthandRefs> =
  OpenapiSchemaCommonFields<{
    type: 'object'
    required?: string[]
    allOf?: OpenapiSchemaBodyShorthand<Refs>[]
  }>

export type CommonOpenapiSchemaObjectFields<T> = OpenapiSchemaCommonFields<
  T & {
    type: 'object' | ['object', 'null'] | ['null', 'object']
    required?: string[]
  }
>

export type OpenapiSchemaArray = OpenapiSchemaCommonFields<{
  type: 'array' | ['array', 'null'] | ['null', 'array']
  items:
    | OpenapiSchemaBody
    | OpenapiSchemaExpressionAllOf
    | OpenapiSchemaExpressionAnyOf
    | OpenapiSchemaExpressionOneOf
}>

export type OpenapiSchemaArrayShorthand<Refs extends OpenapiShorthandRefs = OpenapiShorthandRefs> =
  OpenapiSchemaCommonFields<{
    type: 'array' | ['array', 'null'] | ['null', 'array']
    items: OpenapiSchemaBodyShorthand<Refs>
  }>

export interface OpenapiSchemaProperties {
  [key: string]: OpenapiSchemaBody
}

export type OpenapiSchemaPrimitiveGeneric = OpenapiSchemaCommonFields<{
  type: OpenapiPrimitiveTypes
}>

export type OpenapiSchemaShorthandPrimitiveGeneric = OpenapiSchemaCommonFields<{
  type: OpenapiShorthandPrimitiveTypes
}>

export interface OpenapiSchemaPropertiesShorthand<Refs extends OpenapiShorthandRefs = OpenapiShorthandRefs> {
  [key: string]: OpenapiSchemaBodyShorthand<Refs> | OpenapiShorthandPrimitiveTypes
}

export interface OpenapiDescription {
  description?: string
}

export type DecimalOpenapiTypes =
  | 'decimal'
  | 'decimal[]'
  | readonly ['decimal', 'null']
  | readonly ['decimal[]', 'null']

export type DecimalOpenapiTypesIncludingDbTypes = DecimalOpenapiTypes | 'numeric' | 'numeric[]'

export type OpenapiPrimitiveBaseTypes = (typeof openapiPrimitiveTypes)[number]
export type OpenapiPrimitiveTypes =
  | OpenapiPrimitiveBaseTypes
  | [OpenapiPrimitiveBaseTypes, 'null']
  | ['null', OpenapiPrimitiveBaseTypes]

export type OpenapiShorthandPrimitiveBaseTypes = (typeof openapiShorthandPrimitiveTypes)[number]

export type OpenapiShorthandPrimitiveTypes =
  | OpenapiShorthandPrimitiveBaseTypes
  | [OpenapiShorthandPrimitiveBaseTypes, 'null']
  | ['null', OpenapiShorthandPrimitiveBaseTypes]

type ObjectOrArrayPrimitiveTypes =
  | 'object'
  | 'array'
  | ['object' | 'array', 'null']
  | ['null', 'object' | 'array']

export type OpenapiAllTypes = OpenapiPrimitiveTypes | ObjectOrArrayPrimitiveTypes

export type OpenapiShorthandAllTypes = OpenapiShorthandPrimitiveTypes | ObjectOrArrayPrimitiveTypes

export type OpenapiTypeField = OpenapiPrimitiveTypes | OpenapiTypeFieldObject

export interface OpenapiTypeFieldObject {
  [key: string]: OpenapiPrimitiveTypes | OpenapiTypeFieldObject
}

export type OpenapiFormats = 'application/json'
