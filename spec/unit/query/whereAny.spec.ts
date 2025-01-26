import { ops } from '../../../src'
import CannotPassUndefinedAsAValueToAWhereClause from '../../../src/errors/CannotPassUndefinedAsAValueToAWhereClause'
import Balloon from '../../../test-app/app/models/Balloon'
import Latex from '../../../test-app/app/models/Balloon/Latex'
import User from '../../../test-app/app/models/User'

describe('Query#whereAny', () => {
  context('when passed undefined as a value', () => {
    it('raises an exception', async () => {
      await expect(
        async () =>
          await User.query()
            .whereAny([{ email: undefined }, { email: 'hi' }])
            .all()
      ).rejects.toThrowError(CannotPassUndefinedAsAValueToAWhereClause)
    })
  })

  context('within where-object', () => {
    it('treats keys within the object as AND statements', async () => {
      await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      const user2 = await User.create({ email: 'aster@brown', password: 'howyadoin' })
      await User.create({ email: 'how@yadoin', password: 'howyadoin' })

      const records = await User.query()
        .whereAny([{ email: 'fred@frewd', id: user2.id }])
        .all()
      expect(records).toEqual([])
    })
  })

  context('chained', () => {
    it('combines the separate OR statements using AND', async () => {
      await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      const user2 = await User.create({ email: 'aster@brown', password: 'howyadoin' })
      await User.create({ email: 'how@yadoin', password: 'howyadoin' })

      const records = await User.query()
        .whereAny([{ email: 'fred@frewd' }, { email: 'aster@brown' }])
        .whereAny([{ email: 'how@yadoin' }, { email: 'aster@brown' }])
        .all()
      expect(records).toMatchDreamModels([user2])
    })
  })

  context('between where-objects', () => {
    it('treats the separate object as OR statements', async () => {
      const user1 = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      const user2 = await User.create({ email: 'aster@brown', password: 'howyadoin' })
      await User.create({ email: 'how@yadoin', password: 'howyadoin' })

      const records = await User.query()
        .whereAny([{ email: 'fred@frewd' }, { id: user2.id }])
        .all()
      expect(records).toMatchDreamModels([user1, user2])
    })

    it('the same key can be specified in multiple clauses', async () => {
      const user1 = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      const user2 = await User.create({ email: 'aster@brown', password: 'howyadoin' })
      await User.create({ email: 'how@yadoin', password: 'howyadoin' })

      const records = await User.query()
        .whereAny([{ id: user1.id }, { id: user2.id }])
        .all()
      expect(records).toMatchDreamModels([user1, user2])
    })
  })

  context('nested selects', () => {
    it('work', async () => {
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

      const records = await User.whereAny([
        {
          id: User.where({ id: user1.id }).nestedSelect('id'),
        },
        {
          id: User.where({ id: user2.id }).nestedSelect('id'),
        },
      ]).all()
      expect(records).toMatchDreamModels([user1, user2])
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
        const balloons = await Balloon.whereAny([{ color: 'red' }]).all()
        expect(balloons).toMatchDreamModels([redBalloon])
      })

      context('ops.equal', () => {
        it('matches records with the value in the specified column', async () => {
          const balloons = await Balloon.whereAny([{ color: ops.equal('red') }]).all()
          expect(balloons).toMatchDreamModels([redBalloon])
        })
      })

      context('ops.not.equal', () => {
        it('include records with fields with a value that doesn’t match specified value, including null', async () => {
          const balloons = await Balloon.whereAny([{ color: ops.not.equal('red') }]).all()
          expect(balloons).toMatchDreamModels([greenBalloon, noColorBalloon])
        })
      })

      context("ops.expression('=', ...)", () => {
        it('matches records with the value in the specified column', async () => {
          const balloons = await Balloon.whereAny([{ color: ops.expression('=', 'red') }]).all()
          expect(balloons).toMatchDreamModels([redBalloon])
        })
      })

      context("ops.expression('!=', ...)", () => {
        it('include records with fields with a value that doesn’t match specified value, including null', async () => {
          const balloons = await Balloon.whereAny([{ color: ops.expression('!=', 'red') }]).all()
          expect(balloons).toMatchDreamModels([greenBalloon, noColorBalloon])
        })
      })
    })

    context('an array without null', () => {
      it('matches records with any array value in the specified column', async () => {
        const balloons = await Balloon.whereAny([{ color: ['red'] }]).all()
        expect(balloons).toMatchDreamModels([redBalloon])
      })

      context('ops.in', () => {
        it('matches records with any array value in the specified column', async () => {
          const balloons = await Balloon.whereAny([{ color: ops.in(['red']) }]).all()
          expect(balloons).toMatchDreamModels([redBalloon])
        })
      })

      context('ops.not.in', () => {
        it('include records with fields with a value that doesn’t match specified value, including null', async () => {
          const balloons = await Balloon.whereAny([{ color: ops.not.in(['red']) }]).all()
          expect(balloons).toMatchDreamModels([greenBalloon, noColorBalloon])
        })
      })

      context("ops.expression('in', ...)", () => {
        it('matches records with any array value in the specified column', async () => {
          const balloons = await Balloon.whereAny([{ color: ops.expression('in', ['red']) }]).all()
          expect(balloons).toMatchDreamModels([redBalloon])
        })
      })

      context("ops.expression('not in', ...)", () => {
        it('include records with fields with a value that doesn’t match specified value, including null', async () => {
          const balloons = await Balloon.whereAny([{ color: ops.expression('not in', ['red']) }]).all()
          expect(balloons).toMatchDreamModels([greenBalloon, noColorBalloon])
        })
      })
    })

    context('an array with null', () => {
      it('matches records with null in the specified column', async () => {
        const balloons = await Balloon.whereAny([{ color: [null as any] }]).all()
        expect(balloons).toMatchDreamModels([noColorBalloon])
      })

      context('ops.in', () => {
        it('matches records with null in the specified column', async () => {
          const balloons = await Balloon.whereAny([{ color: ops.in([null]) }]).all()
          expect(balloons).toMatchDreamModels([noColorBalloon])
        })
      })

      context('ops.not.in', () => {
        it('include records with non-null in that field', async () => {
          const balloons = await Balloon.whereAny([{ color: ops.not.in([null]) }]).all()
          expect(balloons).toMatchDreamModels([redBalloon, greenBalloon])
        })
      })

      context("ops.expression('in', ...)", () => {
        it('matches records with null in the specified column', async () => {
          const balloons = await Balloon.whereAny([{ color: ops.expression('in', [null]) }]).all()
          expect(balloons).toMatchDreamModels([noColorBalloon])
        })
      })

      context("ops.expression('not in', ...)", () => {
        it('include records with non-null in that field', async () => {
          const balloons = await Balloon.whereAny([{ color: ops.expression('not in', [null]) }]).all()
          expect(balloons).toMatchDreamModels([redBalloon, greenBalloon])
        })
      })
    })

    context('an array with null and a non-null value', () => {
      it('matches records with null or the non-null value in the specified column', async () => {
        const balloons = await Balloon.whereAny([{ color: [null as any, 'red'] }]).all()
        expect(balloons).toMatchDreamModels([noColorBalloon, redBalloon])
      })

      context('ops.in', () => {
        it('matches records with null or the non-null value in the specified column', async () => {
          const balloons = await Balloon.whereAny([{ color: ops.in([null, 'red']) }]).all()
          expect(balloons).toMatchDreamModels([noColorBalloon, redBalloon])
        })
      })

      context('ops.not.in', () => {
        it('include records with non-null in that field that don’t match the non-null value', async () => {
          const balloons = await Balloon.whereAny([{ color: ops.not.in([null, 'red']) }]).all()
          expect(balloons).toMatchDreamModels([greenBalloon])
        })
      })

      context("ops.expression('in', ...)", () => {
        it('matches records with null or the non-null value in the specified column', async () => {
          const balloons = await Balloon.whereAny([{ color: ops.expression('in', [null, 'red']) }]).all()
          expect(balloons).toMatchDreamModels([noColorBalloon, redBalloon])
        })
      })

      context("ops.expression('not in', ...)", () => {
        it('include records with non-null in that field that don’t match the non-null value', async () => {
          const balloons = await Balloon.whereAny([{ color: ops.expression('not in', [null, 'red']) }]).all()
          expect(balloons).toMatchDreamModels([greenBalloon])
        })
      })
    })

    context('an empty array', () => {
      it('returns no results', async () => {
        const balloons = await Balloon.whereAny([{ color: [] }]).all()
        expect(balloons).toMatchDreamModels([])
      })

      context('ops.in', () => {
        it('returns no results', async () => {
          const balloons = await Balloon.whereAny([{ color: ops.in([]) }]).all()
          expect(balloons).toMatchDreamModels([])
        })
      })

      context('ops.not.in ', () => {
        it('returns results as if the array whereNot clause were not present', async () => {
          const balloons = await Balloon.whereAny([{ color: ops.not.in([]) }]).all()
          expect(balloons).toMatchDreamModels([redBalloon, greenBalloon, noColorBalloon])
        })
      })

      context("ops.expression('in', ...)", () => {
        it('returns no results', async () => {
          const balloons = await Balloon.whereAny([{ color: ops.expression('in', []) }]).all()
          expect(balloons).toMatchDreamModels([])
        })
      })

      context("ops.expression('not in', ...)", () => {
        it('returns results as if the array whereNot clause were not present', async () => {
          const balloons = await Balloon.whereAny([{ color: ops.expression('not in', []) }]).all()
          expect(balloons).toMatchDreamModels([redBalloon, greenBalloon, noColorBalloon])
        })
      })
    })

    context('a null value', () => {
      it('matches records with null in the specified column', async () => {
        const balloons = await Balloon.whereAny([{ color: null }]).all()
        expect(balloons).toMatchDreamModels([noColorBalloon])
      })

      context('ops.equal', () => {
        it('matches records with null in the specified column', async () => {
          const balloons = await Balloon.whereAny([{ color: ops.equal(null) }]).all()
          expect(balloons).toMatchDreamModels([noColorBalloon])
        })
      })

      context('ops.not.equal', () => {
        it('include records with non-null in that field', async () => {
          const balloons = await Balloon.whereAny([{ color: ops.not.equal(null) }]).all()
          expect(balloons).toMatchDreamModels([redBalloon, greenBalloon])
        })
      })

      context("ops.expression('=', ...)", () => {
        it('matches records with null in the specified column', async () => {
          const balloons = await Balloon.whereAny([{ color: ops.expression('=', null) }]).all()
          expect(balloons).toMatchDreamModels([noColorBalloon])
        })
      })

      context("ops.expression('!=', ...)", () => {
        it('include records with non-null in that field', async () => {
          const balloons = await Balloon.whereAny([{ color: ops.expression('!=', null) }]).all()
          expect(balloons).toMatchDreamModels([redBalloon, greenBalloon])
        })
      })
    })
  })
})
