import CannotNegateSimilarityClause from '../../../src/errors/CannotNegateSimilarityClause.js'
import CannotPassUndefinedAsAValueToAWhereClause from '../../../src/errors/CannotPassUndefinedAsAValueToAWhereClause.js'
import ops from '../../../src/ops.js'
import Balloon from '../../../test-app/app/models/Balloon.js'
import Latex from '../../../test-app/app/models/Balloon/Latex.js'
import Mylar from '../../../test-app/app/models/Balloon/Mylar.js'
import Post from '../../../test-app/app/models/Post.js'
import Rating from '../../../test-app/app/models/Rating.js'
import User from '../../../test-app/app/models/User.js'

describe('Query#whereNot', () => {
  it('negates the logic of all the clauses ANDed together', async () => {
    await Latex.create({ color: 'red' })
    const redMylarBalloon = await Mylar.create({ color: 'red' })
    const greenLatexBalloon = await Latex.create({ color: 'green' })

    const balloons = await Balloon.whereNot({ color: 'red', type: 'Latex' }).all()
    expect(balloons).toMatchDreamModels([redMylarBalloon, greenLatexBalloon])
  })

  context('passing undefined as a value for a field', () => {
    it('raises an exception', async () => {
      await expect(async () => await User.query().whereNot({ email: undefined }).all()).rejects.toThrowError(
        CannotPassUndefinedAsAValueToAWhereClause
      )
    })
  })

  context('passing null', () => {
    it('clears existing whereNots', async () => {
      const redBalloon = await Latex.create({ color: 'red' })
      const greenBalloon = await Latex.create({ color: 'green' })

      const balloons = await Balloon.whereNot({ color: 'red' }).whereNot(null).all()
      expect(balloons).toMatchDreamModels([redBalloon, greenBalloon])
    })
  })

  context('in, not in, equals, not equals', () => {
    let redBalloon: Balloon
    let greenBalloon: Balloon
    let noColorBalloon: Balloon

    beforeEach(async () => {
      redBalloon = await Latex.create({ color: 'red' })
      greenBalloon = await Latex.create({ color: 'green' })
      noColorBalloon = await Latex.create({ color: null })
    })

    context('a non-null value', () => {
      it('include records with fields with a value that doesn’t match specified value, including null', async () => {
        const balloons = await Balloon.whereNot({ color: 'red' }).all()
        expect(balloons).toMatchDreamModels([greenBalloon, noColorBalloon])
      })

      context('ops.equal', () => {
        it('include records with fields with a value that doesn’t match specified value, including null', async () => {
          const balloons = await Balloon.whereNot({ color: ops.equal('red') }).all()
          expect(balloons).toMatchDreamModels([greenBalloon, noColorBalloon])
        })
      })

      context('ops.not.equal', () => {
        it('matches records with the value in the specified column', async () => {
          const balloons = await Balloon.whereNot({ color: ops.not.equal('red') }).all()
          expect(balloons).toMatchDreamModels([redBalloon])
        })
      })

      context("ops.expression('=', ...)", () => {
        it('include records with fields with a value that doesn’t match specified value, including null', async () => {
          const balloons = await Balloon.whereNot({ color: ops.expression('=', 'red') }).all()
          expect(balloons).toMatchDreamModels([greenBalloon, noColorBalloon])
        })
      })

      context("ops.expression('!=', ...)", () => {
        it('matches records with the value in the specified column', async () => {
          const balloons = await Balloon.whereNot({ color: ops.expression('!=', 'red') }).all()
          expect(balloons).toMatchDreamModels([redBalloon])
        })
      })
    })

    context('a non-null value array', () => {
      it('include records with fields with a value that doesn’t match specified value, including null', async () => {
        const balloons = await Balloon.whereNot({ color: ['red'] }).all()
        expect(balloons).toMatchDreamModels([greenBalloon, noColorBalloon])
      })

      context('ops.in', () => {
        it('include records with fields with a value that doesn’t match specified value, including null', async () => {
          const balloons = await Balloon.whereNot({ color: ops.in(['red']) }).all()
          expect(balloons).toMatchDreamModels([greenBalloon, noColorBalloon])
        })
      })

      context('ops.not.in', () => {
        it('matches records with any array value in the specified column', async () => {
          const balloons = await Balloon.whereNot({ color: ops.not.in(['red']) }).all()
          expect(balloons).toMatchDreamModels([redBalloon])
        })
      })

      context("ops.expression('in', ...)", () => {
        it('include records with fields with a value that doesn’t match specified value, including null', async () => {
          const balloons = await Balloon.whereNot({ color: ops.expression('in', ['red']) }).all()
          expect(balloons).toMatchDreamModels([greenBalloon, noColorBalloon])
        })
      })

      context("ops.expression('not in', ...)", () => {
        it('matches records with any array value in the specified column', async () => {
          const balloons = await Balloon.whereNot({ color: ops.expression('not in', ['red']) }).all()
          expect(balloons).toMatchDreamModels([redBalloon])
        })
      })
    })

    context('an empty array', () => {
      it('returns results as if the where in empty array clause were not present', async () => {
        const balloons = await Balloon.whereNot({ color: [] }).all()
        expect(balloons).toMatchDreamModels([redBalloon, greenBalloon, noColorBalloon])
      })

      context('ops.in', () => {
        it('returns results as if the where in empty array clause were not present', async () => {
          const balloons = await Balloon.whereNot({ color: ops.in([]) }).all()
          expect(balloons).toMatchDreamModels([redBalloon, greenBalloon, noColorBalloon])
        })
      })

      context('ops.not.in ', () => {
        it('returns no results', async () => {
          const balloons = await Balloon.whereNot({ color: ops.not.in([]) }).all()
          expect(balloons).toMatchDreamModels([])
        })
      })

      context("ops.expression('in', ...)", () => {
        it('returns results as if the where in empty array clause were not present', async () => {
          const balloons = await Balloon.whereNot({ color: ops.expression('in', []) }).all()
          expect(balloons).toMatchDreamModels([redBalloon, greenBalloon, noColorBalloon])
        })
      })

      context("ops.expression('not in', ...)", () => {
        it('returns no results', async () => {
          const balloons = await Balloon.whereNot({ color: ops.expression('not in', []) }).all()
          expect(balloons).toMatchDreamModels([])
        })
      })
    })

    context('an array with null', () => {
      it('include records with non-null in that field', async () => {
        const balloons = await Balloon.whereNot({ color: [null as any] }).all()
        expect(balloons).toMatchDreamModels([redBalloon, greenBalloon])
      })

      context('ops.in', () => {
        it('include records with non-null in that field', async () => {
          const balloons = await Balloon.whereNot({ color: ops.in([null]) }).all()
          expect(balloons).toMatchDreamModels([redBalloon, greenBalloon])
        })
      })

      context('ops.not.in', () => {
        it('matches records with null in the specified column', async () => {
          const balloons = await Balloon.whereNot({ color: ops.not.in([null]) }).all()
          expect(balloons).toMatchDreamModels([noColorBalloon])
        })
      })

      context("ops.expression('in', ...)", () => {
        it('include records with non-null in that field', async () => {
          const balloons = await Balloon.whereNot({ color: ops.expression('in', [null]) }).all()
          expect(balloons).toMatchDreamModels([redBalloon, greenBalloon])
        })
      })

      context('ops.not.in', () => {
        it('matches records with null in the specified column', async () => {
          const balloons = await Balloon.whereNot({ color: ops.expression('not in', [null]) }).all()
          expect(balloons).toMatchDreamModels([noColorBalloon])
        })
      })
    })

    context('an array with null and a non-null value', () => {
      it('matches records with null or the non-null value in the specified column', async () => {
        const balloons = await Balloon.whereNot({ color: [null as any, 'red'] }).all()
        expect(balloons).toMatchDreamModels([greenBalloon])
      })

      context('ops.in', () => {
        it('matches records with null or the non-null value in the specified column', async () => {
          const balloons = await Balloon.whereNot({ color: ops.in([null, 'red']) }).all()
          expect(balloons).toMatchDreamModels([greenBalloon])
        })
      })

      context('ops.not.in', () => {
        it('include records with non-null in that field that don’t match the non-null value', async () => {
          const balloons = await Balloon.whereNot({ color: ops.not.in([null, 'red']) }).all()
          expect(balloons).toMatchDreamModels([noColorBalloon, redBalloon])
        })
      })

      context("ops.expression('in', ...)", () => {
        it('matches records with null or the non-null value in the specified column', async () => {
          const balloons = await Balloon.whereNot({ color: ops.expression('in', [null, 'red']) }).all()
          expect(balloons).toMatchDreamModels([greenBalloon])
        })
      })

      context('ops.not.in', () => {
        it('include records with non-null in that field that don’t match the non-null value', async () => {
          const balloons = await Balloon.whereNot({ color: ops.expression('not in', [null, 'red']) }).all()
          expect(balloons).toMatchDreamModels([noColorBalloon, redBalloon])
        })
      })
    })

    context('a null value', () => {
      it('matches records with null in the specified column', async () => {
        const balloons = await Balloon.whereNot({ color: null }).all()
        expect(balloons).toMatchDreamModels([redBalloon, greenBalloon])
      })

      context('ops.equal', () => {
        it('matches records with null in the specified column', async () => {
          const balloons = await Balloon.whereNot({ color: ops.equal(null) }).all()
          expect(balloons).toMatchDreamModels([redBalloon, greenBalloon])
        })
      })

      context('ops.not.equal', () => {
        it('include records with non-null in that field', async () => {
          const balloons = await Balloon.whereNot({ color: ops.not.equal(null) }).all()
          expect(balloons).toMatchDreamModels([noColorBalloon])
        })
      })

      context("ops.expression('=', ...)", () => {
        it('matches records with null in the specified column', async () => {
          const balloons = await Balloon.whereNot({ color: ops.expression('=', null) }).all()
          expect(balloons).toMatchDreamModels([redBalloon, greenBalloon])
        })
      })

      context("ops.expression('!=', ...)", () => {
        it('include records with non-null in that field', async () => {
          const balloons = await Balloon.whereNot({ color: ops.expression('!=', null) }).all()
          expect(balloons).toMatchDreamModels([noColorBalloon])
        })
      })
    })
  })

  context('ops.lessThan', () => {
    it('uses a "<" operator for comparison', async () => {
      const user = await User.create({ email: 'fred@fishman', password: 'howyadoin' })
      const post = await Post.create({ user })
      await Rating.create({ user, rateable: post, rating: 5 })
      const rating3 = await Rating.create({ user, rateable: post, rating: 3 })

      const records = await Rating.query()
        .whereNot({ rating: ops.not.lessThan(4) })
        .pluck('id')
      expect(records).toEqual([rating3.id])
    })
  })

  context('ops.lessThanOrEqualTo', () => {
    it('uses a "<=" operator for comparison', async () => {
      const user = await User.create({ email: 'fred@fishman', password: 'howyadoin' })
      const post = await Post.create({ user })
      await Rating.create({ user, rateable: post, rating: 5 })
      const rating4 = await Rating.create({ user, rateable: post, rating: 4 })
      const rating3 = await Rating.create({ user, rateable: post, rating: 3 })

      const records = await Rating.query()
        .whereNot({ rating: ops.greaterThan(4) })
        .pluck('id')
      expect(records).toEqual([rating4.id, rating3.id])
    })
  })

  context('ops.greaterThan', () => {
    it('uses a ">" operator for comparison', async () => {
      const user = await User.create({ email: 'fred@fishman', password: 'howyadoin' })
      const post = await Post.create({ user })
      const rating5 = await Rating.create({ user, rateable: post, rating: 5 })
      await Rating.create({ user, rateable: post, rating: 3 })

      const records = await Rating.query()
        .whereNot({ rating: ops.lessThanOrEqualTo(4) })
        .pluck('id')
      expect(records).toEqual([rating5.id])
    })
  })

  context('ops.greaterThanOrEqualTo', () => {
    it('uses a ">=" operator for comparison', async () => {
      const user = await User.create({ email: 'fred@fishman', password: 'howyadoin' })
      const post = await Post.create({ user })
      const rating5 = await Rating.create({ user, rateable: post, rating: 5 })
      const rating4 = await Rating.create({ user, rateable: post, rating: 4 })
      await Rating.create({ user, rateable: post, rating: 3 })

      const records = await Rating.query()
        .whereNot({ rating: ops.lessThan(4) })
        .pluck('id')
      expect(records).toEqual([rating5.id, rating4.id])
    })
  })

  context('an array', () => {
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

      const records = await User.query()
        .whereNot({ id: [user1.id, user2.id] })
        .pluck('id')
      expect(records).toEqual([user3.id])
    })
  })

  context('ops.like statement', () => {
    it('uses a "like" operator for comparison', async () => {
      const user1 = await User.create({
        email: 'aaa@aaa',
        password: 'howyadoin',
      })
      await User.create({
        email: 'Aaa@zzz',
        password: 'howyadoin',
      })
      await User.create({
        email: 'zzz@zzz',
        password: 'howyadoin',
      })

      const records = await User.query()
        .whereNot({ email: ops.not.like('%aaa@%') })
        .pluck('id')
      expect(records).toEqual([user1.id])
    })
  })

  context('ops.not.like statement', () => {
    it('uses a "not like" operator for comparison', async () => {
      await User.create({
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

      const records = await User.query()
        .whereNot({ email: ops.like('%aaa@%') })
        .pluck('id')
      expect(records).toEqual([user2.id, user3.id])
    })
  })

  context('ops.ilike statement', () => {
    it('uses an "ilike" operator for comparison', async () => {
      const user1 = await User.create({
        email: 'aaa@aaa',
        password: 'howyadoin',
      })
      const user2 = await User.create({
        email: 'Aaa@zzz',
        password: 'howyadoin',
      })
      await User.create({
        email: 'zzz@zzz',
        password: 'howyadoin',
      })

      const records = await User.query()
        .whereNot({ email: ops.not.ilike('%aaa@%') })
        .pluck('id')
      expect(records).toEqual([user1.id, user2.id])
    })
  })

  context('ops.not.ilike statement', () => {
    it('uses a "not ilike" operator for comparison', async () => {
      await User.create({
        email: 'aaa@aaa',
        password: 'howyadoin',
      })
      await User.create({
        email: 'Aaa@zzz',
        password: 'howyadoin',
      })
      const user3 = await User.create({
        email: 'zzz@zzz',
        password: 'howyadoin',
      })

      const records = await User.query()
        .whereNot({ email: ops.ilike('%aaa@%') })
        .pluck('id')
      expect(records).toEqual([user3.id])
    })
  })

  // BEGIN: trigram search
  context('ops.similarity statement', () => {
    it('raises a targeted exception', async () => {
      await expect(async () => {
        await User.whereNot({ name: ops.similarity('world') }).all()
      }).rejects.toThrow(CannotNegateSimilarityClause)
    })
  })

  context('ops.wordSimilarity statement', () => {
    it('raises a targeted exception', async () => {
      await expect(async () => {
        await User.whereNot({ name: ops.wordSimilarity('world') }).all()
      }).rejects.toThrow(CannotNegateSimilarityClause)
    })
  })

  context('ops.strictWordSimilarity statement', () => {
    it('raises a targeted exception', async () => {
      await expect(async () => {
        await User.whereNot({ name: ops.strictWordSimilarity('world') }).all()
      }).rejects.toThrow(CannotNegateSimilarityClause)
    })
  })
  // END: trigram search

  context('ops.match statement', () => {
    it('uses a "~" operator for comparison', async () => {
      const user1 = await User.create({
        email: 'aaa@aaa',
        password: 'howyadoin',
      })
      await User.create({
        email: 'Aaa@zzz',
        password: 'howyadoin',
      })
      await User.create({
        email: 'zzz@zzz',
        password: 'howyadoin',
      })

      const records = await User.query()
        .whereNot({ email: ops.not.match('aaa.*') })
        .pluck('id')
      expect(records).toEqual([user1.id])
    })

    context('case insensitive option', () => {
      it('uses a "~*" operator for comparison', async () => {
        const user1 = await User.create({
          email: 'aaa@aaa',
          password: 'howyadoin',
        })
        const user2 = await User.create({
          email: 'Aaa@zzz',
          password: 'howyadoin',
        })
        await User.create({
          email: 'zzz@zzz',
          password: 'howyadoin',
        })

        const records = await User.query()
          .whereNot({ email: ops.not.match('aaa.*', { caseInsensitive: true }) })
          .pluck('id')
        expect(records).toEqual([user1.id, user2.id])
      })
    })
  })

  context('ops.not.match statement', () => {
    it('uses a "!~" operator for comparison', async () => {
      await User.create({
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

      const records = await User.query()
        .whereNot({ email: ops.match('aaa.*') })
        .pluck('id')
      expect(records).toEqual([user2.id, user3.id])
    })

    context('case insensitive option passed', () => {
      it('uses a "!~*" operator for comparison', async () => {
        await User.create({
          email: 'aaa@aaa',
          password: 'howyadoin',
        })
        await User.create({
          email: 'Aaa@zzz',
          password: 'howyadoin',
        })
        const user3 = await User.create({
          email: 'zzz@zzz',
          password: 'howyadoin',
        })

        const records = await User.query()
          .whereNot({
            email: ops.match('aaa.*', { caseInsensitive: true }),
          })
          .pluck('id')
        expect(records).toEqual([user3.id])
      })
    })
  })
})
