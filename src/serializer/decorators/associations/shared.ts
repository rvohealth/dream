import { DreamConst, SerializableClassOrClasses } from '../../../dream/types'
import hasSerializersGetter from '../helpers/hasSerializersGetter'
import serializerAssociationToDreamSerializer from '../helpers/maybeSerializableToDreamSerializerCallbackFunction'

export type SerializableAssociationType = 'RendersOne' | 'RendersMany'

export interface DreamSerializerAssociationStatement {
  field: string
  flatten: boolean
  optional: boolean
  dreamOrSerializerClass: SerializableClassOrClasses | null
  source: string | typeof DreamConst.passthrough
  through: string | null
  type: SerializableAssociationType
  path: string | null
  exportedAs: string | null
  nullable: boolean
  serializerKey?: string
}

export interface RendersOneOrManyOpts {
  optional?: boolean
  source?: string | typeof DreamConst.passthrough
  through?: string
  path?: string
  exportedAs?: string
  serializerKey?: string
}

export function isSerializable(dreamOrSerializerClass: any) {
  return (
    Array.isArray(dreamOrSerializerClass) ||
    hasSerializersGetter(dreamOrSerializerClass) ||
    !!serializerAssociationToDreamSerializer(dreamOrSerializerClass)
  )
}
