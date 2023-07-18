import DreamSerializer from '../..'

export type SerializableTypes = 'date'
export type DreamSerializerClassCB = () => typeof DreamSerializer
export type SerializableAssociationType = 'RendersOne' | 'RendersMany'

export interface AssociationStatement {
  field: string
  serializerClassCB: DreamSerializerClassCB | null
  type: SerializableAssociationType
  flatten: boolean
  source: string
  through: string | null
}
