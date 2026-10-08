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

export type OpenapiSchemaBodyShorthand =
  | OpenapiSchemaBase
  | OpenapiSchemaShorthandPrimitiveGeneric
  | OpenapiSchemaShorthandExpressionAnyOf
  | OpenapiSchemaShorthandExpressionOneOf
  | OpenapiSchemaShorthandExpressionAllOf
  | OpenapiSchemaObjectShorthand
  | OpenapiSchemaArrayShorthand
  | OpenapiSchemaNull // no shorthand for type: null
  | OpenapiSchemaExpressionRefSchemaShorthand
  | OpenapiSchemaShorthandExpressionSerializerRef
  | OpenapiSchemaShorthandExpressionSerializableRef

export type OpenapiSchemaBase =
  | OpenapiSchemaString
  | OpenapiSchemaInteger
  | OpenapiSchemaNumber
  | OpenapiSchemaNull
  | OpenapiSchemaExpressionRef

export type OpenapiSchemaShorthandExpressionAnyOf = OpenapiSchemaCombinatorFields<{
  anyOf: OpenapiSchemaBodyShorthand[]
}>

export type OpenapiSchemaShorthandExpressionOneOf = OpenapiSchemaCombinatorFields<{
  oneOf: OpenapiSchemaBodyShorthand[]
}>

export type OpenapiSchemaShorthandExpressionAllOf = OpenapiSchemaCombinatorFields<{
  allOf: OpenapiSchemaBodyShorthand[]
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

export type OpenapiSchemaObjectShorthand =
  | OpenapiSchemaObjectBaseShorthand
  | OpenapiSchemaObjectAllOfShorthand

export type OpenapiSchemaObjectBaseShorthand = CommonOpenapiSchemaObjectFields<{
  minProperties?: number
  maxProperties?: number
  properties?:
    | OpenapiSchemaPropertiesShorthand
    | OpenapiSchemaShorthandExpressionOneOf
    | OpenapiSchemaShorthandExpressionAnyOf
    | OpenapiSchemaShorthandExpressionAllOf
    | OpenapiSchemaShorthandExpressionSerializerRef
    | OpenapiSchemaShorthandExpressionSerializableRef
  additionalProperties?:
    | OpenapiShorthandPrimitiveTypes
    | OpenapiSchemaBodyShorthand
    | OpenapiSchemaShorthandExpressionOneOf
    | OpenapiSchemaShorthandExpressionAnyOf
    | OpenapiSchemaShorthandExpressionAllOf
    | OpenapiSchemaShorthandExpressionSerializerRef
    | OpenapiSchemaShorthandExpressionSerializableRef
    | false
  allOf?: never
}>

/**
 * The shorthand form of `OpenapiSchemaObjectAllOf`.
 */
export type OpenapiSchemaObjectAllOfShorthand = OpenapiSchemaCommonFields<{
  type: 'object'
  required?: string[]
  allOf?: OpenapiSchemaBodyShorthand[]
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

export type OpenapiSchemaArrayShorthand = OpenapiSchemaCommonFields<{
  type: 'array' | ['array', 'null'] | ['null', 'array']
  items:
    | OpenapiSchemaBodyShorthand
    | OpenapiSchemaShorthandExpressionAllOf
    | OpenapiSchemaShorthandExpressionAnyOf
    | OpenapiSchemaShorthandExpressionOneOf
    | OpenapiSchemaShorthandExpressionSerializerRef
    | OpenapiSchemaShorthandExpressionSerializableRef
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

export interface OpenapiSchemaPropertiesShorthand {
  [key: string]: OpenapiSchemaBodyShorthand | OpenapiShorthandPrimitiveTypes
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
