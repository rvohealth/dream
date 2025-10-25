import NonLoadedAssociation from '../../../src/errors/associations/NonLoadedAssociation.js'
import { DreamClassAssociationAndStatement } from '../../../src/types/dream.js'
import ApplicationModel from '../../../test-app/app/models/ApplicationModel.js'
import ModelA from '../../../test-app/app/models/CircularReference/ModelA.js'
import ModelB from '../../../test-app/app/models/CircularReference/ModelB.js'
import CircularReferenceModel from '../../../test-app/app/models/CircularReferenceModel.js'
import Collar from '../../../test-app/app/models/Collar.js'
import Pet from '../../../test-app/app/models/Pet.js'
import Chore from '../../../test-app/app/models/Polymorphic/Chore.js'
import ChoreCleaningSupply from '../../../test-app/app/models/Polymorphic/ChoreCleaningSupply.js'
import CleaningSupply from '../../../test-app/app/models/Polymorphic/CleaningSupply.js'
import PolymorphicTask from '../../../test-app/app/models/Polymorphic/Task.js'
import PolymorphicUser from '../../../test-app/app/models/Polymorphic/User.js'
import Workout from '../../../test-app/app/models/Polymorphic/Workout.js'
import WorkoutType from '../../../test-app/app/models/Polymorphic/WorkoutType.js'
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
    const workoutType = await WorkoutType.create({ workoutType: 'cycling' })
    const workout = await Workout.create({ workoutType })
    const cleaningSupply = await CleaningSupply.create()

    await ChoreCleaningSupply.create({ chore, cleaningSupply })

    const choreTask = await PolymorphicTask.create({ user, taskable: chore })
    const workoutTask = await PolymorphicTask.create({ user, taskable: workout })

    const userWithPreloads = await PolymorphicUser.preloadFor('default')
      // .preload('tasks', 'taskable', 'workoutType' as any)
      .firstOrFail()

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
    expect(loadedWorkoutTask.taskable.workoutType).toMatchDreamModel(workoutType)
  })

  context('when there is a circular reference in the serializers', () => {
    it('fully preloads everything necessary to fully serialize the model 4 times', async () => {
      const model1 = await CircularReferenceModel.create()
      const model2 = await CircularReferenceModel.create({ parent: model1 })
      const model3 = await CircularReferenceModel.create({ parent: model2 })
      const model4 = await CircularReferenceModel.create({ parent: model3 })
      await CircularReferenceModel.create({ parent: model4 })

      const reloadedModel1 = await CircularReferenceModel.preloadFor('default').findOrFail(model1.id)
      expect(reloadedModel1).toMatchDreamModel(model1)

      const reloadedModel2 = reloadedModel1.child
      expect(reloadedModel2).toMatchDreamModel(model2)

      const reloadedModel3 = reloadedModel2.child
      expect(reloadedModel3).toMatchDreamModel(model3)

      const reloadedModel4 = reloadedModel3.child
      expect(reloadedModel4).toMatchDreamModel(model4)

      // model 4 can be fully serialized, including its dependence on model 5
      const reloadedModel5 = reloadedModel4.child
      // model 5 cannot be serialized
      expect(() => reloadedModel5.child).toThrow(NonLoadedAssociation)
    })

    context(
      'a polymorphically associated model associated with the different parts of the circular association',
      () => {
        it('can be preloaded more than 4 times', async () => {
          const modelA1 = await ModelA.create()

          const modelB1 = await ModelB.create({ modelAParent: modelA1 })
          const modelA2 = await ModelA.create({ modelBParent: modelB1 })

          const modelB2 = await ModelB.create({ modelAParent: modelA2 })
          const modelA3 = await ModelA.create({ modelBParent: modelB2 })

          const modelB3 = await ModelB.create({ modelAParent: modelA3 })
          const modelA4 = await ModelA.create({ modelBParent: modelB3 })

          const modelB4 = await ModelB.create({ modelAParent: modelA4 })
          const modelA5 = await ModelA.create({ modelBParent: modelB4 })

          await ModelB.create({ modelAParent: modelA5 })

          const reloadedModelA1 = await ModelA.passthrough({ locale: 'en-US' })
            .preloadFor('default')
            .findOrFail(modelA1.id)
          expect(reloadedModelA1.currentLocalizedText).toMatchDreamModel(modelA1.currentLocalizedText)

          const reloadedModelB1 = reloadedModelA1.modelBChild
          const reloadedModelB1_2 = reloadedModelA1.modelBChild2
          expect(reloadedModelB1).toMatchDreamModel(modelB1)
          expect(reloadedModelB1_2).toMatchDreamModel(modelB1)
          expect(reloadedModelB1.currentLocalizedText).toMatchDreamModel(modelB1.currentLocalizedText)

          const reloadedModelA2 = reloadedModelB1.modelAChild
          expect(reloadedModelA2).toMatchDreamModel(modelA2)
          expect(reloadedModelA2.currentLocalizedText).toMatchDreamModel(modelA2.currentLocalizedText)

          const reloadedModelB2 = reloadedModelA2.modelBChild
          expect(reloadedModelB2).toMatchDreamModel(modelB2)
          expect(reloadedModelB2.currentLocalizedText).toMatchDreamModel(modelB2.currentLocalizedText)

          const reloadedModelA3 = reloadedModelB2.modelAChild
          expect(reloadedModelA3).toMatchDreamModel(modelA3)
          expect(reloadedModelA3.currentLocalizedText).toMatchDreamModel(modelA3.currentLocalizedText)

          const reloadedModelB3 = reloadedModelA3.modelBChild
          expect(reloadedModelB3).toMatchDreamModel(modelB3)
          expect(reloadedModelB3.currentLocalizedText).toMatchDreamModel(modelB3.currentLocalizedText)

          const reloadedModelA4 = reloadedModelB3.modelAChild
          expect(reloadedModelA4).toMatchDreamModel(modelA4)
          expect(reloadedModelA4.currentLocalizedText).toMatchDreamModel(modelA4.currentLocalizedText)

          const reloadedModelB4 = reloadedModelA4.modelBChild
          expect(reloadedModelB4).toMatchDreamModel(modelB4)
          expect(reloadedModelB4.currentLocalizedText).toMatchDreamModel(modelB4.currentLocalizedText)

          // model 4 can be fully serialized, including its dependence on model 5
          const reloadedModelA5 = reloadedModelB4.modelAChild
          expect(reloadedModelA5).toMatchDreamModel(modelA5)
          // model 5 cannot be serialized
          expect(() => reloadedModelA5.modelBChild).toThrow(NonLoadedAssociation)
        })
      }
    )
  })
})
