import { DateTime } from 'luxon'
import { CalendarDate } from '../../../src'
import CannotPassUndefinedAsAValueToAWhereClause from '../../../src/errors/CannotPassUndefinedAsAValueToAWhereClause'
import AnyRequiresArrayColumn from '../../../src/errors/ops/AnyRequiresArrayColumn'
import ScoreMustBeANormalNumber from '../../../src/errors/ops/ScoreMustBeANormalNumber'
import range from '../../../src/helpers/range'
import ops from '../../../src/ops'
import Balloon from '../../../test-app/app/models/Balloon'
import Latex from '../../../test-app/app/models/Balloon/Latex'
import Mylar from '../../../test-app/app/models/Balloon/Mylar'
import Composition from '../../../test-app/app/models/Composition'
import Pet from '../../../test-app/app/models/Pet'
import Post from '../../../test-app/app/models/Post'
import Rating from '../../../test-app/app/models/Rating'
import User from '../../../test-app/app/models/User'

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

  context('passing undefined', () => {
    it('raises an exception', async () => {
      await expect(async () => await User.query().where({ email: undefined }).all()).rejects.toThrowError(
        CannotPassUndefinedAsAValueToAWhereClause
      )
    })
  })

  it('supports querying by CalendarDate', async () => {
    const birthdate = CalendarDate.fromISO('1977-05-04')
    const user = await User.create({ email: 'fred@frewd', password: 'howyadoin', birthdate })

    const reloadedUser = await User.where({ birthdate }).first()
    expect(reloadedUser).toMatchDreamModel(user)
  })

  it('supports querying by DateTime', async () => {
    const birthdate = DateTime.fromISO('1977-05-04')
    const user = await User.create({ email: 'fred@frewd', password: 'howyadoin', birthdate })

    const reloadedUser = await User.where({ birthdate }).first()
    expect(reloadedUser).toMatchDreamModel(user)
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

  context('after a join', () => {
    it('limits the results', async () => {
      const pet = await Pet.create()
      const redBalloon = await Latex.create({ color: 'red' })
      const greenBalloon = await Latex.create({ color: 'green' })
      const noColorBalloon = await Latex.create({ color: null })

      await pet.createAssociation('collars', { balloon: redBalloon })
      await pet.createAssociation('collars', { balloon: greenBalloon })
      await pet.createAssociation('collars', { balloon: noColorBalloon })

      const reloaded = await Pet.leftJoinPreload('whereNot_red')
        .where({ 'whereNot_red.color': ['red', 'green'] })
        .firstOrFail()
      expect(reloaded.whereNot_red).toMatchDreamModels([greenBalloon])
    })

    it('implicitly namespaces un-namespaced columns to the base model’s table', async () => {
      const pet = await Pet.create()
      const redBalloon = await Latex.create({ color: 'red' })
      const greenBalloon = await Latex.create({ color: 'green' })
      const noColorBalloon = await Latex.create({ color: null })

      await pet.createAssociation('collars', { balloon: redBalloon })
      await pet.createAssociation('collars', { balloon: greenBalloon })
      await pet.createAssociation('collars', { balloon: noColorBalloon })

      const reloaded = await Pet.leftJoinPreload('whereNot_red').where({ id: pet.id }).firstOrFail()
      expect(reloaded.whereNot_red).toMatchDreamModels([greenBalloon, noColorBalloon])
    })
  })

  context('passing null', () => {
    it('unsets previously-applied where clauses', async () => {
      const user1 = await User.create({
        name: 'Hello',
        email: 'fred@frewd',
        password: 'howyadoin',
      })
      const user2 = await User.create({
        name: 'World',
        email: 'frez@frewd',
        password: 'howyadoin',
      })

      const users = await User.where({ email: 'fred@frewd' }).where(null).all()
      expect(users).toMatchDreamModels([user1, user2])
    })

    it('overrides named scopes', async () => {
      const user1 = await User.create({
        name: 'Chalupas jr',
        email: 'fred@frewd',
        password: 'howyadoin',
      })
      const user2 = await User.create({
        name: 'World',
        email: 'frez@frewd',
        password: 'howyadoin',
      })

      const users = await User.scope('withFunnyName').where(null).all()
      expect(users).toMatchDreamModels([user1, user2])
    })

    it('does not override default scopes', async () => {
      const pet1 = await Pet.create({
        name: 'Hello',
      })
      await Pet.create({
        name: 'World',
        deletedAt: DateTime.now(),
      })

      const users = await Pet.query().where(null).all()
      expect(users).toMatchDreamModels([pet1])
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
      it('matches records with the value in the specified column', async () => {
        const balloons = await Balloon.where({ color: 'red' }).all()
        expect(balloons).toMatchDreamModels([redBalloon])
      })

      context('ops.equal', () => {
        it('matches records with the value in the specified column', async () => {
          const balloons = await Balloon.where({ color: ops.equal('red') }).all()
          expect(balloons).toMatchDreamModels([redBalloon])
        })
      })

      context('ops.not.equal', () => {
        it('include records with fields with a value that doesn’t match specified value, including null', async () => {
          const balloons = await Balloon.where({ color: ops.not.equal('red') }).all()
          expect(balloons).toMatchDreamModels([greenBalloon, noColorBalloon])
        })
      })

      context("ops.expression('=', ...)", () => {
        it('matches records with the value in the specified column', async () => {
          const balloons = await Balloon.where({ color: ops.expression('=', 'red') }).all()
          expect(balloons).toMatchDreamModels([redBalloon])
        })
      })

      context("ops.expression('!=', ...)", () => {
        it('include records with fields with a value that doesn’t match specified value, including null', async () => {
          const balloons = await Balloon.where({ color: ops.expression('!=', 'red') }).all()
          expect(balloons).toMatchDreamModels([greenBalloon, noColorBalloon])
        })
      })
    })

    context('an array without null', () => {
      it('matches records with any array value in the specified column', async () => {
        const balloons = await Balloon.where({ color: ['red'] }).all()
        expect(balloons).toMatchDreamModels([redBalloon])
      })

      context('ops.in', () => {
        it('matches records with any array value in the specified column', async () => {
          const balloons = await Balloon.where({ color: ops.in(['red']) }).all()
          expect(balloons).toMatchDreamModels([redBalloon])
        })
      })

      context('ops.not.in', () => {
        it('include records with fields with a value that doesn’t match specified value, including null', async () => {
          const balloons = await Balloon.where({ color: ops.not.in(['red']) }).all()
          expect(balloons).toMatchDreamModels([greenBalloon, noColorBalloon])
        })
      })

      context("ops.expression('in', ...)", () => {
        it('matches records with any array value in the specified column', async () => {
          const balloons = await Balloon.where({ color: ops.expression('in', ['red']) }).all()
          expect(balloons).toMatchDreamModels([redBalloon])
        })
      })

      context("ops.expression('not in', ...)", () => {
        it('include records with fields with a value that doesn’t match specified value, including null', async () => {
          const balloons = await Balloon.where({ color: ops.expression('not in', ['red']) }).all()
          expect(balloons).toMatchDreamModels([greenBalloon, noColorBalloon])
        })
      })
    })

    context('an array with null', () => {
      it('matches records with null in the specified column', async () => {
        const balloons = await Balloon.where({ color: [null as any] }).all()
        expect(balloons).toMatchDreamModels([noColorBalloon])
      })

      context('ops.in', () => {
        it('matches records with null in the specified column', async () => {
          const balloons = await Balloon.where({ color: ops.in([null]) }).all()
          expect(balloons).toMatchDreamModels([noColorBalloon])
        })
      })

      context('ops.not.in', () => {
        it('include records with non-null in that field', async () => {
          const balloons = await Balloon.where({ color: ops.not.in([null]) }).all()
          expect(balloons).toMatchDreamModels([redBalloon, greenBalloon])
        })
      })

      context("ops.expression('in', ...)", () => {
        it('matches records with null in the specified column', async () => {
          const balloons = await Balloon.where({ color: ops.expression('in', [null]) }).all()
          expect(balloons).toMatchDreamModels([noColorBalloon])
        })
      })

      context("ops.expression('not in', ...)", () => {
        it('include records with non-null in that field', async () => {
          const balloons = await Balloon.where({ color: ops.expression('not in', [null]) }).all()
          expect(balloons).toMatchDreamModels([redBalloon, greenBalloon])
        })
      })
    })

    context('an array with null and a non-null value', () => {
      it('matches records with null or the non-null value in the specified column', async () => {
        const balloons = await Balloon.where({ color: [null as any, 'red'] }).all()
        expect(balloons).toMatchDreamModels([noColorBalloon, redBalloon])
      })

      context('ops.in', () => {
        it('matches records with null or the non-null value in the specified column', async () => {
          const balloons = await Balloon.where({ color: ops.in([null, 'red']) }).all()
          expect(balloons).toMatchDreamModels([noColorBalloon, redBalloon])
        })
      })

      context('ops.not.in', () => {
        it('include records with non-null in that field that don’t match the non-null value', async () => {
          const balloons = await Balloon.where({ color: ops.not.in([null, 'red']) }).all()
          expect(balloons).toMatchDreamModels([greenBalloon])
        })
      })

      context("ops.expression('in', ...)", () => {
        it('matches records with null or the non-null value in the specified column', async () => {
          const balloons = await Balloon.where({ color: ops.expression('in', [null, 'red']) }).all()
          expect(balloons).toMatchDreamModels([noColorBalloon, redBalloon])
        })
      })

      context("ops.expression('not in', ...)", () => {
        it('include records with non-null in that field that don’t match the non-null value', async () => {
          const balloons = await Balloon.where({ color: ops.expression('not in', [null, 'red']) }).all()
          expect(balloons).toMatchDreamModels([greenBalloon])
        })
      })
    })

    context('an empty array', () => {
      it('returns no results', async () => {
        const balloons = await Balloon.where({ color: [] }).all()
        expect(balloons).toMatchDreamModels([])
      })

      context('ops.in', () => {
        it('returns no results', async () => {
          const balloons = await Balloon.where({ color: ops.in([]) }).all()
          expect(balloons).toMatchDreamModels([])
        })
      })

      context('ops.not.in ', () => {
        it('returns results as if the array whereNot clause were not present', async () => {
          const balloons = await Balloon.where({ color: ops.not.in([]) }).all()
          expect(balloons).toMatchDreamModels([redBalloon, greenBalloon, noColorBalloon])
        })
      })

      context("ops.expression('in', ...)", () => {
        it('returns no results', async () => {
          const balloons = await Balloon.where({ color: ops.expression('in', []) }).all()
          expect(balloons).toMatchDreamModels([])
        })
      })

      context("ops.expression('not in', ...)", () => {
        it('returns results as if the array whereNot clause were not present', async () => {
          const balloons = await Balloon.where({ color: ops.expression('not in', []) }).all()
          expect(balloons).toMatchDreamModels([redBalloon, greenBalloon, noColorBalloon])
        })
      })
    })

    context('a null value', () => {
      it('matches records with null in the specified column', async () => {
        const balloons = await Balloon.where({ color: null }).all()
        expect(balloons).toMatchDreamModels([noColorBalloon])
      })

      context('ops.equal', () => {
        it('matches records with null in the specified column', async () => {
          const balloons = await Balloon.where({ color: ops.equal(null) }).all()
          expect(balloons).toMatchDreamModels([noColorBalloon])
        })
      })

      context('ops.not.equal', () => {
        it('include records with non-null in that field', async () => {
          const balloons = await Balloon.where({ color: ops.not.equal(null) }).all()
          expect(balloons).toMatchDreamModels([redBalloon, greenBalloon])
        })
      })

      context("ops.expression('=', ...)", () => {
        it('matches records with null in the specified column', async () => {
          const balloons = await Balloon.where({ color: ops.expression('=', null) }).all()
          expect(balloons).toMatchDreamModels([noColorBalloon])
        })
      })

      context("ops.expression('!=', ...)", () => {
        it('include records with non-null in that field', async () => {
          const balloons = await Balloon.where({ color: ops.expression('!=', null) }).all()
          expect(balloons).toMatchDreamModels([redBalloon, greenBalloon])
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
        .where({ rating: ops.lessThan(4) })
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
        .where({ rating: ops.lessThanOrEqualTo(4) })
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
        .where({ rating: ops.greaterThan(4) })
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
        .where({ rating: ops.greaterThanOrEqualTo(4) })
        .pluck('id')
      expect(records).toEqual([rating5.id, rating4.id])
    })
  })

  context('ops.any', () => {
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

      await Mylar.create({
        user,
        multicolor: ['blue'],
      })

      const balloons = await Balloon.query()
        .where({ multicolor: ops.any('green') })
        .all()
      expect(balloons).toMatchDreamModels([multicolorBalloon, greenBalloon])
    })

    context('when passed a non-array column', () => {
      it('raises an exception', async () => {
        await User.create({ email: 'fred@fred', password: 'howyadoin' })
        await expect(
          User.query()
            .where({ email: ops.any('fred@fred') })
            .all()
        ).rejects.toThrow(AnyRequiresArrayColumn)
      })
    })
  })

  context('ops.like', () => {
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
        .where({ email: ops.like('%aaa@%') })
        .pluck('id')
      expect(records).toEqual([user1.id])
    })
  })

  context('ops.not.like', () => {
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
        .where({ email: ops.not.like('%aaa@%') })
        .pluck('id')
      expect(records).toEqual([user2.id, user3.id])
    })
  })

  context('ops.ilike', () => {
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
        .where({ email: ops.ilike('%aaa@%') })
        .pluck('id')
      expect(records).toEqual([user1.id, user2.id])
    })
  })

  context('ops.not.ilike', () => {
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
        .where({ email: ops.not.ilike('%aaa@%') })
        .pluck('id')
      expect(records).toEqual([user3.id])
    })
  })

  // BEGIN: similarity search
  context('ops.similarity', () => {
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

    context('with a string that is not a valid tsquery', () => {
      it('uses websearch_to_tsquery to reformat input to a valid tsquery input', async () => {
        const user4 = await User.create({
          email: 'pizza@d',
          password: 'howyadoin',
          name: "wendy's",
        })
        const records = await User.where({ name: ops.similarity("wendy's", { score: 0.9 }) }).all()
        expect(records).toMatchDreamModels([user4])
      })
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
          }).rejects.toThrow(ScoreMustBeANormalNumber)
        })
      })

      context('when applying a score that is greater than 1', () => {
        it('raises a targeted exception', async () => {
          await expect(async () => {
            await User.where({ name: ops.similarity('world', { score: 1.000001 }) }).all()
          }).rejects.toThrow(ScoreMustBeANormalNumber)
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

  context('ops.wordSimilarity', () => {
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
      const records = await User.query()
        .where({ name: ops.wordSimilarity('world') })
        .all()
      expect(records).toMatchDreamModels([user1, user2])
    })

    context('when overriding score', () => {
      it('applies score override', async () => {
        const records = await User.query()
          .where({ name: ops.wordSimilarity('world', { score: 0.1 }) })
          .all()
        expect(records).toMatchDreamModels([user1, user2, user3])
      })
    })

    context('matching a single word within a long string', () => {
      it('matches with a score of 1', async () => {
        await user3.update({ name: 'Snoopy, Lucy, Charlie, Woodstock, Linus, Pigpen, Schroeder' })

        const records = await User.query()
          .where({ name: ops.wordSimilarity('linus', { score: 1 }) })
          .all()
        expect(records).toMatchDreamModels([user3])

        const records2 = await User.query()
          .where({ name: ops.wordSimilarity('stock', { score: 0.5 }) })
          .all()
        expect(records2).toMatchDreamModels([user3])
      })
    })
  })

  context('ops.strictWordSimilarity', () => {
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
      const records = await User.query()
        .where({ name: ops.strictWordSimilarity('world') })
        .all()
      expect(records).toMatchDreamModels([user1])
    })

    context('when overriding score', () => {
      it('applies score override', async () => {
        const records = await User.query()
          .where({ name: ops.strictWordSimilarity('world', { score: 0.1 }) })
          .all()
        expect(records).toMatchDreamModels([user1, user2, user3])
      })
    })

    context('matching a single word within a long string', () => {
      it('matches with a score of 1', async () => {
        await user3.update({ name: 'Snoopy, Lucy, Charlie, Woodstock, Linus, Pigpen, Schroeder' })

        const records = await User.query()
          .where({ name: ops.strictWordSimilarity('linus', { score: 1 }) })
          .all()
        expect(records).toMatchDreamModels([user3])

        const records2 = await User.query()
          .where({ name: ops.strictWordSimilarity('stock', { score: 0.5 }) })
          .all()
        expect(records2).toHaveLength(0)
      })
    })
  })
  // END: similarity search

  context('ops.match', () => {
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
        .where({ email: ops.match('aaa.*') })
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
          .where({ email: ops.match('aaa.*', { caseInsensitive: true }) })
          .pluck('id')
        expect(records).toEqual([user1.id, user2.id])
      })
    })
  })

  context('ops.not.match', () => {
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
        .where({ email: ops.not.match('aaa.*') })
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
          .where({ email: ops.not.match('aaa.*', { caseInsensitive: true }) })
          .pluck('id')
        expect(records).toEqual([user3.id])
      })
    })
  })

  context('a DateTime range', () => {
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

    it('is able to apply DateTime ranges to where clause', async () => {
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

  context('a CalendarDate', () => {
    const begin = CalendarDate.today()
    const end = CalendarDate.today().plus({ days: 3 })

    let user0: User
    let user1: User
    let user2: User
    let user3: User
    let user4: User

    beforeEach(async () => {
      user0 = await User.create({
        email: 'fred@frewd',
        password: 'howyadoin',
        createdAt: begin.minus({ day: 1 }),
      })
      user1 = await User.create({
        email: 'fred@frezd',
        password: 'howyadoin',
        createdAt: begin,
      })
      user2 = await User.create({
        email: 'fred@frwwd',
        password: 'howyadoin',
        createdAt: begin.plus({ day: 1 }),
      })
      user3 = await User.create({
        email: 'fred@frewdzsd',
        password: 'howyadoin',
        createdAt: end,
      })
      user4 = await User.create({
        email: 'fred@frwewdzsd',
        password: 'howyadoin',
        createdAt: end.plus({ day: 1 }),
      })
    })

    it('is able to apply DateTime ranges to where clause', async () => {
      const records = await User.order('id')
        .where({ createdAt: range(begin, end) })
        .all()

      expect(records.length).toEqual(3)
      expect(records.map(r => r.id)).toEqual([user1.id, user2.id, user3.id])
    })

    context('end is not passed', () => {
      it('finds all dates after the start', async () => {
        const records = await User.order('id')
          .where({ createdAt: range(begin.plus({ day: 1 })) })
          .all()

        expect(records.length).toEqual(3)
        expect(records.map(r => r.id)).toEqual([user2.id, user3.id, user4.id])
      })
    })

    context('start is not passed', () => {
      it('finds all dates before the end', async () => {
        const records = await User.order('id')
          .where({ createdAt: range(null, begin.plus({ day: 1 })) })
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

  context('a function returning a date range', () => {
    const begin = DateTime.now()
    const end = DateTime.now().plus({ day: 1 })

    let user2: User

    beforeEach(async () => {
      await User.create({
        email: 'fred@frewd',
        password: 'howyadoin',
        createdAt: begin.minus({ hour: 1 }),
      })
      user2 = await User.create({
        email: 'fred@frwwd',
        password: 'howyadoin',
        createdAt: begin.plus({ hour: 1 }),
      })
      await User.create({
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

  context('a number range', () => {
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
      const records = await Rating.query()
        .where({ rating: range(begin, end) })
        .all()
      expect(records).toMatchDreamModels([ratingBeginning, ratingWithin, ratingEnd])
    })

    context('end is not passed', () => {
      it('matches all numbers greater than or equal to the start', async () => {
        const records = await Rating.query()
          .where({ rating: range(begin) })
          .all()
        expect(records).toMatchDreamModels([ratingBeginning, ratingWithin, ratingEnd, ratingAfter])
      })
    })

    context('start is not passed', () => {
      it('matches all numbers less than or equal to the end', async () => {
        const records = await Rating.query()
          .where({ rating: range(null, end) })
          .all()
        expect(records).toMatchDreamModels([ratingBefore, ratingBeginning, ratingWithin, ratingEnd])
      })
    })

    context('excludeEnd is passed', () => {
      it('omits numbers matching the end', async () => {
        const records = await Rating.query()
          .where({ rating: range(null, end, true) })
          .all()
        expect(records).toMatchDreamModels([ratingBefore, ratingBeginning, ratingWithin])
      })
    })
  })
})
