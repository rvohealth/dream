import DreamSerializer from '../..'
import {
  DreamConst,
  SerializableClassOrClasses,
  SerializableDreamClassOrViewModelClass,
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
    (dreamOrSerializerClass as SerializableDreamClassOrViewModelClass)?.prototype?.serializers ||
    (dreamOrSerializerClass as typeof DreamSerializer)?.isDreamSerializer
  )
}
