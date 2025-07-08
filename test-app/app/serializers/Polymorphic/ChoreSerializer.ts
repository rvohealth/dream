import { DreamSerializer } from '../../../../src/index.js'
import Chore from '../../models/Polymorphic/Chore.js'

export const ChoreSerializer = (chore: Chore) =>
  DreamSerializer(Chore, chore).attribute('name').rendersMany('cleaningSupplies')
