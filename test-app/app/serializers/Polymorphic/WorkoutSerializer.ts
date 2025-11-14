import DreamSerializer from '../../../../src/serializer/DreamSerializer.js'
import Workout from '../../models/Polymorphic/Workout.js'

export const WorkoutSerializer = (workout: Workout) =>
  DreamSerializer(Workout, workout).attribute('name').rendersOne('workoutType')
