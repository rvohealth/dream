import { DreamSerializer } from '../../../../src/index.js'
import CleaningSupply from '../../models/Polymorphic/CleaningSupply.js'

export const CleaningSupplySerializer = (cleaningSupply: CleaningSupply) =>
  DreamSerializer(CleaningSupply, cleaningSupply).attribute('name')
