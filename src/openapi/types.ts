export type OpenapiSchemaBody =
  | {
      type: 'object'
      required?: string[]
      properties?: OpenapiSchemaProperties
      nullable?: boolean
    }
  | {
      type: 'array'
      items: OpenapiSchemaBody
      nullable?: boolean
    }
  | {
      type: OpenapiPrimitiveTypes
      nullable?: boolean
    }

export interface OpenapiSchemaProperties {
  [key: string]: OpenapiSchemaBody
}

export type OpenapiSchemaBodyShorthand =
  | {
      type: 'object'
      required?: string[]
      properties?: OpenapiSchemaPropertiesShorthand
      nullable?: boolean
    }
  | {
      type: 'array'
      items: OpenapiSchemaBodyShorthand
      nullable?: boolean
    }
  | {
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
  'json',
] as const
export type OpenapiPrimitiveTypes = (typeof openapiPrimitiveTypes)[number]
export type OpenapiShorthandPrimitiveTypes = (typeof openapiShorthandPrimitiveTypes)[number]
export type OpenapiAllTypes = OpenapiPrimitiveTypes | 'object' | 'array'

export type OpenapiTypeField = OpenapiPrimitiveTypes | OpenapiTypeFieldObject

export interface OpenapiTypeFieldObject {
  [key: string]: OpenapiPrimitiveTypes | OpenapiTypeFieldObject
}

export type OpenapiFormats = 'application/json'
