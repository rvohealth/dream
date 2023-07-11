import DreamSerializer from '../..'
import { AssociationStatement, DreamSerializerClassCB } from './shared'

export default function RendersMany(
  serializerClassCB: DreamSerializerClassCB,
  opts: RendersManyOpts = {}
): any {
  return function (target: any, key: string, def: any) {
    const serializerClass: typeof DreamSerializer = target.constructor

    if (!Object.getOwnPropertyDescriptor(serializerClass, 'associationStatements'))
      serializerClass.associationStatements = [] as AssociationStatement[]

    serializerClass.associationStatements = [
      ...serializerClass.associationStatements,
      {
        type: 'RendersMany',
        field: key,
        serializerClassCB,
        source: opts.source || key,
      } as AssociationStatement,
    ]
  }
}

export interface RendersManyOpts {
  source?: string
}
