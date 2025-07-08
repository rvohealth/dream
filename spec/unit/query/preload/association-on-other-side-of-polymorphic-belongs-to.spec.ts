import { sql } from 'kysely'
import db from '../../../../src/db/index.js'
import Chore from '../../../../test-app/app/models/Polymorphic/Chore.js'
import ChoreCleaningSupply from '../../../../test-app/app/models/Polymorphic/ChoreCleaningSupply.js'
import CleaningSupply from '../../../../test-app/app/models/Polymorphic/CleaningSupply.js'
import PolymorphicTask from '../../../../test-app/app/models/Polymorphic/Task.js'
import PolymorphicUser from '../../../../test-app/app/models/Polymorphic/User.js'
import Workout from '../../../../test-app/app/models/Polymorphic/Workout.js'

describe('preloading associations on the other side of a polymorphic belongs-to', () => {
  let chore: Chore
  let workout: Workout
  let cleaningSupply: CleaningSupply

  let choreTask: PolymorphicTask
  let workoutTask: PolymorphicTask

  beforeEach(async () => {
    await Promise.all([
      sql`ALTER SEQUENCE polymorphic_users_id_seq RESTART 1;`.execute(db('primary')),
      sql`ALTER SEQUENCE polymorphic_tasks_id_seq RESTART 1;`.execute(db('primary')),
      sql`ALTER SEQUENCE polymorphic_chores_id_seq RESTART 1;`.execute(db('primary')),
      sql`ALTER SEQUENCE polymorphic_workouts_id_seq RESTART 1;`.execute(db('primary')),
      sql`ALTER SEQUENCE polymorphic_cleaning_supplies_id_seq RESTART 1;`.execute(db('primary')),
      sql`ALTER SEQUENCE polymorphic_chore_cleaning_supplies_id_seq RESTART 1;`.execute(db('primary')),
    ])

    const user = await PolymorphicUser.create()
    chore = await Chore.create()
    workout = await Workout.create()
    cleaningSupply = await CleaningSupply.create()

    await ChoreCleaningSupply.create({ chore, cleaningSupply })

    choreTask = await PolymorphicTask.create({ user, taskable: chore })
    workoutTask = await PolymorphicTask.create({ user, taskable: workout })
  })

  it(
    'allows specifying of associations that only exist on some of the associations on the other side ' +
      'of the polymorphic belongs-to',
    async () => {
      const user = await PolymorphicUser.preload('tasks', 'taskable', ['cleaningSupplies']).firstOrFail()

      const loadedChoreTask = user.tasks.find(
        (task): task is PolymorphicTask & { taskable: Chore } => task.taskableType === 'Chore'
      )!
      const loadedWorkoutTask = user.tasks.find(
        (task): task is PolymorphicTask & { taskable: Workout } => task.taskableType === 'Workout'
      )!

      expect(loadedChoreTask).toMatchDreamModel(choreTask)
      expect(loadedWorkoutTask).toMatchDreamModel(workoutTask)

      expect(loadedChoreTask.taskable).toMatchDreamModel(chore)
      expect(loadedWorkoutTask.taskable).toMatchDreamModel(workout)
      expect(loadedChoreTask.taskable.cleaningSupplies).toMatchDreamModels([cleaningSupply])
    }
  )

  it('does not set the property on models that don’t have the association', async () => {
    const user = await PolymorphicUser.preload('tasks', 'taskable', ['cleaningSupplies']).firstOrFail()

    const loadedChoreTask = user.tasks.find(
      (task): task is PolymorphicTask & { taskable: Chore } => task.taskableType === 'Chore'
    )!
    const loadedWorkoutTask = user.tasks.find(
      (task): task is PolymorphicTask & { taskable: Chore } => task.taskableType === 'Workout'
    )!

    expect(loadedChoreTask.taskable.cleaningSupplies).toMatchDreamModels([cleaningSupply])
    expect(loadedWorkoutTask.taskable.cleaningSupplies).toBeUndefined()
  })
})
