import DreamSerializer from '../../../../src/serializer/DreamSerializer.js'
import Chore from '../../models/Polymorphic/Chore.js'
import PolymorphicTask from '../../models/Polymorphic/Task.js'
import Workout from '../../models/Polymorphic/Workout.js'

export const PolymorphicTaskSerializer = (task: PolymorphicTask) =>
  DreamSerializer(PolymorphicTask, task).rendersOne('taskable', { flatten: true })

export const PolymorphicTaskWithExplicitRendersOneSerializer = (task: PolymorphicTask) =>
  DreamSerializer(PolymorphicTask, task).rendersOne('taskable', {
    flatten: true,
    serializer: ExplicitTaskableSerializer,
  })

export const ExplicitTaskableSerializer = (taskable: Chore | Workout) =>
  DreamSerializer(Chore, taskable).attribute('name')
