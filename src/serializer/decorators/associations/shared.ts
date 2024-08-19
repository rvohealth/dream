import DreamSerializer from '../..'
import {
  DreamConst,
  SerializableClass,
  SerializableClassOrClasses,
  SerializableDreamOrViewModel,
} from '../../../dream/types'

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
    !!(dreamOrSerializerClass as typeof DreamSerializer)?.isDreamSerializer
  )
}

function hasSerializersGetter(dreamOrSerializerClass: SerializableClass): boolean {
  try {
    return !!(dreamOrSerializerClass?.prototype as SerializableDreamOrViewModel)?.serializers
  } catch {
    return false
  }
}
