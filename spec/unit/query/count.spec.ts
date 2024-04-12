import User from '../../../test-app/app/models/User'
import Post from '../../../test-app/app/models/Post'
import Rating from '../../../test-app/app/models/Rating'
import ops from '../../../src/ops'
import Composition from '../../../test-app/app/models/Composition'

describe('Query#count', () => {
  it('counts query results', async () => {
    await User.create({ email: 'fred@frewd', password: 'howyadoin', name: 'fred' })
    await User.create({ email: 'how@yadoin', password: 'howyadoin', name: 'fred' })
    await User.create({ email: 'how@fishman', password: 'howyadoin', name: 'zed' })

    const count = await User.where({ name: 'fred' }).count()
    expect(count).toEqual(2)
  })

  context('joins distinct', () => {
    it('counts distinct records', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin', name: 'fred' })
      await Composition.create({ user, content: 'Hello' })
      await Composition.create({ user, content: 'Hello' })
      await Composition.create({ user, content: 'Goodbye' })

      const count = await User.joins('compositions', { content: 'Hello' }).distinct().count()
      expect(count).toEqual(1)
    })
  })

  context('with a similarity operator passed', () => {
    it('respects the similarity operator', async () => {
      await User.create({ email: 'fred@frewd', password: 'howyadoin', name: 'fred' })
      await User.create({ email: 'how@yadoin', password: 'howyadoin', name: 'fred h' })
      await User.create({ email: 'how@fishman', password: 'howyadoin', name: 'tim' })

      const count = await User.where({ name: ops.similarity('fred') }).count()
      expect(count).toEqual(2)

      const count2 = await User.where({ name: ops.similarity('zzzz') }).count()
      expect(count2).toEqual(0)
    })
  })

  context('within a polymorphic association query', () => {
    it('counts query results', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin', name: 'fred' })

      const post1 = await Post.create({ user })
      const post2 = await Post.create({ user })

      await Rating.create({ user, rateable: post1, rating: 3 })
      await Rating.create({ user, rateable: post1, rating: 4 })
      await Rating.create({ user, rateable: post2, rating: 5 })
      await Rating.create({ user, rateable: post1, rating: 2 })

      const count = await post1.associationQuery('ratings').count()

      expect(count).toEqual(3)
    })
  })
})
