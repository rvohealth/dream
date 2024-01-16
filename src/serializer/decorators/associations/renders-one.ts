import DreamSerializer from '../..'
import { DreamConst } from '../../../dream/types'
import { AssociationStatement, DreamSerializerClassCB } from './shared'

export default function RendersOne(
  serializerClassCB: DreamSerializerClassCB | RendersOneOpts | null = null,
  opts?: RendersOneOpts
): any {
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
        source: opts.source || key,
        through: opts.through || null,
      } as AssociationStatement,
    ]
  }
}

export interface RendersOneOpts {
  flatten?: boolean
  optional?: boolean
  source?: string | typeof DreamConst.passthrough
  through?: string
}
