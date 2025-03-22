import { openapiPrimitiveTypes, openapiShorthandPrimitiveTypes } from '../dream/constants.js'
import DreamSerializer from '../serializer/index.js'
import { SerializableDreamClassOrViewModelClass } from './dream.js'

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
  anyOf: (OpenapiSchemaBodyShorthand | OpenapiSchemaPartialSegment)[]
}

export type OpenapiSchemaShorthandExpressionOneOf = {
  oneOf: (OpenapiSchemaBodyShorthand | OpenapiSchemaPartialSegment)[]
}

export type OpenapiSchemaShorthandExpressionAllOf = {
  allOf: (OpenapiSchemaBodyShorthand | OpenapiSchemaPartialSegment)[]
}

export type OpenapiSchemaPartialSegment = {
  nullable?: boolean
}

export type OpenapiSchemaShorthandExpressionSerializerRef = {
  $serializer: typeof DreamSerializer
  many?: boolean
  nullable?: boolean
}

export type OpenapiSchemaShorthandExpressionSerializableRef = {
  $serializable: SerializableDreamClassOrViewModelClass
  many?: boolean
  nullable?: boolean
  key?: string
}

export type OpenapiSchemaExpressionRef = {
  $ref: string
}

export type OpenapiSchemaExpressionRefSchemaShorthand = {
  $schema: string
}

export type OpenapiSchemaExpressionAllOf = {
  allOf: (OpenapiSchemaBody | OpenapiSchemaPartialSegment)[]
}

export type OpenapiSchemaExpressionAnyOf = {
  anyOf: (OpenapiSchemaBody | OpenapiSchemaPartialSegment)[]
}

export type OpenapiSchemaExpressionOneOf = {
  oneOf: (OpenapiSchemaBody | OpenapiSchemaPartialSegment)[]
}

export type OpenapiSchemaCommonFields<T> = T & {
  nullable?: boolean
  description?: string
  summary?: string
}

export type OpenapiSchemaString = OpenapiSchemaCommonFields<{
  type: 'string'
  enum?: string[] | Readonly<string[]>
  format?: string
  pattern?: string
  minLength?: number
  maxLength?: number
}>

export type OpenapiSchemaInteger = OpenapiSchemaCommonFields<{
  type: 'integer'
  minimum?: number
  maximum?: number
}>

export type OpenapiSchemaNumber = OpenapiSchemaCommonFields<{
  type: 'number'
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
    type: 'object'
    required?: string[]
  }
>

export type OpenapiSchemaArray = OpenapiSchemaCommonFields<{
  type: 'array'
  items:
    | OpenapiSchemaBody
    | OpenapiSchemaExpressionAllOf
    | OpenapiSchemaExpressionAnyOf
    | OpenapiSchemaExpressionOneOf
}>

export type OpenapiSchemaArrayShorthand = OpenapiSchemaCommonFields<{
  type: 'array'
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

export type OpenapiPrimitiveTypes = (typeof openapiPrimitiveTypes)[number]
export type OpenapiShorthandPrimitiveTypes = (typeof openapiShorthandPrimitiveTypes)[number]
export type OpenapiAllTypes = OpenapiPrimitiveTypes | 'object' | 'array'
export type OpenapiShorthandAllTypes = OpenapiShorthandPrimitiveTypes | 'object' | 'array'

export type OpenapiTypeField = OpenapiPrimitiveTypes | OpenapiTypeFieldObject

export interface OpenapiTypeFieldObject {
  [key: string]: OpenapiPrimitiveTypes | OpenapiTypeFieldObject
}

export type OpenapiFormats = 'application/json'
