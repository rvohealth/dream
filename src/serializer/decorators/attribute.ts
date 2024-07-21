import DreamSerializer from '..'
import { RoundingPrecision } from '../../helpers/round'
import { OpenapiSchemaBodyShorthand, OpenapiShorthandPrimitiveTypes } from '../../openapi/types'

export default function Attribute(renderAs?: SerializableTypes, options?: AttributeRenderOptions): any {
  return function (target: any, key: string, def: any) {
    const serializerClass: typeof DreamSerializer = target.constructor
    if (!Object.getOwnPropertyDescriptor(serializerClass, 'attributeStatements'))
      serializerClass.attributeStatements = [
        ...(serializerClass.attributeStatements || []),
      ] as AttributeStatement[]

    serializerClass.attributeStatements = [
      ...serializerClass.attributeStatements,
      {
        field: key,
        functional: typeof def?.value === 'function',
        renderAs,
        options,
      } as AttributeStatement,
    ]
  }
}

export type SerializableTypes = OpenapiShorthandPrimitiveTypes | OpenapiSchemaBodyShorthand

export interface AttributeStatement {
  field: string
  functional: boolean
  renderAs?: SerializableTypes
  options?: AttributeRenderOptions
}

type AttributeRenderOptions = { precision?: RoundingPrecision; delegate?: string; allowNull?: boolean }
