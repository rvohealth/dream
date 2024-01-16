import DreamSerializer from '../..'
import { DreamConst } from '../../../dream/types'
import { AssociationStatement, DreamSerializerClassCB } from './shared'

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
      } as AssociationStatement,
    ]
  }
}

export interface RendersManyOpts {
  optional?: boolean
  source?: string | typeof DreamConst.passthrough
  through?: string
}
