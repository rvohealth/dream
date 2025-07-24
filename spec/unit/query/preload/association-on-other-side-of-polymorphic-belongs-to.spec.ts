import { sql } from 'kysely'
import db from '../../../../src/db/index.js'
import Chore from '../../../../test-app/app/models/Polymorphic/Chore.js'
import ChoreCleaningSupply from '../../../../test-app/app/models/Polymorphic/ChoreCleaningSupply.js'
import ChoreImage from '../../../../test-app/app/models/Polymorphic/ChoreImage.js'
import CleaningSupply from '../../../../test-app/app/models/Polymorphic/CleaningSupply.js'
import Image from '../../../../test-app/app/models/Polymorphic/Image.js'
import PolymorphicTask from '../../../../test-app/app/models/Polymorphic/Task.js'
import TaskableImage from '../../../../test-app/app/models/Polymorphic/TaskableImage.js'
import PolymorphicUser from '../../../../test-app/app/models/Polymorphic/User.js'
import Workout from '../../../../test-app/app/models/Polymorphic/Workout.js'
import WorkoutImage from '../../../../test-app/app/models/Polymorphic/WorkoutImage.js'
import WorkoutType from '../../../../test-app/app/models/Polymorphic/WorkoutType.js'

describe('preloading associations on the other side of a polymorphic belongs-to', () => {
  let chore: Chore
  let workout: Workout

  let cleaningSupply: CleaningSupply
  let workoutType: WorkoutType

  let choreTask: PolymorphicTask
  let workoutTask: PolymorphicTask

  beforeEach(async () => {
    // reset sequences to ensure that the id of the chore and the id of the workout both start
    // from 1, which enabled the spec failure because both the Chore and the Workout were (incorrectly)
    // having the cleaning supply loaded on them
    await Promise.all([
      sql`ALTER SEQUENCE polymorphic_users_id_seq RESTART 1;`.execute(db('default', 'primary')),
      sql`ALTER SEQUENCE polymorphic_tasks_id_seq RESTART 1;`.execute(db('default', 'primary')),
      sql`ALTER SEQUENCE polymorphic_chores_id_seq RESTART 1;`.execute(db('default', 'primary')),
      sql`ALTER SEQUENCE polymorphic_workouts_id_seq RESTART 1;`.execute(db('default', 'primary')),
      sql`ALTER SEQUENCE polymorphic_cleaning_supplies_id_seq RESTART 1;`.execute(db('default', 'primary')),
      sql`ALTER SEQUENCE polymorphic_chore_cleaning_supplies_id_seq RESTART 1;`.execute(
        db('default', 'primary')
      ),
    ])

    const user = await PolymorphicUser.create()
    cleaningSupply = await CleaningSupply.create()
    workoutType = await WorkoutType.create({ workoutType: 'cycling' })

    chore = await Chore.create()
    workout = await Workout.create({ workoutType })

    await ChoreCleaningSupply.create({ chore, cleaningSupply })

    choreTask = await PolymorphicTask.create({ user, taskable: chore })
    workoutTask = await PolymorphicTask.create({ user, taskable: workout })
  })

  it(
    'allows specifying of associations that only exist on some of the associations on the other side ' +
      'of the polymorphic belongs-to',
    async () => {
      const user = await PolymorphicUser.preload('tasks', 'taskable', [
        'cleaningSupplies',
        /**
         * TODO: figure out why types disallow loading associations on the other side of a
         * polymorphic belongs-to association other than those associated with the first
         * of the polymorphic classes (first as ordered by table name)
         */
        'workoutType' as any,
      ]).firstOrFail()

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
      expect(loadedWorkoutTask.taskable.workoutType).toMatchDreamModel(workoutType)
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

  context('has many on the other side of a polymorphic belongs-to', () => {
    it('loads through a non-polymorphic association', async () => {
      const choreImage = await Image.create({ url: 'https://images.com/chore.png' })
      const workoutImage = await Image.create({ url: 'https://images.com/workout.png' })
      await ChoreImage.create({ image: choreImage, chore })
      await WorkoutImage.create({ image: workoutImage, workout })

      const user = await PolymorphicUser.preload('tasks', 'taskable', ['images']).firstOrFail()

      const loadedChoreTask = user.tasks.find(
        (task): task is PolymorphicTask & { taskable: Chore } => task.taskableType === 'Chore'
      )!
      const loadedWorkoutTask = user.tasks.find(
        (task): task is PolymorphicTask & { taskable: Chore } => task.taskableType === 'Workout'
      )!

      expect(loadedChoreTask.taskable.images).toMatchDreamModels([choreImage])
      expect(loadedWorkoutTask.taskable.images).toMatchDreamModels([workoutImage])
    })

    it('loads through a polymorphic association', async () => {
      const choreImage = await Image.create({ url: 'https://images.com/chore.png' })
      const workoutImage = await Image.create({ url: 'https://images.com/workout.png' })
      await TaskableImage.create({ image: choreImage, taskable: chore })
      await TaskableImage.create({ image: workoutImage, taskable: workout })

      const user = await PolymorphicUser.preload('tasks', 'taskable', [
        'imagesThroughTaskableImages',
      ]).firstOrFail()

      const loadedChoreTask = user.tasks.find(
        (task): task is PolymorphicTask & { taskable: Chore } => task.taskableType === 'Chore'
      )!
      const loadedWorkoutTask = user.tasks.find(
        (task): task is PolymorphicTask & { taskable: Chore } => task.taskableType === 'Workout'
      )!

      expect(loadedChoreTask.taskable.imagesThroughTaskableImages).toMatchDreamModels([choreImage])
      expect(loadedWorkoutTask.taskable.imagesThroughTaskableImages).toMatchDreamModels([workoutImage])
    })
  })
})
