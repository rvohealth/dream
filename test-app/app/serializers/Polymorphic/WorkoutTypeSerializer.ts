import { DreamSerializer } from '../../../../src/index.js'
import WorkoutType from '../../models/Polymorphic/WorkoutType.js'

export const WorkouttypeSerializer = (workoutType: WorkoutType) =>
  DreamSerializer(WorkoutType, workoutType).attribute('workoutType')
