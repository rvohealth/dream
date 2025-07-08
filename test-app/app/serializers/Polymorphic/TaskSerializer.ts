import { DreamSerializer } from '../../../../src/index.js'
import PolymorphicTask from '../../models/Polymorphic/Task.js'

export const PolymorphicTaskSerializer = (task: PolymorphicTask) =>
  DreamSerializer(PolymorphicTask, task).rendersOne('taskable', { flatten: true })
