import DreamSerializer from '../..'
import { AssociationStatement, DreamSerializerClassCB } from './shared'

export default function RendersOne(serializerClassCB: DreamSerializerClassCB): any {
  return function (target: any, key: string, def: any) {
    const serializerClass: typeof DreamSerializer = target.constructor

    if (!Object.getOwnPropertyDescriptor(serializerClass, 'associationStatements'))
      serializerClass.associationStatements = [] as AssociationStatement[]

    serializerClass.associationStatements = [
      ...serializerClass.associationStatements,
      {
        type: 'RendersOne',
        field: key,
        serializerClassCB,
      } as AssociationStatement,
    ]
  }
}
