import ops from '../../../src/ops'
import ApplicationModel from '../../../test-app/app/models/ApplicationModel'
import Composition from '../../../test-app/app/models/Composition'
import Pet from '../../../test-app/app/models/Pet'
import Post from '../../../test-app/app/models/Post'
import Rating from '../../../test-app/app/models/Rating'
import User from '../../../test-app/app/models/User'

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

      const count = await User.innerJoin('compositions', { content: 'Hello' }).distinct().count()
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

  context('on a join', () => {
    it('counts all records for a given association', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      await user.createAssociation('pets')

      await Pet.create()

      const results = await User.query().innerJoin('pets').count()
      expect(results).toEqual(1)
    })

    context('when passed a where clause', () => {
      it('respects the where clause', async () => {
        const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
        await user.createAssociation('pets', { name: 'Aster' })
        await user.createAssociation('pets', { name: 'Olive' })

        await Pet.create()

        const results = await User.query().innerJoin('pets', { name: 'Aster' }).count()
        expect(results).toEqual(1)
      })
    })

    context('when passed a transaction', () => {
      it('can report accurate count', async () => {
        const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
        await user.createAssociation('pets', { name: 'Aster' })
        await user.createAssociation('pets', { name: 'Olive' })

        let count: number = 0

        await ApplicationModel.transaction(async txn => {
          await user.txn(txn).createAssociation('pets', { name: 'Aster' })
          count = await User.query().txn(txn).innerJoin('pets', { name: 'Aster' }).count()
        })

        expect(count).toEqual(2)
      })
    })
  })
})
