import CannotNegateSimilarityClause from '../../../src/errors/CannotNegateSimilarityClause'
import CannotPassUndefinedAsAValueToAWhereClause from '../../../src/errors/CannotPassUndefinedAsAValueToAWhereClause'
import ops from '../../../src/ops'
import Balloon from '../../../test-app/app/models/Balloon'
import Latex from '../../../test-app/app/models/Balloon/Latex'
import Mylar from '../../../test-app/app/models/Balloon/Mylar'
import Post from '../../../test-app/app/models/Post'
import Rating from '../../../test-app/app/models/Rating'
import User from '../../../test-app/app/models/User'

describe('Query#whereNot', () => {
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

  // original
  context('when passed undefined as a value', () => {
    it('raises an exception', async () => {
      await expect(async () => await User.query().whereNot({ email: undefined }).all()).rejects.toThrowError(
        CannotPassUndefinedAsAValueToAWhereClause
      )
    })
  })

  it('negates a query', async () => {
    await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    const user2 = await User.create({ email: 'danny@nelso', password: 'howyadoin' })
    const user3 = await User.create({ email: 'how@yadoin', password: 'howyadoin' })

    const records = await User.query().whereNot({ email: 'fred@frewd' }).all()
    expect(records).toMatchDreamModels([user2, user3])
  })

  context('inverse of negatable specs from Query#where', () => {
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
        const records = await User.query()
          .whereNot({ id: ops.not.in([user1.id, user2.id]) })
          .pluck('id')
        expect(records).toEqual([user1.id, user2.id])
      })

      context('with a blank array', () => {
        it('does not find any results', async () => {
          const records = await User.query()
            .whereNot({ id: ops.not.in([]) })
            .pluck('id')
          expect(records).toEqual([])
        })

        context('with a negated blank array', () => {
          it('finds all results', async () => {
            const records = await User.query()
              .whereNot({ id: ops.in([]) })
              .pluck('id')
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

        const records = await User.query()
          .whereNot({ id: ops.in([user1.id, user2.id]) })
          .pluck('id')
        expect(records).toEqual([user3.id])
      })
    })

    context('ops.not.equal is passed', () => {
      it('uses an "=" operator for comparison', async () => {
        await User.create({
          email: 'fred@frewd',
          password: 'howyadoin',
        })
        const user2 = await User.create({
          email: 'frez@frewd',
          password: 'howyadoin',
        })

        const records = await User.query()
          .whereNot({ id: ops.not.equal(user2.id) })
          .pluck('id')
        expect(records).toEqual([user2.id])
      })
    })

    context('ops.equal is passed', () => {
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

        const records = await User.query()
          .whereNot({ id: ops.equal(user1.id) })
          .pluck('id')
        expect(records).toEqual([user2.id, user3.id])
      })
    })

    context('ops.lessThan is passed', () => {
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

    context('ops.lessThanOrEqualTo is passed', () => {
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

    context('ops.greaterThan is passed', () => {
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

    context('ops.greaterThanOrEqualTo is passed', () => {
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

        const records = await User.query()
          .whereNot({ id: [user1.id, user2.id] })
          .pluck('id')
        expect(records).toEqual([user3.id])
      })
    })

    context('ops.like statement is passed', () => {
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

    context('ops.not.like statement is passed', () => {
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

    context('ops.not.ilike statement is passed', () => {
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
    context('ops.similarity statement is passed', () => {
      it('raises a targeted exception', async () => {
        await expect(async () => {
          await User.whereNot({ name: ops.similarity('world') }).all()
        }).rejects.toThrow(CannotNegateSimilarityClause)
      })
    })

    context('ops.wordSimilarity statement is passed', () => {
      it('raises a targeted exception', async () => {
        await expect(async () => {
          await User.whereNot({ name: ops.wordSimilarity('world') }).all()
        }).rejects.toThrow(CannotNegateSimilarityClause)
      })
    })

    context('ops.strictWordSimilarity statement is passed', () => {
      it('raises a targeted exception', async () => {
        await expect(async () => {
          await User.whereNot({ name: ops.strictWordSimilarity('world') }).all()
        }).rejects.toThrow(CannotNegateSimilarityClause)
      })
    })
    // END: trigram search

    context('ops.match statement is passed', () => {
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

    context('ops.not.match statement is passed', () => {
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

  context('whereNot null', () => {
    it('matches records with a non-null value for the specified field', async () => {
      const redBalloon = await Mylar.create({ color: 'red' })
      await Mylar.create({ color: null })

      const balloons = await Balloon.whereNot({ color: null }).all()
      expect(balloons).toMatchDreamModels([redBalloon])
    })
  })

  context('whereNot a non-null value', () => {
    it('matches records with the specified field value and also records with a null value for that field', async () => {
      await Mylar.create({ color: 'red' })
      const blueBalloon = await Mylar.create({ color: 'blue' })
      const noColorBalloon = await Mylar.create({ color: null })

      const balloons = await Balloon.whereNot({ color: 'red' }).all()
      expect(balloons).toMatchDreamModels([blueBalloon, noColorBalloon])
    })
  })
})
