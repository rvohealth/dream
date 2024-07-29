import DreamSerializer from '../..'
import { DreamClassOrViewModelClass, DreamConst } from '../../../dream/types'

export type SerializableTypes = 'date'
export type DreamSerializerClassCB = () =>
  | typeof DreamSerializer
  | DreamClassOrViewModelClass
  | DreamClassOrViewModelClass[]

export type SerializableAssociationType = 'RendersOne' | 'RendersMany'

export interface DreamSerializerAssociationStatement {
  field: string
  flatten: boolean
  optional: boolean
  dreamOrSerializerClassCB: DreamSerializerClassCB | null
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
  serializer?: string
}
