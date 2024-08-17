import DreamSerializer from '../..'
import Dream from '../../../dream'
import { DreamClassOrViewModelClass, DreamConst } from '../../../dream/types'

export type SerializableTypes = 'date'
export type DreamSerializerClass =
  | typeof DreamSerializer
  | DreamClassOrViewModelClass
  | DreamClassOrViewModelClass[]

export type SerializableAssociationType = 'RendersOne' | 'RendersMany'

export interface DreamSerializerAssociationStatement {
  field: string
  flatten: boolean
  optional: boolean
  dreamOrSerializerClass: DreamSerializerClass | null
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

export function isDreamOrSerializerClass(dreamOrSerializerClass: any) {
  return (
    Array.isArray(dreamOrSerializerClass) ||
    (dreamOrSerializerClass as typeof Dream)?.isDream ||
    (dreamOrSerializerClass as typeof DreamSerializer)?.isDreamSerializer
  )
}
