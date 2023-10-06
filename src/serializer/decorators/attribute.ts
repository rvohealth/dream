import DreamSerializer from '..'
import { RoundingPrecision } from '../../helpers/round'

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

export type SerializableTypes = 'date' | 'round'

type AttributeRenderOptions = { precision?: RoundingPrecision }

export interface AttributeStatement {
  field: string
  functional: boolean
  renderAs?: SerializableTypes
  options?: AttributeRenderOptions
}
