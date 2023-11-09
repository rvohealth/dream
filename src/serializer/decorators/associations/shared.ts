import DreamSerializer from '../..'

export type SerializableTypes = 'date'
export type DreamSerializerClassCB = () => typeof DreamSerializer
export type SerializableAssociationType = 'RendersOne' | 'RendersMany'

export interface AssociationStatement {
  field: string
  flatten: boolean
  optional: boolean
  serializerClassCB: DreamSerializerClassCB | null
  source: string
  through: string | null
  type: SerializableAssociationType
}
