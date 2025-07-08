import { DreamSerializer } from '../../../../src/index.js'
import Workout from '../../models/Polymorphic/Workout.js'

export const WorkoutSerializer = (workout: Workout) => DreamSerializer(Workout, workout).attribute('name')
