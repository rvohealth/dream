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
  | OpenapiSchemaExpressionRefSchemaShorthand

export type OpenapiSchemaBase =
  | OpenapiSchemaString
  | OpenapiSchemaInteger
  | OpenapiSchemaDecimal
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
  nullable?: boolean
  description?: string
  summary?: string
}

export type OpenapiSchemaString = OpenapiSchemaCommonFields<{
  type: 'string'
  enum?: string[] | Readonly<string[]>
  format?: string
}>

export type OpenapiSchemaInteger = OpenapiSchemaCommonFields<{
  type: 'integer'
  minimum?: number
  maximum?: number
}>

export type OpenapiSchemaDecimal = OpenapiSchemaCommonFields<{
  type: 'number'
  format: 'decimal'
  minimum?: number
  maximum?: number
}>

export type OpenapiSchemaObject =
  | OpenapiSchemaObjectBase
  | OpenapiSchemaObjectOneOf
  | OpenapiSchemaObjectAnyOf
  | OpenapiSchemaObjectAllOf

export type OpenapiSchemaObjectBase = CommonOpenapiSchemaObjectFields<{
  maxProperties?: number
  properties?:
    | OpenapiSchemaProperties
    | OpenapiSchemaExpressionOneOf
    | OpenapiSchemaExpressionAnyOf
    | OpenapiSchemaExpressionAllOf
  additionalProperties?:
    | OpenapiSchemaProperties
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
  maxProperties?: number
  properties?:
    | OpenapiSchemaPropertiesShorthand
    | OpenapiSchemaShorthandExpressionOneOf
    | OpenapiSchemaShorthandExpressionAnyOf
    | OpenapiSchemaShorthandExpressionAllOf
  additionalProperties?:
    | OpenapiSchemaPropertiesShorthand
    | OpenapiSchemaShorthandExpressionOneOf
    | OpenapiSchemaShorthandExpressionAnyOf
    | OpenapiSchemaShorthandExpressionAllOf
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

export const openapiPrimitiveTypes = [
  'string',
  'boolean',
  'number',
  'date',
  'date-time',
  'decimal',
  'integer',
] as const
export const openapiShorthandPrimitiveTypes = [
  ...openapiPrimitiveTypes,
  'string[]',
  'boolean[]',
  'number[]',
  'date[]',
  'date-time[]',
  'decimal[]',
  'integer[]',
  'json',
] as const
export type OpenapiPrimitiveTypes = (typeof openapiPrimitiveTypes)[number]
export type OpenapiShorthandPrimitiveTypes = (typeof openapiShorthandPrimitiveTypes)[number]
export type OpenapiAllTypes = OpenapiPrimitiveTypes | 'object' | 'array'
export type OpenapiShorthandAllTypes = OpenapiShorthandPrimitiveTypes | 'object' | 'array'

export type OpenapiTypeField = OpenapiPrimitiveTypes | OpenapiTypeFieldObject

export interface OpenapiTypeFieldObject {
  [key: string]: OpenapiPrimitiveTypes | OpenapiTypeFieldObject
}

export type OpenapiFormats = 'application/json'
