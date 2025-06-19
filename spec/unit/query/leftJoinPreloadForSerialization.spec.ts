import { NonLoadedAssociation } from '../../../src/index.js'
import { DreamClassAssociationAndStatement } from '../../../src/types/dream.js'
import Collar from '../../../test-app/app/models/Collar.js'
import Pet from '../../../test-app/app/models/Pet.js'
import Post from '../../../test-app/app/models/Post.js'
import Rating from '../../../test-app/app/models/Rating.js'
import User from '../../../test-app/app/models/User.js'

describe('Query#leftJoinPreloadForSerialization(serializerKey)', () => {
  context('when given no serializer key', () => {
    it('preloads all associations necessary to fulfull this serialization', async () => {
      const user = await User.create({ email: 'how@yadoin', password: 'howyadoin' })
      const pet = await Pet.create({ user })
      const post = await Post.create({ body: 'hi', user })
      const rating = await Rating.create({ user, rateable: post })
      await Collar.create({ pet })

      const collar = await Collar.query().leftJoinPreloadForSerialization().firstOrFail()
      expect(collar.pet).toMatchDreamModel(pet)
      expect(collar.pet.ratings).toMatchDreamModels([rating])
    })
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
        .leftJoinPreloadForSerialization({
          modifierFn: (dreamClass, associationName) => {
            if (dreamClass.typeof(Pet) && associationName === 'ratings') {
              const modifier: DreamClassAssociationAndStatement<typeof Post, 'ratings'> = {
                and: { rating: 7 },
              }
              return modifier
            }
          },
        })
        .firstOrFail()
      expect(collar.pet).toMatchDreamModel(pet)
      expect(collar.pet.ratings).toMatchDreamModels([rating2])
    })
  })

  context("with a callback function that returns 'omit'", () => {
    it('preloads all associations necessary to fulfull this serialization', async () => {
      const user = await User.create({ email: 'how@yadoin', password: 'howyadoin' })
      const pet = await Pet.create({ user })
      await Post.create({ body: 'hi', user })
      await Collar.create({ pet })

      const collar = await Collar.query()
        .leftJoinPreloadForSerialization({
          modifierFn: (dreamClass, associationName) => {
            if (dreamClass.typeof(Pet) && associationName === 'ratings') return 'omit'
          },
        })
        .firstOrFail()
      expect(collar.pet).toMatchDreamModel(pet)
      expect(() => collar.pet.ratings).toThrow(NonLoadedAssociation)
    })
  })

  context('when given a serializer key', () => {
    it('renders the serializer key', async () => {
      const user = await User.create({ email: 'how@yadoin', password: 'howyadoin' })
      const pet = await Pet.create({ user })
      const post = await Post.create({ body: 'hi', user })
      await Rating.create({ user, rateable: post })
      await Collar.create({ pet })

      const collar = await Collar.query()
        .leftJoinPreloadForSerialization({ serializerKey: 'summary' })
        .firstOrFail()
      expect(collar.pet).toMatchDreamModel(pet)
      expect(collar.pet.loaded('ratings')).toBe(false)
    })
  })
})
