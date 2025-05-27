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

export type OpenapiSchemaShorthandExpressionAnyOf = {
  anyOf: OpenapiSchemaBodyShorthand[]
}

export type OpenapiSchemaShorthandExpressionOneOf = {
  oneOf: OpenapiSchemaBodyShorthand[]
}

export type OpenapiSchemaShorthandExpressionAllOf = {
  allOf: OpenapiSchemaBodyShorthand[]
}

export type OpenapiSchemaShorthandExpressionSerializerRef = {
  $serializer: DreamModelSerializerType | SimpleObjectSerializerType
  many?: boolean
  maybeNull?: boolean
}

// TODO: remove $serializable or else add support for it (keeping in mind that STI
// base Dream models get expanded into an array of Dream models)
export type OpenapiSchemaShorthandExpressionSerializableRef = {
  $serializable: typeof Dream | ViewModelClass
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

export type OpenapiSchemaExpressionAllOf = {
  allOf: OpenapiSchemaBody[]
}

export type OpenapiSchemaExpressionAnyOf = {
  anyOf: OpenapiSchemaBody[]
}

export type OpenapiSchemaExpressionOneOf = {
  oneOf: OpenapiSchemaBody[]
}

export type OpenapiSchemaCommonFields<T> = T & {
  description?: string
  summary?: string
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
}

export type OpenapiNumberFormats = 'decimal' | 'double'

export type OpenapiSchemaObject =
  | OpenapiSchemaObjectBase
  | OpenapiSchemaObjectOneOf
  | OpenapiSchemaObjectAnyOf
  | OpenapiSchemaObjectAllOf

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
}>

export type OpenapiSchemaObjectOneOf = CommonOpenapiSchemaObjectFields<{
  oneOf?: OpenapiSchemaBody[]
}>

export type OpenapiSchemaObjectAnyOf = CommonOpenapiSchemaObjectFields<{
  anyOf?: OpenapiSchemaBody[]
}>

export type OpenapiSchemaObjectAllOf = CommonOpenapiSchemaObjectFields<{
  allOf?: OpenapiSchemaBody[]
}>

export type OpenapiSchemaObjectShorthand =
  | OpenapiSchemaObjectBaseShorthand
  | OpenapiSchemaObjectOneOfShorthand
  | OpenapiSchemaObjectAnyOfShorthand
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
}>

export type OpenapiSchemaObjectOneOfShorthand = CommonOpenapiSchemaObjectFields<{
  oneOf?: OpenapiSchemaBodyShorthand[]
}>

export type OpenapiSchemaObjectAnyOfShorthand = CommonOpenapiSchemaObjectFields<{
  anyOf?: OpenapiSchemaBodyShorthand[]
}>

export type OpenapiSchemaObjectAllOfShorthand = CommonOpenapiSchemaObjectFields<{
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
