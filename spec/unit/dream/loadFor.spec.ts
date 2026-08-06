import { DreamClassAssociationAndStatement } from '../../../src/types/dream.js'
import ApplicationModel from '../../../test-app/app/models/ApplicationModel.js'
import Balloon from '../../../test-app/app/models/Balloon.js'
import Latex from '../../../test-app/app/models/Balloon/Latex.js'
import BalloonLine from '../../../test-app/app/models/BalloonLine.js'
import Collar from '../../../test-app/app/models/Collar.js'
import HeartRating from '../../../test-app/app/models/ExtraRating/HeartRating.js'
import Pet from '../../../test-app/app/models/Pet.js'
import Post from '../../../test-app/app/models/Post.js'
import Rating from '../../../test-app/app/models/Rating.js'
import User from '../../../test-app/app/models/User.js'

describe('Dream#loadFor(serializerKey)', () => {
  it('loads all associations necessary to fulfull the provided serializerKey', async () => {
    const user = await User.create({ email: 'how@yadoin', password: 'howyadoin' })
    const pet = await Pet.create({ user })
    const post = await Post.create({ body: 'hi', user })
    const rating = await Rating.create({ user, rateable: post })
    const collar = await Collar.create({ pet })

    const reloaded = await collar.loadFor('default').execute()
    expect(reloaded.pet).toMatchDreamModel(pet)
    expect(reloaded.pet.ratings).toMatchDreamModels([rating])
  })

  context('with a callback function that returns an `and` modifier', () => {
    it('loads all associations necessary to fulfull this serialization', async () => {
      const user = await User.create({ email: 'how@yadoin', password: 'howyadoin' })
      const pet = await Pet.create({ user })
      const post = await Post.create({ body: 'hi', user })
      await Rating.create({ user, rateable: post, rating: 3 })
      const rating2 = await Rating.create({ user, rateable: post, rating: 7 })
      const collar = await Collar.create({ pet })

      const reloaded = await collar
        .loadFor('default', (associationName, dreamClass) => {
          if (dreamClass.typeof(Pet) && associationName === 'ratings') {
            const modifier: DreamClassAssociationAndStatement<typeof Post, 'ratings'> = {
              and: { rating: 7 },
            }
            return modifier
          }
        })
        .execute()
      expect(reloaded.pet).toMatchDreamModel(pet)
      expect(reloaded.pet.ratings).toMatchDreamModels([rating2])
    })
  })

  context('with a transaction', () => {
    it('loads the association', async () => {
      const user = await User.create({ email: 'how@yadoin', password: 'howyadoin' })
      const pet = await Pet.create({ user })

      let reloaded: Collar

      await ApplicationModel.transaction(async txn => {
        const collar = await Collar.txn(txn).create({ pet })
        reloaded = await collar.txn(txn).loadFor('summary').execute()
      })

      expect(reloaded!.pet).toMatchDreamModel(pet)
    })
  })

  context('STI', () => {
    // Counterpart to the `stiUnion` specs in spec/unit/query/preloadFor.spec.ts. A persisted STI
    // record always hydrates to its child class (sqlResultToDreamInstance throws STIChildMissing
    // rather than instantiating the base), and Dream#query roots at `this.constructor`, so
    // instance-rooted loadFor is always rooted on an STI child and never on the STI base. The
    // union across children therefore cannot arise here — this spec pins that.
    it("loads only the hydrated STI child's serializer's associations, not the union across its siblings", async () => {
      const user = await User.create({ email: 'sti-union@loadfor.test', password: 'howyadoin' })
      const latex = await Latex.create({ user, color: 'blue' })
      const heartRating = await HeartRating.create({ user, extraRateable: latex, rating: 5 })
      await BalloonLine.create({ balloon: latex, material: 'nylon' })

      const balloon = await Balloon.query().firstOrFail()
      expect(balloon.constructor).toBe(Latex)

      const reloaded = await balloon.loadFor('stiUnion').execute()
      // rendered by Latex's `stiUnion` serializer
      expect(reloaded.heartRatings).toMatchDreamModels([heartRating])
      expect(reloaded.loaded('sandbags')).toBe(true)
      // rendered only by Animal's and Mylar's `stiUnion` serializers
      expect(reloaded.loaded('balloonLine')).toBe(false)
    })
  })
})
