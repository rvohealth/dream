import DreamSerializer from '../..'
import { DreamConst } from '../../../dream/types'

export type SerializableTypes = 'date'
export type DreamSerializerClassCB = () => typeof DreamSerializer
export type SerializableAssociationType = 'RendersOne' | 'RendersMany'

export interface AssociationStatement {
  field: string
  flatten: boolean
  optional: boolean
  serializerClassCB: DreamSerializerClassCB | null
  source: string | typeof DreamConst.passthrough
  through: string | null
  type: SerializableAssociationType
}
