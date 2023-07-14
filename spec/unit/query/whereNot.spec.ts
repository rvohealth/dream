import Query from '../../../src/dream/query'
import User from '../../../test-app/app/models/User'
import ops from '../../../src/ops'
import Rating from '../../../test-app/app/models/Rating'
import Post from '../../../test-app/app/models/Post'

describe('Query#whereNot', () => {
  it('negates a query', async () => {
    const user1 = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    const user2 = await User.create({ email: 'danny@nelso', password: 'howyadoin' })
    const user3 = await User.create({ email: 'how@yadoin', password: 'howyadoin' })

    const records = await new Query(User).whereNot({ email: 'fred@frewd' }).all()
    expect(records).toMatchDreamModels([user2, user3])
  })

  describe('inverse of negatable specs from Query#where', () => {
    context('ops.in is passed', () => {
      let user1: User
      let user2: User
      let user3: User
      beforeEach(async () => {
        user1 = await User.create({
          email: 'fred@frewd',
          password: 'howyadoin',
        })
        user2 = await User.create({
          email: 'frez@frewd',
          password: 'howyadoin',
        })
        user3 = await User.create({
          email: 'frez@fishman',
          password: 'howyadoin',
        })
      })

      it('uses an "in" operator for comparison', async () => {
        const records = await new Query(User).whereNot({ id: ops.not.in([user1.id, user2.id]) }).pluck('id')
        expect(records).toEqual([user1.id, user2.id])
      })

      context('with a blank array', () => {
        it('does not find any results', async () => {
          const records = await new Query(User).whereNot({ id: ops.not.in([]) }).pluck('id')
          expect(records).toEqual([])
        })

        context('with a negated blank array', () => {
          it('finds all results', async () => {
            const records = await new Query(User).whereNot({ id: ops.in([]) }).pluck('id')
            expect(records).toEqual([user1.id, user2.id, user3.id])
          })
        })
      })
    })

    context('ops.not.in is passed', () => {
      it('uses a "not in" operator for comparison', async () => {
        const user1 = await User.create({
          email: 'fred@frewd',
          password: 'howyadoin',
        })
        const user2 = await User.create({
          email: 'frez@frewd',
          password: 'howyadoin',
        })
        const user3 = await User.create({
          email: 'frez@fishman',
          password: 'howyadoin',
        })

        const records = await new Query(User).whereNot({ id: ops.in([user1.id, user2.id]) }).pluck('id')
        expect(records).toEqual([user3.id])
      })
    })

    context('ops.equal is passed', () => {
      it('uses an "=" operator for comparison', async () => {
        const user1 = await User.create({
          email: 'fred@frewd',
          password: 'howyadoin',
        })
        const user2 = await User.create({
          email: 'frez@frewd',
          password: 'howyadoin',
        })

        const records = await new Query(User).whereNot({ id: ops.not.equal(user2.id) }).pluck('id')
        expect(records).toEqual([user2.id])
      })
    })

    context('ops.not.equal is passed', () => {
      it('uses an "!=" operator for comparison', async () => {
        const user1 = await User.create({
          email: 'fred@frewd',
          password: 'howyadoin',
        })
        const user2 = await User.create({
          email: 'frez@frewd',
          password: 'howyadoin',
        })
        const user3 = await User.create({
          email: 'frez@fishman',
          password: 'howyadoin',
        })

        const records = await new Query(User).whereNot({ id: ops.equal(user1.id) }).pluck('id')
        expect(records).toEqual([user2.id, user3.id])
      })
    })

    context('ops.lessThan is passed', () => {
      it('uses a "<" operator for comparison', async () => {
        const user = await User.create({ email: 'fred@fishman', password: 'howyadoin' })
        const post = await Post.create({ user })
        const rating5 = await Rating.create({ user, rateable: post, rating: 5 })
        const rating3 = await Rating.create({ user, rateable: post, rating: 3 })

        const records = await new Query(Rating).whereNot({ rating: ops.not.lessThan(4) }).pluck('id')
        expect(records).toEqual([rating3.id])
      })
    })

    context('ops.lessThanOrEqualTo is passed', () => {
      it('uses a "<=" operator for comparison', async () => {
        const user = await User.create({ email: 'fred@fishman', password: 'howyadoin' })
        const post = await Post.create({ user })
        const rating5 = await Rating.create({ user, rateable: post, rating: 5 })
        const rating4 = await Rating.create({ user, rateable: post, rating: 4 })
        const rating3 = await Rating.create({ user, rateable: post, rating: 3 })

        const records = await new Query(Rating).whereNot({ rating: ops.greaterThan(4) }).pluck('id')
        expect(records).toEqual([rating4.id, rating3.id])
      })
    })

    context('ops.greaterThan is passed', () => {
      it('uses a ">" operator for comparison', async () => {
        const user = await User.create({ email: 'fred@fishman', password: 'howyadoin' })
        const post = await Post.create({ user })
        const rating5 = await Rating.create({ user, rateable: post, rating: 5 })
        const rating3 = await Rating.create({ user, rateable: post, rating: 3 })

        const records = await new Query(Rating).whereNot({ rating: ops.lessThanOrEqualTo(4) }).pluck('id')
        expect(records).toEqual([rating5.id])
      })
    })

    context('ops.greaterThanOrEqualTo is passed', () => {
      it('uses a ">=" operator for comparison', async () => {
        const user = await User.create({ email: 'fred@fishman', password: 'howyadoin' })
        const post = await Post.create({ user })
        const rating5 = await Rating.create({ user, rateable: post, rating: 5 })
        const rating4 = await Rating.create({ user, rateable: post, rating: 4 })
        const rating3 = await Rating.create({ user, rateable: post, rating: 3 })

        const records = await new Query(Rating).whereNot({ rating: ops.lessThan(4) }).pluck('id')
        expect(records).toEqual([rating5.id, rating4.id])
      })
    })

    context('an array is passed', () => {
      it('uses an "in" operator for comparison', async () => {
        const user1 = await User.create({
          email: 'fred@frewd',
          password: 'howyadoin',
        })
        const user2 = await User.create({
          email: 'frez@frewd',
          password: 'howyadoin',
        })
        const user3 = await User.create({
          email: 'frez@fishman',
          password: 'howyadoin',
        })

        const records = await new Query(User).whereNot({ id: [user1.id, user2.id] }).pluck('id')
        expect(records).toEqual([user3.id])
      })
    })

    context('ops.like statement is passed', () => {
      it('uses a "like" operator for comparison', async () => {
        const user1 = await User.create({
          email: 'aaa@aaa',
          password: 'howyadoin',
        })
        const user2 = await User.create({
          email: 'Aaa@zzz',
          password: 'howyadoin',
        })
        const user3 = await User.create({
          email: 'zzz@zzz',
          password: 'howyadoin',
        })

        const records = await new Query(User).whereNot({ email: ops.not.like('%aaa@%') }).pluck('id')
        expect(records).toEqual([user1.id])
      })
    })

    context('ops.not.like statement is passed', () => {
      it('uses a "not like" operator for comparison', async () => {
        const user1 = await User.create({
          email: 'aaa@aaa',
          password: 'howyadoin',
        })
        const user2 = await User.create({
          email: 'Aaa@zzz',
          password: 'howyadoin',
        })
        const user3 = await User.create({
          email: 'zzz@zzz',
          password: 'howyadoin',
        })

        const records = await new Query(User).whereNot({ email: ops.like('%aaa@%') }).pluck('id')
        expect(records).toEqual([user2.id, user3.id])
      })
    })

    context('ops.ilike statement is passed', () => {
      it('uses an "ilike" operator for comparison', async () => {
        const user1 = await User.create({
          email: 'aaa@aaa',
          password: 'howyadoin',
        })
        const user2 = await User.create({
          email: 'Aaa@zzz',
          password: 'howyadoin',
        })
        const user3 = await User.create({
          email: 'zzz@zzz',
          password: 'howyadoin',
        })

        const records = await new Query(User).whereNot({ email: ops.not.ilike('%aaa@%') }).pluck('id')
        expect(records).toEqual([user1.id, user2.id])
      })
    })

    context('ops.not.ilike statement is passed', () => {
      it('uses a "not ilike" operator for comparison', async () => {
        const user1 = await User.create({
          email: 'aaa@aaa',
          password: 'howyadoin',
        })
        const user2 = await User.create({
          email: 'Aaa@zzz',
          password: 'howyadoin',
        })
        const user3 = await User.create({
          email: 'zzz@zzz',
          password: 'howyadoin',
        })

        const records = await new Query(User).whereNot({ email: ops.ilike('%aaa@%') }).pluck('id')
        expect(records).toEqual([user3.id])
      })
    })

    context('ops.match statement is passed', () => {
      it('uses a "~" operator for comparison', async () => {
        const user1 = await User.create({
          email: 'aaa@aaa',
          password: 'howyadoin',
        })
        const user2 = await User.create({
          email: 'Aaa@zzz',
          password: 'howyadoin',
        })
        const user3 = await User.create({
          email: 'zzz@zzz',
          password: 'howyadoin',
        })

        const records = await new Query(User).whereNot({ email: ops.not.match('aaa.*') }).pluck('id')
        expect(records).toEqual([user1.id])
      })

      context('case insensitive option passed', () => {
        it('uses a "~*" operator for comparison', async () => {
          const user1 = await User.create({
            email: 'aaa@aaa',
            password: 'howyadoin',
          })
          const user2 = await User.create({
            email: 'Aaa@zzz',
            password: 'howyadoin',
          })
          const user3 = await User.create({
            email: 'zzz@zzz',
            password: 'howyadoin',
          })

          const records = await new Query(User)
            .whereNot({ email: ops.not.match('aaa.*', { caseInsensitive: true }) })
            .pluck('id')
          expect(records).toEqual([user1.id, user2.id])
        })
      })
    })

    context('ops.not.match statement is passed', () => {
      it('uses a "!~" operator for comparison', async () => {
        const user1 = await User.create({
          email: 'aaa@aaa',
          password: 'howyadoin',
        })
        const user2 = await User.create({
          email: 'Aaa@zzz',
          password: 'howyadoin',
        })
        const user3 = await User.create({
          email: 'zzz@zzz',
          password: 'howyadoin',
        })

        const records = await new Query(User).whereNot({ email: ops.match('aaa.*') }).pluck('id')
        expect(records).toEqual([user2.id, user3.id])
      })

      context('case insensitive option passed', () => {
        it('uses a "!~*" operator for comparison', async () => {
          const user1 = await User.create({
            email: 'aaa@aaa',
            password: 'howyadoin',
          })
          const user2 = await User.create({
            email: 'Aaa@zzz',
            password: 'howyadoin',
          })
          const user3 = await User.create({
            email: 'zzz@zzz',
            password: 'howyadoin',
          })

          const records = await new Query(User)
            .whereNot({
              email: ops.match('aaa.*', { caseInsensitive: true }),
            })
            .pluck('id')
          expect(records).toEqual([user3.id])
        })
      })
    })
  })
})
