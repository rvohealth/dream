import DreamSerializer from '../..'
import { AssociationStatement, DreamSerializerClassCB, RendersOneOrManyOpts } from './shared'

export default function RendersMany(
  serializerClassCB: DreamSerializerClassCB | RendersManyOpts | null = null,
  opts?: RendersManyOpts
): any {
  return function (target: any, key: string, def: any) {
    const serializerClass: typeof DreamSerializer = target.constructor
    opts ||= (serializerClassCB || {}) as RendersManyOpts
    if (typeof serializerClassCB !== 'function') {
      serializerClassCB = null
    }

    if (!Object.getOwnPropertyDescriptor(serializerClass, 'associationStatements'))
      serializerClass.associationStatements = [
        ...(serializerClass.associationStatements || []),
      ] as AssociationStatement[]

    serializerClass.associationStatements = [
      ...serializerClass.associationStatements,
      {
        type: 'RendersMany',
        field: key,
        optional: opts.optional || false,
        serializerClassCB,
        source: opts.source || key,
        through: opts.through || null,
        path: opts.path || null,
        exportedAs: opts.exportedAs || null,
      } as AssociationStatement,
    ]
  }
}

export interface RendersManyOpts extends RendersOneOrManyOpts {}
