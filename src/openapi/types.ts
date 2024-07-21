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
  | OpenapiSchemaExpressionRefSchemaShorthand

export type OpenapiSchemaBase = OpenapiSchemaString | OpenapiSchemaArray | OpenapiSchemaExpressionRef

export type OpenapiSchemaShorthandExpressionAnyOf = {
  anyOf: OpenapiSchemaBodyShorthand[]
}

export type OpenapiSchemaShorthandExpressionOneOf = {
  oneOf: OpenapiSchemaBodyShorthand[]
}

export type OpenapiSchemaExpressionRef = {
  $ref: string
}

export type OpenapiSchemaExpressionRefSchemaShorthand = {
  $schema: string
}

export type OpenapiSchemaExpressionAnyOf = {
  anyOf: OpenapiSchemaBody[]
}

export type OpenapiSchemaExpressionOneOf = {
  oneOf: OpenapiSchemaBody[]
}

export type OpenapiSchemaCommonFields = {
  nullable?: boolean
  description?: string
  summary?: string
}

export type OpenapiSchemaString = {
  type: 'string'
  enum?: string[] | Readonly<string[]>
} & OpenapiSchemaCommonFields

export type OpenapiSchemaObject = {
  type: 'object'
  required?: string[]
  properties?: OpenapiSchemaProperties
} & OpenapiSchemaCommonFields

export type OpenapiSchemaObjectShorthand = {
  type: 'object'
  required?: string[]
  properties?: OpenapiSchemaPropertiesShorthand
} & OpenapiSchemaCommonFields

export interface OpenapiSchemaProperties {
  [key: string]: OpenapiSchemaBody
}

export type OpenapiSchemaArray = {
  type: 'array'
  items: OpenapiSchemaBodyShorthand
} & OpenapiSchemaCommonFields

export type OpenapiSchemaPrimitiveGeneric = {
  type: OpenapiPrimitiveTypes
} & OpenapiSchemaCommonFields

export type OpenapiSchemaShorthandPrimitiveGeneric = {
  type: OpenapiShorthandPrimitiveTypes
} & OpenapiSchemaCommonFields

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
