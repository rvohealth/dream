import DreamSerializer from '../../../../src/serializer/DreamSerializer.js'
import StiBase from '../../models/Sti/Base.js'

export const StiBaseSummarySerializer = <T extends StiBase>(StiChildClass: typeof StiBase, stiBase: T) =>
  DreamSerializer(StiChildClass ?? StiBase, stiBase).attribute('id')

export const StiBaseSerializer = <T extends StiBase>(StiChildClass: typeof StiBase, stiBase: T) =>
  StiBaseSummarySerializer(StiChildClass, stiBase).attribute('name')
