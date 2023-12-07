import User from '../../../test-app/app/models/User'
import Post from '../../../test-app/app/models/Post'
import Rating from '../../../test-app/app/models/Rating'
import ops from '../../../src/ops'

describe('Query#count', () => {
  it('counts query results', async () => {
    const user1 = await User.create({ email: 'fred@frewd', password: 'howyadoin', name: 'fred' })
    const user2 = await User.create({ email: 'how@yadoin', password: 'howyadoin', name: 'fred' })
    const user3 = await User.create({ email: 'how@fishman', password: 'howyadoin', name: 'zed' })

    const count = await User.where({ name: 'fred' }).count()
    expect(count).toEqual(2)
  })

  context('with a similarity operator passed', () => {
    it('respects the similarity operator', async () => {
      const user1 = await User.create({ email: 'fred@frewd', password: 'howyadoin', name: 'fred' })
      const user2 = await User.create({ email: 'how@yadoin', password: 'howyadoin', name: 'fred h' })
      const user3 = await User.create({ email: 'how@fishman', password: 'howyadoin', name: 'tim' })

      const count = await User.where({ name: ops.similarity('fred') }).count()
      expect(count).toEqual(2)
    })
  })

  context('within a polymorphic association query', () => {
    it('counts query results', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin', name: 'fred' })

      const post1 = await Post.create({ user })
      const post2 = await Post.create({ user })

      const rating1 = await Rating.create({ user, rateable: post1, rating: 3 })
      const rating2 = await Rating.create({ user, rateable: post1, rating: 4 })
      const rating3 = await Rating.create({ user, rateable: post2, rating: 5 })
      const rating4 = await Rating.create({ user, rateable: post1, rating: 2 })

      const count = await post1.associationQuery('ratings').count()

      expect(count).toEqual(3)
    })
  })
})
