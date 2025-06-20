import { DreamClassAssociationAndStatement } from '../../../src/index.js'
import ApplicationModel from '../../../test-app/app/models/ApplicationModel.js'
import Collar from '../../../test-app/app/models/Collar.js'
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
        .loadFor('default', (dreamClass, associationName) => {
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
})
