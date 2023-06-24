import { DateTime } from 'luxon'
import User from '../../../test-app/app/models/User'
import range from '../../../src/helpers/range'
import ops from '../../../src/ops'
import Mylar from '../../../test-app/app/models/Balloon/Mylar'
import Balloon from '../../../test-app/app/models/Balloon'
import Rating from '../../../test-app/app/models/Rating'
import Post from '../../../test-app/app/models/Post'

describe('Query#where', () => {
  context('a generic expression is passed', () => {
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

      const records = await User.where({ id: ops.expression('in', [user1.id, user2.id]) }).pluck('id')
      expect(records).toEqual([user1.id, user2.id])
    })
  })

  context('ops.in is passed', () => {
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

      const records = await User.where({ id: ops.in([user1.id, user2.id]) }).pluck('id')
      expect(records).toEqual([user1.id, user2.id])
    })
  })

  context('ops.lessThan is passed', () => {
    it('uses a "<" operator for comparison', async () => {
      const user = await User.create({ email: 'fred@fishman', password: 'howyadoin' })
      const post = await Post.create({ user })
      const rating5 = await Rating.create({ user, rateable: post, rating: 5 })
      const rating3 = await Rating.create({ user, rateable: post, rating: 3 })

      const records = await Rating.where({ rating: ops.lessThan(4) }).pluck('id')
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

      const records = await Rating.where({ rating: ops.lessThanOrEqualTo(4) }).pluck('id')
      expect(records).toEqual([rating4.id, rating3.id])
    })
  })

  context('ops.greaterThan is passed', () => {
    it('uses a ">" operator for comparison', async () => {
      const user = await User.create({ email: 'fred@fishman', password: 'howyadoin' })
      const post = await Post.create({ user })
      const rating5 = await Rating.create({ user, rateable: post, rating: 5 })
      const rating3 = await Rating.create({ user, rateable: post, rating: 3 })

      const records = await Rating.where({ rating: ops.greaterThan(4) }).pluck('id')
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

      const records = await Rating.where({ rating: ops.greaterThanOrEqualTo(4) }).pluck('id')
      expect(records).toEqual([rating5.id, rating4.id])
    })
  })

  context('ops.any is passed', () => {
    it('uses an "@>" operator for comparison', async () => {
      const user = await User.create({ email: 'fred@fred', password: 'howyadoin' })
      const multicolorBalloon = await Mylar.create({
        user,
        multicolor: ['red', 'green'],
      })

      const greenBalloon = await Mylar.create({
        user,
        multicolor: ['green'],
      })

      const blueBalloon = await Mylar.create({
        user,
        multicolor: ['blue'],
      })

      const balloons = await Balloon.where({ multicolor: ops.any('green') }).all()
      expect(balloons).toMatchDreamModels([multicolorBalloon, greenBalloon])
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
      await User.create({
        email: 'frez@fishman',
        password: 'howyadoin',
      })

      const records = await User.where({ id: [user1.id, user2.id] }).pluck('id')
      expect(records).toEqual([user1.id, user2.id])
    })
  })

  context('ops.like statement is passed', () => {
    it('uses an "in" operator for comparison', async () => {
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

      const records = await User.where({ email: ops.like('%aaa@%') }).pluck('id')
      expect(records).toEqual([user1.id])
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

      const records = await User.where({ email: ops.ilike('%aaa@%') }).pluck('id')
      expect(records).toEqual([user1.id, user2.id])
    })
  })

  context('a date range is passed', () => {
    const begin = DateTime.now()
    const end = DateTime.now().plus({ day: 1 })

    let user0: User
    let user1: User
    let user2: User
    let user3: User
    let user4: User
    beforeEach(async () => {
      user0 = await User.create({
        email: 'fred@frewd',
        password: 'howyadoin',
        created_at: begin.minus({ hour: 1 }),
      })
      user1 = await User.create({
        email: 'fred@frezd',
        password: 'howyadoin',
        created_at: begin,
      })
      user2 = await User.create({
        email: 'fred@frwwd',
        password: 'howyadoin',
        created_at: begin.plus({ hour: 1 }),
      })
      user3 = await User.create({
        email: 'fred@frewdzsd',
        password: 'howyadoin',
        created_at: end,
      })
      user4 = await User.create({
        email: 'fred@frwewdzsd',
        password: 'howyadoin',
        created_at: end.plus({ hour: 1 }),
      })
    })

    it('is able to apply date ranges to where clause', async () => {
      const records = await User.order('id')
        .where({ created_at: range(begin, end) })
        .all()

      expect(records.length).toEqual(3)
      expect(records.map(r => r.id)).toEqual([user1.id, user2.id, user3.id])
    })

    context('end is not passed', () => {
      it('finds all dates after the start', async () => {
        const records = await User.order('id')
          .where({ created_at: range(begin.plus({ hour: 1 })) })
          .all()

        expect(records.length).toEqual(3)
        expect(records.map(r => r.id)).toEqual([user2.id, user3.id, user4.id])
      })
    })

    context('start is not passed', () => {
      it('finds all dates before the end', async () => {
        const records = await User.order('id')
          .where({ created_at: range(null, begin.plus({ hour: 1 })) })
          .all()

        expect(records.length).toEqual(3)
        expect(records.map(r => r.id)).toEqual([user0.id, user1.id, user2.id])
      })
    })

    context('excludeEnd is passed', () => {
      it('omits a record landing exactly on the end date', async () => {
        const records = await User.order('id')
          .where({ created_at: range(begin, end, true) })
          .all()

        expect(records.length).toEqual(2)
        expect(records.map(r => r.id)).toEqual([user1.id, user2.id])
      })
    })
  })

  context('a function returning a date range is passed', () => {
    const begin = DateTime.now()
    const end = DateTime.now().plus({ day: 1 })

    let user1: User
    let user2: User
    let user3: User

    beforeEach(async () => {
      user1 = await User.create({
        email: 'fred@frewd',
        password: 'howyadoin',
        created_at: begin.minus({ hour: 1 }),
      })
      user2 = await User.create({
        email: 'fred@frwwd',
        password: 'howyadoin',
        created_at: begin.plus({ hour: 1 }),
      })
      user3 = await User.create({
        email: 'fred@frwewdzsd',
        password: 'howyadoin',
        created_at: end.plus({ hour: 1 }),
      })
    })

    it('is able to apply date ranges to where clause', async () => {
      const users = await User.order('id')
        .where({ created_at: () => range(begin, end) })
        .all()

      expect(users).toMatchDreamModels([user2])
    })
  })

  context('a number range is passed', () => {
    const begin = 3
    const end = 7
    let user: User
    let post: Post
    let ratingBefore: Rating
    let ratingBeginning: Rating
    let ratingWithin: Rating
    let ratingEnd: Rating
    let ratingAfter: Rating

    beforeEach(async () => {
      user = await User.create({
        email: 'fred@frewd',
        password: 'howyadoin',
      })

      post = await Post.create({ user })
      ratingBefore = await Rating.create({ user, rateable: post, rating: 2 })
      ratingBeginning = await Rating.create({ user, rateable: post, rating: 3 })
      ratingWithin = await Rating.create({ user, rateable: post, rating: 5 })
      ratingEnd = await Rating.create({ user, rateable: post, rating: 7 })
      ratingAfter = await Rating.create({ user, rateable: post, rating: 9 })
    })

    it('is able to apply number ranges to where clause', async () => {
      const records = await Rating.where({ rating: range(begin, end) }).all()
      expect(records).toMatchDreamModels([ratingBeginning, ratingWithin, ratingEnd])
    })

    context('end is not passed', () => {
      it('matches all numbers greater than or equal to the start', async () => {
        const records = await Rating.where({ rating: range(begin) }).all()
        expect(records).toMatchDreamModels([ratingBeginning, ratingWithin, ratingEnd, ratingAfter])
      })
    })

    context('start is not passed', () => {
      it('matches all numbers less than or equal to the end', async () => {
        const records = await Rating.where({ rating: range(null, end) }).all()
        expect(records).toMatchDreamModels([ratingBefore, ratingBeginning, ratingWithin, ratingEnd])
      })
    })

    context('excludeEnd is passed', () => {
      it('omits numbers matching the end', async () => {
        const records = await Rating.where({ rating: range(null, end, true) }).all()
        expect(records).toMatchDreamModels([ratingBefore, ratingBeginning, ratingWithin])
      })
    })
  })
})
