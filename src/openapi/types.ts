export type OpenapiSchemaBody =
  | OpenapiSchemaBase
  | OpenapiSchemaPrimitiveGeneric
  | OpenapiSchemaExpressionAnyOf
  | OpenapiSchemaExpressionOneOf
  | OpenapiSchemaObject

export type OpenapiSchemaBodyShorthand =
  | OpenapiSchemaBase
  | OpenapiSchemaShorthandPrimitiveGeneric
  | OpenapiSchemaShorthandExpressionAnyOf
  | OpenapiSchemaShorthandExpressionOneOf
  | OpenapiSchemaObjectShorthand

export type OpenapiSchemaBase = OpenapiSchemaArray | OpenapiSchemaExpressionRef

export type OpenapiSchemaShorthandExpressionAnyOf = {
  anyOf: OpenapiSchemaBodyShorthand[]
}

export type OpenapiSchemaShorthandExpressionOneOf = {
  oneOf: OpenapiSchemaBodyShorthand[]
}

export type OpenapiSchemaExpressionRef = {
  $ref: string
}

export type OpenapiSchemaExpressionAnyOf = {
  anyOf: OpenapiSchemaBody[]
}

export type OpenapiSchemaExpressionOneOf = {
  oneOf: OpenapiSchemaBody[]
}

export interface OpenapiSchemaObject {
  type: 'object'
  required?: string[]
  properties?: OpenapiSchemaProperties
  nullable?: boolean
}

export interface OpenapiSchemaObjectShorthand {
  type: 'object'
  required?: string[]
  properties?: OpenapiSchemaPropertiesShorthand
  nullable?: boolean
}

export interface OpenapiSchemaProperties {
  [key: string]: OpenapiSchemaBody
}

export interface OpenapiSchemaArray {
  type: 'array'
  items: OpenapiSchemaBodyShorthand
  nullable?: boolean
}

export interface OpenapiSchemaPrimitiveGeneric {
  type: OpenapiPrimitiveTypes
  nullable?: boolean
}

export interface OpenapiSchemaShorthandPrimitiveGeneric {
  type: OpenapiShorthandPrimitiveTypes
  nullable?: boolean
}

export interface OpenapiSchemaPropertiesShorthand {
  [key: string]: OpenapiSchemaBodyShorthand | OpenapiShorthandPrimitiveTypes
}

export const openapiPrimitiveTypes = ['string', 'boolean', 'number', 'date', 'date-time', 'decimal'] as const
export const openapiShorthandPrimitiveTypes = [
  ...openapiPrimitiveTypes,
  'string[]',
  'boolean[]',
  'number[]',
  'date[]',
  'date-time[]',
  'decimal[]',
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
