import { DreamClassAssociationAndStatement } from '../../../src/index.js'
import ApplicationModel from '../../../test-app/app/models/ApplicationModel.js'
import Collar from '../../../test-app/app/models/Collar.js'
import Pet from '../../../test-app/app/models/Pet.js'
import Chore from '../../../test-app/app/models/Polymorphic/Chore.js'
import ChoreCleaningSupply from '../../../test-app/app/models/Polymorphic/ChoreCleaningSupply.js'
import CleaningSupply from '../../../test-app/app/models/Polymorphic/CleaningSupply.js'
import PolymorphicTask from '../../../test-app/app/models/Polymorphic/Task.js'
import PolymorphicUser from '../../../test-app/app/models/Polymorphic/User.js'
import Workout from '../../../test-app/app/models/Polymorphic/Workout.js'
import Post from '../../../test-app/app/models/Post.js'
import Rating from '../../../test-app/app/models/Rating.js'
import User from '../../../test-app/app/models/User.js'

describe('Dream.preloadFor(serializerKey)', () => {
  it('preloads all associations necessary to fulfull the provided serializer key', async () => {
    const user = await User.create({ email: 'how@yadoin', password: 'howyadoin' })
    const pet = await Pet.create({ user })
    const post = await Post.create({ body: 'hi', user })
    const rating = await Rating.create({ user, rateable: post })
    await Collar.create({ pet })

    const collar = await Collar.query().preloadFor('default').firstOrFail()
    expect(collar.pet).toMatchDreamModel(pet)
    expect(collar.pet.ratings).toMatchDreamModels([rating])
  })

  context('with a callback function that returns an `and` modifier', () => {
    it('preloads all associations necessary to fulfull this serialization', async () => {
      const user = await User.create({ email: 'how@yadoin', password: 'howyadoin' })
      const pet = await Pet.create({ user })
      const post = await Post.create({ body: 'hi', user })
      await Rating.create({ user, rateable: post, rating: 3 })
      const rating2 = await Rating.create({ user, rateable: post, rating: 7 })
      await Collar.create({ pet })

      const collar = await Collar.query()
        .preloadFor('default', (associationName, dreamClass) => {
          if (dreamClass.typeof(Pet) && associationName === 'ratings') {
            const modifier: DreamClassAssociationAndStatement<typeof Post, 'ratings'> = {
              and: { rating: 7 },
            }
            return modifier
          }
        })
        .firstOrFail()
      expect(collar.pet).toMatchDreamModel(pet)
      expect(collar.pet.ratings).toMatchDreamModels([rating2])
    })
  })

  context('when given a serializer key', () => {
    it('renders the serializer key', async () => {
      const user = await User.create({ email: 'how@yadoin', password: 'howyadoin' })
      const pet = await Pet.create({ user })
      const post = await Post.create({ body: 'hi', user })
      await Rating.create({ user, rateable: post })
      await Collar.create({ pet })

      const collar = await Collar.query().preloadFor('summary').firstOrFail()
      expect(collar.pet).toMatchDreamModel(pet)
      expect(collar.pet.loaded('ratings')).toBe(false)
    })
  })

  context('deeply-nested associations', () => {
    it('renders the deeply-nested associations', async () => {
      const user = await User.create({ email: 'how@yadoin', password: 'howyadoin' })
      const pet = await Pet.create({ user })
      const post = await Post.create({ body: 'hi', user })
      const rating = await Rating.create({ user, rateable: post })
      await Collar.create({ pet })

      const collar = await Collar.query().preloadFor('deep').firstOrFail()
      expect(collar.pet).toMatchDreamModel(pet)
      expect(collar.pet.ratings).toMatchDreamModels([rating])
      expect(collar.pet.ratings[0]!.user).toMatchDreamModel(user)
    })
  })

  context('with a transaction', () => {
    it('loads the association', async () => {
      const user = await User.create({ email: 'how@yadoin', password: 'howyadoin' })
      const pet = await Pet.create({ user })
      const post = await Post.create({ body: 'hi', user })
      const rating = await Rating.create({ user, rateable: post })

      let reloaded: Collar

      await ApplicationModel.transaction(async txn => {
        await Collar.txn(txn).create({ pet })
        reloaded = await Collar.txn(txn).preloadFor('deep').firstOrFail()
      })

      expect(reloaded!.pet).toMatchDreamModel(pet)
      expect(reloaded!.pet.ratings).toMatchDreamModels([rating])
      expect(reloaded!.pet.ratings[0]!.user).toMatchDreamModel(user)
    })
  })

  it('preloads associations on the other side of a poplyorphic belongs-to', async () => {
    const user = await PolymorphicUser.create()
    const chore = await Chore.create()
    const workout = await Workout.create()
    const cleaningSupply = await CleaningSupply.create()

    await ChoreCleaningSupply.create({ chore, cleaningSupply })

    const choreTask = await PolymorphicTask.create({ user, taskable: chore })
    const workoutTask = await PolymorphicTask.create({ user, taskable: workout })

    const userWithPreloads = await PolymorphicUser.preloadFor('default').firstOrFail()

    const loadedChoreTask = userWithPreloads.tasks.find(
      (task): task is PolymorphicTask & { taskable: Chore } => task.taskableType === 'Chore'
    )!
    const loadedWorkoutTask = userWithPreloads.tasks.find(
      (task): task is PolymorphicTask & { taskable: Workout } => task.taskableType === 'Workout'
    )!

    expect(loadedChoreTask).toMatchDreamModel(choreTask)
    expect(loadedWorkoutTask).toMatchDreamModel(workoutTask)

    expect(loadedChoreTask.taskable).toMatchDreamModel(chore)
    expect(loadedWorkoutTask.taskable).toMatchDreamModel(workout)
    expect(loadedChoreTask.taskable.cleaningSupplies).toMatchDreamModels([cleaningSupply])
  })
})
