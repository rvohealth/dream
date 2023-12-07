import Query from '../../../src/dream/query'
import { DateTime } from 'luxon'
import User from '../../../test-app/app/models/User'
import range from '../../../src/helpers/range'
import ops from '../../../src/ops'
import Mylar from '../../../test-app/app/models/Balloon/Mylar'
import Balloon from '../../../test-app/app/models/Balloon'
import Rating from '../../../test-app/app/models/Rating'
import Post from '../../../test-app/app/models/Post'
import AnyRequiresArrayColumn from '../../../src/exceptions/ops/any-requires-array-column'
import Composition from '../../../test-app/app/models/Composition'
import ScoreMustBeANormalNumber from '../../../src/exceptions/ops/score-must-be-a-normal-number'

describe('Query#where', () => {
  it('supports multiple clauses', async () => {
    const user1 = await User.create({
      name: 'Hello',
      email: 'fred@frewd',
      password: 'howyadoin',
    })
    await User.create({
      name: 'World',
      email: 'frez@frewd',
      password: 'howyadoin',
    })

    const users = await User.where({ email: 'fred@frewd', name: 'Hello' }).all()
    expect(users).toMatchDreamModels([user1])
  })

  it('supports chaining `where` clauses', async () => {
    const user1 = await User.create({
      name: 'Hello',
      email: 'fred@frewd',
      password: 'howyadoin',
    })
    await User.create({
      name: 'World',
      email: 'frez@frewd',
      password: 'howyadoin',
    })

    const users = await User.where({ email: 'fred@frewd' }).where({ name: 'Hello' }).all()
    expect(users).toMatchDreamModels([user1])
  })

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

      const records = await new Query(User)
        .where({ id: ops.expression('in', [user1.id, user2.id]) })
        .pluck('id')
      expect(records).toEqual([user1.id, user2.id])
    })
  })

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
      const records = await new Query(User).where({ id: ops.in([user1.id, user2.id]) }).pluck('id')
      expect(records).toEqual([user1.id, user2.id])
    })

    context('with a blank array', () => {
      it('does not find any results', async () => {
        const records = await new Query(User).where({ id: ops.in([]) }).pluck('id')
        expect(records).toEqual([])
      })

      context('with a negated blank array', () => {
        it('finds all results', async () => {
          const records = await new Query(User).where({ id: ops.not.in([]) }).pluck('id')
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

      const records = await new Query(User).where({ id: ops.not.in([user1.id, user2.id]) }).pluck('id')
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

      const records = await new Query(User).where({ id: ops.equal(user2.id) }).pluck('id')
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

      const records = await new Query(User).where({ id: ops.not.equal(user1.id) }).pluck('id')
      expect(records).toEqual([user2.id, user3.id])
    })
  })

  context('ops.lessThan is passed', () => {
    it('uses a "<" operator for comparison', async () => {
      const user = await User.create({ email: 'fred@fishman', password: 'howyadoin' })
      const post = await Post.create({ user })
      const rating5 = await Rating.create({ user, rateable: post, rating: 5 })
      const rating3 = await Rating.create({ user, rateable: post, rating: 3 })

      const records = await new Query(Rating).where({ rating: ops.lessThan(4) }).pluck('id')
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

      const records = await new Query(Rating).where({ rating: ops.lessThanOrEqualTo(4) }).pluck('id')
      expect(records).toEqual([rating4.id, rating3.id])
    })
  })

  context('ops.greaterThan is passed', () => {
    it('uses a ">" operator for comparison', async () => {
      const user = await User.create({ email: 'fred@fishman', password: 'howyadoin' })
      const post = await Post.create({ user })
      const rating5 = await Rating.create({ user, rateable: post, rating: 5 })
      const rating3 = await Rating.create({ user, rateable: post, rating: 3 })

      const records = await new Query(Rating).where({ rating: ops.greaterThan(4) }).pluck('id')
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

      const records = await new Query(Rating).where({ rating: ops.greaterThanOrEqualTo(4) }).pluck('id')
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

      const balloons = await new Query(Balloon).where({ multicolor: ops.any('green') }).all()
      expect(balloons).toMatchDreamModels([multicolorBalloon, greenBalloon])
    })

    context('when passed a non-array column', () => {
      it('raises an exception', async () => {
        const user = await User.create({ email: 'fred@fred', password: 'howyadoin' })
        await expect(new Query(User).where({ email: ops.any('fred@fred') }).all()).rejects.toThrowError(
          AnyRequiresArrayColumn
        )
      })
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

      const records = await new Query(User).where({ id: [user1.id, user2.id] }).pluck('id')
      expect(records).toEqual([user1.id, user2.id])
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

      const records = await new Query(User).where({ email: ops.like('%aaa@%') }).pluck('id')
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

      const records = await new Query(User).where({ email: ops.not.like('%aaa@%') }).pluck('id')
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

      const records = await new Query(User).where({ email: ops.ilike('%aaa@%') }).pluck('id')
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

      const records = await new Query(User).where({ email: ops.not.ilike('%aaa@%') }).pluck('id')
      expect(records).toEqual([user3.id])
    })
  })

  // BEGIN: trigram search
  context('ops.similarity statement is passed', () => {
    let user1: User
    let user2: User
    let user3: User
    beforeEach(async () => {
      user1 = await User.create({
        email: 'pizza@a',
        password: 'howyadoin',
        name: 'world',
      })
      user2 = await User.create({
        email: 'pizza@b',
        password: 'howyadoin',
        name: 'wordle',
      })
      user3 = await User.create({
        email: 'pizza@c',
        password: 'howyadoin',
        name: 'wonderland',
      })
    })

    it('returns results matching the similarity clause', async () => {
      const records = await User.where({ name: ops.similarity('world') }).all()
      expect(records).toMatchDreamModels([user1, user2])
    })

    context('when applying a score', () => {
      context('when applying a very strict score', () => {
        it('only includes precise matches', async () => {
          const records = await User.where({ name: ops.similarity('world', { score: 0.9 }) }).all()
          expect(records).toMatchDreamModels([user1])
        })
      })

      context('when applying a very leniant score', () => {
        it('only includes leniant matches', async () => {
          const records = await User.where({ name: ops.similarity('world', { score: 0.1 }) }).all()
          expect(records).toMatchDreamModels([user1, user2, user3])
        })
      })

      context('when applying a score that is less than 0', () => {
        it('raises a targeted exception', async () => {
          await expect(async () => {
            await User.where({ name: ops.similarity('world', { score: -0.001 }) }).all()
          }).rejects.toThrowError(ScoreMustBeANormalNumber)
        })
      })

      context('when applying a score that is greater than 1', () => {
        it('raises a targeted exception', async () => {
          await expect(async () => {
            await User.where({ name: ops.similarity('world', { score: 1.000001 }) }).all()
          }).rejects.toThrowError(ScoreMustBeANormalNumber)
        })
      })
    })

    context('when used on multiple indexed fields', () => {
      it('averages the score found by both', async () => {
        const records = await User.where({
          name: ops.similarity('world'),
          email: ops.similarity('pizza'),
        }).all()
        expect(records).toMatchDreamModels([user1, user2])
      })

      context('one of the search terms is grossly mismatched', () => {
        it('does not include results for that search term', async () => {
          const records = await User.where({
            name: ops.similarity('world'),
            email: ops.similarity('nonmatch'),
          }).all()
          expect(records).toEqual([])
        })
      })
    })

    context('when used on a field that has not been indexed', () => {
      it('still allows for trigram search (though it will be less efficient without GIN indexes)', async () => {
        const composition = await Composition.create({ content: 'world', user: user1 })
        await Composition.create({ content: 'nonmatch', user: user1 })

        const records = await Composition.where({
          content: ops.similarity('world'),
        }).all()

        expect(records).toMatchDreamModels([composition])
      })
    })
  })

  context('ops.wordSimilarity statement is passed', () => {
    let user1: User
    let user2: User
    let user3: User
    beforeEach(async () => {
      user1 = await User.create({
        email: 'hello@world',
        password: 'howyadoin',
        name: 'world',
      })
      user2 = await User.create({
        email: 'hello@wordl',
        password: 'howyadoin',
        name: 'wordle',
      })
      user3 = await User.create({
        email: 'hello@wonderland',
        password: 'howyadoin',
        name: 'wonderland',
      })
    })

    it('returns results matching the wordSimilarity clause', async () => {
      const records = await new Query(User).where({ name: ops.wordSimilarity('world') }).all()
      expect(records).toMatchDreamModels([user1])
    })

    context('when overriding score', () => {
      it('applies score override', async () => {
        const records = await new Query(User)
          .where({ name: ops.wordSimilarity('world', { score: 0.1 }) })
          .all()
        expect(records).toMatchDreamModels([user1, user2, user3])
      })
    })
  })

  context('ops.strictWordSimilarity statement is passed', () => {
    let user1: User
    let user2: User
    let user3: User
    beforeEach(async () => {
      user1 = await User.create({
        email: 'hello@world',
        password: 'howyadoin',
        name: 'world',
      })
      user2 = await User.create({
        email: 'hello@wordl',
        password: 'howyadoin',
        name: 'wordle',
      })
      user3 = await User.create({
        email: 'hello@wonderland',
        password: 'howyadoin',
        name: 'wonderland',
      })
    })

    it('returns results matching the strictWordSimilarity clause', async () => {
      const records = await new Query(User).where({ name: ops.strictWordSimilarity('world') }).all()
      expect(records).toMatchDreamModels([user1])
    })

    context('when overriding score', () => {
      it('applies score override', async () => {
        const records = await new Query(User)
          .where({ name: ops.strictWordSimilarity('world', { score: 0.1 }) })
          .all()
        expect(records).toMatchDreamModels([user1, user2, user3])
      })
    })
  })
  // END: trigram search

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

      const records = await new Query(User).where({ email: ops.match('aaa.*') }).pluck('id')
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
          .where({ email: ops.match('aaa.*', { caseInsensitive: true }) })
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

      const records = await new Query(User).where({ email: ops.not.match('aaa.*') }).pluck('id')
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
          .where({ email: ops.not.match('aaa.*', { caseInsensitive: true }) })
          .pluck('id')
        expect(records).toEqual([user3.id])
      })
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
        createdAt: begin.minus({ hour: 1 }),
      })
      user1 = await User.create({
        email: 'fred@frezd',
        password: 'howyadoin',
        createdAt: begin,
      })
      user2 = await User.create({
        email: 'fred@frwwd',
        password: 'howyadoin',
        createdAt: begin.plus({ hour: 1 }),
      })
      user3 = await User.create({
        email: 'fred@frewdzsd',
        password: 'howyadoin',
        createdAt: end,
      })
      user4 = await User.create({
        email: 'fred@frwewdzsd',
        password: 'howyadoin',
        createdAt: end.plus({ hour: 1 }),
      })
    })

    it('is able to apply date ranges to where clause', async () => {
      const records = await User.order('id')
        .where({ createdAt: range(begin, end) })
        .all()

      expect(records.length).toEqual(3)
      expect(records.map(r => r.id)).toEqual([user1.id, user2.id, user3.id])
    })

    context('end is not passed', () => {
      it('finds all dates after the start', async () => {
        const records = await User.order('id')
          .where({ createdAt: range(begin.plus({ hour: 1 })) })
          .all()

        expect(records.length).toEqual(3)
        expect(records.map(r => r.id)).toEqual([user2.id, user3.id, user4.id])
      })
    })

    context('start is not passed', () => {
      it('finds all dates before the end', async () => {
        const records = await User.order('id')
          .where({ createdAt: range(null, begin.plus({ hour: 1 })) })
          .all()

        expect(records.length).toEqual(3)
        expect(records.map(r => r.id)).toEqual([user0.id, user1.id, user2.id])
      })
    })

    context('excludeEnd is passed', () => {
      it('omits a record landing exactly on the end date', async () => {
        const records = await User.order('id')
          .where({ createdAt: range(begin, end, true) })
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
        createdAt: begin.minus({ hour: 1 }),
      })
      user2 = await User.create({
        email: 'fred@frwwd',
        password: 'howyadoin',
        createdAt: begin.plus({ hour: 1 }),
      })
      user3 = await User.create({
        email: 'fred@frwewdzsd',
        password: 'howyadoin',
        createdAt: end.plus({ hour: 1 }),
      })
    })

    it('is able to apply date ranges to where clause', async () => {
      const users = await User.order('id')
        .where({ createdAt: () => range(begin, end) })
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
      const records = await new Query(Rating).where({ rating: range(begin, end) }).all()
      expect(records).toMatchDreamModels([ratingBeginning, ratingWithin, ratingEnd])
    })

    context('end is not passed', () => {
      it('matches all numbers greater than or equal to the start', async () => {
        const records = await new Query(Rating).where({ rating: range(begin) }).all()
        expect(records).toMatchDreamModels([ratingBeginning, ratingWithin, ratingEnd, ratingAfter])
      })
    })

    context('start is not passed', () => {
      it('matches all numbers less than or equal to the end', async () => {
        const records = await new Query(Rating).where({ rating: range(null, end) }).all()
        expect(records).toMatchDreamModels([ratingBefore, ratingBeginning, ratingWithin, ratingEnd])
      })
    })

    context('excludeEnd is passed', () => {
      it('omits numbers matching the end', async () => {
        const records = await new Query(Rating).where({ rating: range(null, end, true) }).all()
        expect(records).toMatchDreamModels([ratingBefore, ratingBeginning, ratingWithin])
      })
    })
  })
})
