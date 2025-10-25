import DreamSerializer from '../../../../src/serializer/DreamSerializer.js'
import WorkoutType from '../../models/Polymorphic/WorkoutType.js'

export const WorkouttypeSerializer = (workoutType: WorkoutType) =>
  DreamSerializer(WorkoutType, workoutType).attribute('workoutType')
