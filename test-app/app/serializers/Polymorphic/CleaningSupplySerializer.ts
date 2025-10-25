import DreamSerializer from '../../../../src/serializer/DreamSerializer.js'
import CleaningSupply from '../../models/Polymorphic/CleaningSupply.js'

export const CleaningSupplySerializer = (cleaningSupply: CleaningSupply) =>
  DreamSerializer(CleaningSupply, cleaningSupply).attribute('name')
