import DreamSerializer from '../..'
import { AssociationStatement, DreamSerializerClassCB, RendersOneOrManyOpts } from './shared'

export default function RendersOne(
  serializerClassCB: DreamSerializerClassCB | RendersOneOpts | null = null,
  opts?: RendersOneOpts
): any {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  return function (target: any, key: string, def: any) {
    const serializerClass: typeof DreamSerializer = target.constructor
    opts ||= (serializerClassCB || {}) as RendersOneOpts
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
        type: 'RendersOne',
        field: key,
        flatten: opts.flatten || false,
        optional: opts.optional || false,
        serializerClassCB,
        serializerKey: opts.serializerKey,
        source: opts.source || key,
        through: opts.through || null,
        path: opts.path || null,
        exportedAs: opts.exportedAs || null,
      } as AssociationStatement,
    ]
  }
}

export interface RendersOneOpts extends RendersOneOrManyOpts {
  flatten?: boolean
}
