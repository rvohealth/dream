import DreamApp from '../../../src/dream-app/index.js'
import Dream from '../../../src/Dream.js'
import NonLoadedAssociation from '../../../src/errors/associations/NonLoadedAssociation.js'
import MissingSerializersDefinition from '../../../src/errors/serializers/MissingSerializersDefinition.js'
import MissingSerializersDefinitionForKey from '../../../src/errors/serializers/MissingSerializersDefinitionForKey.js'
import NoGlobalSerializerForSpecifiedKey from '../../../src/errors/serializers/NoGlobalSerializerForSpecifiedKey.js'
import NonDreamSerializerDerivedFromGlobalSerializerForSpecifiedKey from '../../../src/errors/serializers/NonDreamSerializerDerivedFromGlobalSerializerForSpecifiedKey.js'
import inferSerializerFromDreamOrViewModel from '../../../src/serializer/helpers/inferSerializerFromDreamOrViewModel.js'
import { DreamClassAssociationAndStatement } from '../../../src/types/dream.js'
import ApplicationModel from '../../../test-app/app/models/ApplicationModel.js'
import Balloon from '../../../test-app/app/models/Balloon.js'
import Latex from '../../../test-app/app/models/Balloon/Latex.js'
import Animal from '../../../test-app/app/models/Balloon/Latex/Animal.js'
import Mylar from '../../../test-app/app/models/Balloon/Mylar.js'
import BalloonLine from '../../../test-app/app/models/BalloonLine.js'
import ModelA from '../../../test-app/app/models/CircularReference/ModelA.js'
import ModelB from '../../../test-app/app/models/CircularReference/ModelB.js'
import CircularReferenceModel from '../../../test-app/app/models/CircularReferenceModel.js'
import Collar from '../../../test-app/app/models/Collar.js'
import Composition from '../../../test-app/app/models/Composition.js'
import CompositionAsset from '../../../test-app/app/models/CompositionAsset.js'
import HeartRating from '../../../test-app/app/models/ExtraRating/HeartRating.js'
import LocalizedText from '../../../test-app/app/models/LocalizedText.js'
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
import Sandbag from '../../../test-app/app/models/Sandbag.js'
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

  context('cached generation of preloadFor associations', () => {
    it('renders the same results multiple times', async () => {
      const user = await User.create({ email: 'how@yadoin', password: 'howyadoin' })
      const pet = await Pet.create({ user })
      const post = await Post.create({ body: 'hi', user })
      const rating = await Rating.create({ user, rateable: post })
      await Collar.create({ pet })

      const defaultCollar = await Collar.query().preloadFor('default').firstOrFail()
      expect(defaultCollar.pet).toMatchDreamModel(pet)
      expect(defaultCollar.pet.ratings).toMatchDreamModels([rating])

      const defaultCollar2 = await Collar.query().preloadFor('default').firstOrFail()
      expect(defaultCollar2.pet).toMatchDreamModel(pet)
      expect(defaultCollar2.pet.ratings).toMatchDreamModels([rating])
    })

    it('renders different results for different serializerKeys', async () => {
      const user = await User.create({ email: 'how@yadoin', password: 'howyadoin' })
      const pet = await Pet.create({ user })
      const post = await Post.create({ body: 'hi', user })
      const rating = await Rating.create({ user, rateable: post })
      await Collar.create({ pet })

      const defaultCollar = await Collar.query().preloadFor('default').firstOrFail()
      expect(defaultCollar.pet).toMatchDreamModel(pet)
      expect(defaultCollar.pet.ratings).toMatchDreamModels([rating])

      const summaryCollar = await Collar.query().preloadFor('summary').firstOrFail()
      expect(summaryCollar.pet).toMatchDreamModel(pet)
      expect(summaryCollar.pet.loaded('ratings')).toBe(false)
    })
  })

  context("with a callback function that returns 'omit'", () => {
    context('when the omitted association is nested', () => {
      it('leaves its parent preloaded and preloads nothing beneath it', async () => {
        const user = await User.create({ email: 'omit-nested@preload.test', password: 'howyadoin' })
        const pet = await Pet.create({ user })
        const post = await Post.create({ body: 'hi', user })
        await Rating.create({ user, rateable: post })
        await Collar.create({ pet })

        // Collar's `default` serializer yields the single path [[Collar, 'pet'], [Pet, 'ratings']]
        const query = Collar.query().preloadFor('default', associationName =>
          associationName === 'ratings' ? 'omit' : undefined
        )
        const collar = await query.firstOrFail()

        expect(Object.keys((query as any)['preloadStatements'])).toEqual(['pet'])
        expect(collar.loaded('pet')).toBe(true)
        expect(collar.pet).toMatchDreamModel(pet)
        expect(collar.pet.loaded('ratings')).toBe(false)
      })
    })

    context('when the omitted association is at the top level', () => {
      it('preloads nothing from that path', async () => {
        const user = await User.create({ email: 'omit-top@preload.test', password: 'howyadoin' })
        const pet = await Pet.create({ user })
        const post = await Post.create({ body: 'hi', user })
        await Rating.create({ user, rateable: post })
        await Collar.create({ pet })

        const query = Collar.query().preloadFor('default', associationName =>
          associationName === 'pet' ? 'omit' : undefined
        )
        const collar = await query.firstOrFail()

        expect((query as any)['preloadStatements']).toEqual({})
        expect(collar.loaded('pet')).toBe(false)
      })

      it("never re-roots the omitted association's tail on the queried class", async () => {
        const user = await User.create({ email: 'omit-reroot@preload.test', password: 'howyadoin' })
        const pet = await Pet.create({ user })
        const post = await Post.create({ body: 'hi', user })
        await Rating.create({ user, rateable: post })
        await Collar.create({ pet })

        const seen: string[] = []
        const query = Collar.query().preloadFor('default', associationName => {
          seen.push(associationName)
          return associationName === 'pet' ? 'omit' : undefined
        })
        await query.firstOrFail()

        // `ratings` is only reachable through `pet`. Omitting `pet` must discard the rest of the
        // path; otherwise `ratings` is re-interpreted against Collar, the class the query is rooted
        // on, and an association the caller never asked for gets preloaded.
        expect(seen).not.toContain('ratings')
        expect(Object.keys((query as any)['preloadStatements'])).not.toContain('ratings')
      })
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

  context('STI: associations referenced only by an STI child serializer', () => {
    // Regression: when preloadFor is invoked on the STI base, the preload tree
    // must include associations that appear via rendersOne / rendersMany /
    // delegatedAttribute on the STI children's serializers — even if the base
    // model itself never registers that serializer key. The expansion happens
    // through expandStiClasses inside inferSerializersFromDreamClassOrViewModelClass.
    it("preloads associations declared via delegatedAttribute on a child's serializer when querying the STI base", async () => {
      const user = await User.create({ email: 'sti@preload.test', password: 'howyadoin' })
      const mylar = await Mylar.create({ user, color: 'red' })
      await BalloonLine.create({ balloon: mylar, material: 'nylon' })

      const reloaded = (await Balloon.query().preloadFor('delegated').firstOrFail()) as Mylar
      expect(reloaded).toMatchDreamModel(mylar)
      // `balloonLine` is referenced only by Mylar's `delegated` serializer
      // (Balloon/DelegatedAttributeSerializer) via `.delegatedAttribute('balloonLine', ...)`.
      // The Balloon STI base does not register the `delegated` key at all, so this
      // association can only be discovered by walking the STI children.
      expect(reloaded.loaded('balloonLine')).toBe(true)
      expect(reloaded.balloonLine).toMatchDreamModel(
        await BalloonLine.where({ balloonId: mylar.id }).firstOrFail()
      )
    })
  })

  context('STI: a serializer key that every STI child registers with a different serializer', () => {
    // The `stiUnion` key is registered by all three of Balloon's STI children, each with its own
    // serializer (Balloon/StiUnion{Animal,Latex,Mylar}Serializer):
    //
    //   Animal (sorts first)  rendersMany('sandbags'), delegatedAttribute('balloonLine', 'material')
    //   Latex                 rendersMany('sandbags'), rendersMany('heartRatings')
    //   Mylar                 rendersMany('sandbags'), rendersOne('balloonLine')
    //
    // preloadFor on the Balloon STI base must union the preload paths derived from every child's
    // serializer, rather than deriving them from the alphabetically-first child alone.
    it('preloads an association rendered only by a child that does not sort first alphabetically', async () => {
      const user = await User.create({ email: 'sti-union@preload.test', password: 'howyadoin' })
      const latex = await Latex.create({ user, color: 'blue' })
      const heartRating = await HeartRating.create({ user, extraRateable: latex, rating: 5 })

      const reloaded = (await Balloon.query().preloadFor('stiUnion').firstOrFail()) as Latex
      expect(reloaded).toMatchDreamModel(latex)
      // `heartRatings` is rendered only by Latex's `stiUnion` serializer, and Latex sorts after
      // Animal, so a traversal of the alphabetically-first child's serializer never sees it.
      expect(reloaded.loaded('heartRatings')).toBe(true)
      expect(reloaded.heartRatings).toMatchDreamModels([heartRating])
    })

    context('when the result set contains a row of every STI child at once', () => {
      it("loads and renders each row's own child serializer's associations", async () => {
        const user = await User.create({ email: 'sti-union-all@preload.test', password: 'howyadoin' })

        const animal = await Animal.create({ user, color: 'green' })
        const animalSandbag = await Sandbag.create({ balloonId: animal.id, weight: 1 })
        await BalloonLine.create({ balloon: animal, material: 'nylon' })

        const latex = await Latex.create({ user, color: 'blue' })
        const latexSandbag = await Sandbag.create({ balloonId: latex.id, weight: 2 })
        const heartRating = await HeartRating.create({ user, extraRateable: latex, rating: 5 })

        const mylar = await Mylar.create({ user, color: 'red' })
        const mylarSandbag = await Sandbag.create({ balloonId: mylar.id, weight: 3 })
        const mylarBalloonLine = await BalloonLine.create({ balloon: mylar, material: 'twine' })

        const balloons = await Balloon.query().preloadFor('stiUnion').all()
        expect(balloons.map(balloon => balloon.type).sort()).toEqual(['Animal', 'Latex', 'Mylar'])
        const reloaded = <T extends Balloon>(balloon: T) => balloons.find(b => b.id === balloon.id) as T
        const reloadedAnimal = reloaded(animal)
        const reloadedLatex = reloaded(latex)
        const reloadedMylar = reloaded(mylar)

        // Every row must carry the associations its *own* serializer renders. A narrowing of the
        // union that decided once per query — off the first row's class, say — instead of once per
        // concrete-class partition would leave two of these three rows under-loaded.
        expect(reloadedAnimal.loaded('sandbags')).toBe(true)
        expect(reloadedAnimal.sandbags).toMatchDreamModels([animalSandbag])
        expect(reloadedAnimal.loaded('balloonLine')).toBe(true)

        expect(reloadedLatex.loaded('sandbags')).toBe(true)
        expect(reloadedLatex.sandbags).toMatchDreamModels([latexSandbag])
        expect(reloadedLatex.loaded('heartRatings')).toBe(true)
        expect(reloadedLatex.heartRatings).toMatchDreamModels([heartRating])

        expect(reloadedMylar.loaded('sandbags')).toBe(true)
        expect(reloadedMylar.sandbags).toMatchDreamModels([mylarSandbag])
        expect(reloadedMylar.loaded('balloonLine')).toBe(true)
        expect(reloadedMylar.balloonLine).toMatchDreamModel(mylarBalloonLine)

        // ...and serializing proves it, rather than the `loaded` proxy standing in for it: an
        // association the union failed to preload for this row's partition throws
        // NonLoadedAssociation from render.
        const render = (balloon: Balloon) =>
          inferSerializerFromDreamOrViewModel(balloon, 'stiUnion')(balloon as never).render()

        expect(render(reloadedAnimal)).toEqual({
          color: 'green',
          // Animal terminates `balloonLine` with `delegatedAttribute('balloonLine', 'material')`
          material: 'nylon',
          sandbags: [expect.objectContaining({ weight: 1 })],
        })

        expect(render(reloadedLatex)).toEqual({
          color: 'blue',
          multicolor: null,
          sandbags: [expect.objectContaining({ weight: 2 })],
          heartRatings: [{ id: heartRating.id, type: 'HeartRating' }],
        })

        expect(render(reloadedMylar)).toEqual({
          color: 'red',
          mylarOnlyProperty: null,
          sandbags: [expect.objectContaining({ weight: 3 })],
          // Mylar renders `balloonLine` with `rendersOne`, whose serializer nests `balloon` —
          // rendering it at all proves the nested level of Mylar's path was preloaded too.
          // (`createdAt` is excluded from the assertion because it is clock-dependent.)
          balloonLine: expect.objectContaining({
            material: 'twine',
            balloon: { color: 'red', mylarOnlyProperty: null },
          }),
        })
      })
    })

    context('when more than one child renders the same association identically', () => {
      it('dedupes to a single path, calling modifierFn once with the STI base class and applying its `and`', async () => {
        const user = await User.create({ email: 'sti-union-dedupe@preload.test', password: 'howyadoin' })
        const mylar = await Mylar.create({ user, color: 'red' })
        await Sandbag.create({ mylar, weight: 3 })
        const heavySandbag = await Sandbag.create({ mylar, weight: 7 })

        const calls: [string, typeof Dream][] = []
        const reloaded = (await Balloon.query()
          .preloadFor('stiUnion', (associationName, dreamClass) => {
            calls.push([associationName, dreamClass])
            if (associationName === 'sandbags') {
              const modifier: DreamClassAssociationAndStatement<typeof Balloon, 'sandbags'> = {
                and: { weight: 7 },
              }
              return modifier
            }
          })
          .firstOrFail()) as Mylar

        // all three children render `sandbags` identically, so the three identical paths collapse
        expect(calls.filter(([associationName]) => associationName === 'sandbags')).toEqual([
          ['sandbags', Balloon],
        ])
        expect(reloaded.sandbags).toMatchDreamModels([heavySandbag])
      })
    })

    context('when two children reach the same association by different shapes', () => {
      it('emits both prefix-sharing paths, calling modifierFn once per path, with the last path’s `and` winning', async () => {
        const user = await User.create({ email: 'sti-union-diverge@preload.test', password: 'howyadoin' })
        const mylar = await Mylar.create({ user, color: 'red' })
        await BalloonLine.create({ balloon: mylar, material: 'twine' })

        const balloonLineAnds: { material: string }[] = []
        const reloaded = (await Balloon.query()
          .preloadFor('stiUnion', associationName => {
            if (associationName !== 'balloonLine') return undefined
            // Animal's path is emitted before Mylar's, so the first call belongs to Animal's
            // `delegatedAttribute('balloonLine', ...)` and the second to Mylar's
            // `rendersOne('balloonLine')`, whose serializer adds a nested `balloon` edge.
            const and = { material: balloonLineAnds.length === 0 ? 'nylon' : 'twine' } as const
            balloonLineAnds.push(and)
            return { and }
          })
          .firstOrFail()) as Mylar

        // Animal terminates `balloonLine` while Mylar renders it with a nested edge, so the two
        // paths share a prefix but are not identical and the dedupe cannot collapse them.
        expect(balloonLineAnds).toEqual([{ material: 'nylon' }, { material: 'twine' }])
        // `and` statements are assigned, not merged, so the later path's `and` replaces the
        // earlier one: the balloon line survives the preload because it is twine, not nylon.
        expect(reloaded.balloonLine).toMatchDreamModel(
          await BalloonLine.where({ balloonId: mylar.id }).firstOrFail()
        )
      })
    })

    context('when modifierFn omits an association that another child extends with a nested edge', () => {
      it('prunes the whole subtree rather than re-rooting the omitted association’s tail on the queried class', async () => {
        const user = await User.create({ email: 'sti-union-omit@preload.test', password: 'howyadoin' })
        const mylar = await Mylar.create({ user, color: 'red' })
        await BalloonLine.create({ balloon: mylar, material: 'twine' })

        const seen: [string, typeof Dream][] = []
        const query = Balloon.query().preloadFor('stiUnion', (associationName, dreamClass) => {
          seen.push([associationName, dreamClass])
          return associationName === 'balloonLine' ? 'omit' : undefined
        })
        const reloaded = await query.firstOrFail()

        expect(reloaded.loaded('balloonLine')).toBe(false)
        // Mylar's path is [Balloon.balloonLine, BalloonLine.balloon]. Omitting `balloonLine` must
        // discard the rest of that path; otherwise `balloon` is re-interpreted against Balloon (the
        // queried class), preloading an association the caller never asked for.
        expect(seen.map(([associationName]) => associationName)).not.toContain('balloon')
        expect(Object.keys((query as any)['preloadStatements'])).toEqual(['sandbags', 'heartRatings'])
      })
    })

    context('rooted on an STI child rather than the STI base', () => {
      it("preloads only that child's serializer's associations, not the union across its siblings", async () => {
        const user = await User.create({ email: 'sti-union-child@preload.test', password: 'howyadoin' })
        const latex = await Latex.create({ user, color: 'blue' })
        await BalloonLine.create({ balloon: latex, material: 'nylon' })

        const reloaded = await Latex.query().preloadFor('stiUnion').firstOrFail()
        expect(reloaded).toMatchDreamModel(latex)
        expect(reloaded.loaded('sandbags')).toBe(true)
        expect(reloaded.loaded('heartRatings')).toBe(true)
        // `balloonLine` is reached only by Animal's and Mylar's `stiUnion` serializers
        expect(reloaded.loaded('balloonLine')).toBe(false)
      })
    })
  })

  // Through 2.22.x, `resolveSerializerAssociationEdges` caught MissingSerializersDefinition while
  // resolving a rendersOne/rendersMany target's serializers and treated the target as having none.
  // As of 2.23.0 there is no such tolerance: every serializer that cannot be resolved while
  // building preload paths throws.
  context('when a rendersOne/rendersMany target cannot resolve a serializer', () => {
    // CompositionSerializer renders `compositionAssets`, and CompositionAsset declares no
    // `serializers` getter at all.
    context('when the target class has no `serializers` getter', () => {
      it('throws MissingSerializersDefinition', () => {
        expect(() => Composition.query().preloadFor('default')).toThrow(MissingSerializersDefinition)
        expect(() => Composition.query().preloadFor('default')).toThrow(
          /Missing serializers definition on class `CompositionAsset`/
        )
      })

      // This is the sub-case that succeeded end-to-end before 2.23.0: rendersMany resolves the
      // associated serializer once per element, so an empty association never reaches the missing
      // `serializers` getter at render time. Such code preloaded *and* rendered, and now throws.
      it('throws even when the association is empty, so rendering it succeeds', async () => {
        const user = await User.create({ email: 'no-serializers@preload.test', password: 'howyadoin' })
        const composition = await Composition.create({ user })
        composition.compositionAssets = []
        composition.passthroughCurrentLocalizedText = null as unknown as LocalizedText

        const serializer = inferSerializerFromDreamOrViewModel(composition, 'default')
        expect(serializer(composition as never).render()).toEqual({
          id: composition.id,
          metadata: {},
          compositionAssets: [],
          passthroughCurrentLocalizedText: null,
        })

        expect(() => Composition.query().preloadFor('default')).toThrow(MissingSerializersDefinition)
      })
    })

    // The remaining three resolution errors were never swallowed — the catch only tolerated
    // MissingSerializersDefinition — but nothing pinned that they reach the caller. These do.
    context('when the target registers a `serializers` getter that omits the key', () => {
      it('throws MissingSerializersDefinitionForKey', () => {
        withTargetSerializers({}, () => {
          expect(() => Composition.query().preloadFor('default')).toThrow(MissingSerializersDefinitionForKey)
          expect(() => Composition.query().preloadFor('default')).toThrow(
            /Missing serializers definition for `default` on class `CompositionAsset`/
          )
        })
      })
    })

    context('when the target names a global serializer that is not registered', () => {
      it('throws NoGlobalSerializerForSpecifiedKey', () => {
        withTargetSerializers({ default: 'NotARegisteredSerializer' }, () => {
          expect(() => Composition.query().preloadFor('default')).toThrow(NoGlobalSerializerForSpecifiedKey)
          expect(() => Composition.query().preloadFor('default')).toThrow(
            /CompositionAsset specified a global name of "NotARegisteredSerializer" for serializer key "default",\s+but no serializer corresponds to "NotARegisteredSerializer"/
          )
        })
      })
    })

    context('when the target names a global name registered to something that is not a serializer', () => {
      it('throws NonDreamSerializerDerivedFromGlobalSerializerForSpecifiedKey', () => {
        const registry = DreamApp.getOrFail().serializers
        registry['NotASerializerAtAll'] = (() => 'definitely not a serializer builder') as never

        try {
          withTargetSerializers({ default: 'NotASerializerAtAll' }, () => {
            expect(() => Composition.query().preloadFor('default')).toThrow(
              NonDreamSerializerDerivedFromGlobalSerializerForSpecifiedKey
            )
            expect(() => Composition.query().preloadFor('default')).toThrow(
              /the derived serializer is not a Dream serializer/
            )
          })
        } finally {
          Reflect.deleteProperty(registry, 'NotASerializerAtAll')
        }
      })
    })
  })
})

/**
 * CompositionAsset has no `serializers` getter to spy on, so one is defined on its prototype for
 * the duration of `cb` and removed afterward. Safe to leave no cache behind: every call under it
 * throws, and neither `Query`'s preload-path cache nor the resolved-edges memo caches a throw.
 */
function withTargetSerializers(serializers: Record<string, string>, cb: () => void) {
  Object.defineProperty(CompositionAsset.prototype, 'serializers', {
    configurable: true,
    get: () => serializers,
  })

  try {
    cb()
  } finally {
    Reflect.deleteProperty(CompositionAsset.prototype, 'serializers')
  }
}
