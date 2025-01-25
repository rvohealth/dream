import Balloon from '../../../../../test-app/app/models/Balloon'
import Latex from '../../../../../test-app/app/models/Balloon/Latex'
import Pet from '../../../../../test-app/app/models/Pet'

describe('where clauses on associations (also see various specs in spec/unit/query)', () => {
  let pet: Pet
  let redBalloon: Balloon
  let greenBalloon: Balloon
  let noColorBalloon: Balloon

  beforeEach(async () => {
    pet = await Pet.create()
    redBalloon = await Latex.create({ color: 'red' })
    greenBalloon = await Latex.create({ color: 'green' })
    noColorBalloon = await Latex.create({ color: null })

    await pet.createAssociation('collars', { balloon: redBalloon })
    await pet.createAssociation('collars', { balloon: greenBalloon })
    await pet.createAssociation('collars', { balloon: noColorBalloon })
  })

  context('where', () => {
    context('a non-null value', () => {
      it('matches records with the value in the specified column', async () => {
        const reloaded = await Pet.leftJoinPreload('where_red').firstOrFail()
        expect(reloaded.where_red).toMatchDreamModels([redBalloon])
      })

      context('ops.equal', () => {
        it('matches records with the value in the specified column', async () => {
          const reloaded = await Pet.leftJoinPreload('where_opsEqual_red').firstOrFail()
          expect(reloaded.where_opsEqual_red).toMatchDreamModels([redBalloon])
        })
      })

      context('ops.not.equal', () => {
        it('include records with fields with a value that doesn’t match specified value, including null', async () => {
          const reloaded = await Pet.leftJoinPreload('where_opsNotEqual_red').firstOrFail()
          expect(reloaded.where_opsNotEqual_red).toMatchDreamModels([greenBalloon, noColorBalloon])
        })
      })
    })

    context('a non-null value array', () => {
      it('matches records with any array value in the specified column', async () => {
        const reloaded = await Pet.leftJoinPreload('where_redArray').firstOrFail()
        expect(reloaded.where_redArray).toMatchDreamModels([redBalloon])
      })

      context('ops.in', () => {
        it('matches records with any array value in the specified column', async () => {
          const reloaded = await Pet.leftJoinPreload('where_opsIn_redArray').firstOrFail()
          expect(reloaded.where_opsIn_redArray).toMatchDreamModels([redBalloon])
        })
      })

      context('ops.not.in', () => {
        it('include records with fields with a value that doesn’t match specified value, including null', async () => {
          const reloaded = await Pet.leftJoinPreload('where_opsNotIn_redArray').firstOrFail()
          expect(reloaded.where_opsNotIn_redArray).toMatchDreamModels([greenBalloon, noColorBalloon])
        })
      })
    })

    context('an empty array', () => {
      it('returns no results', async () => {
        const reloaded = await Pet.leftJoinPreload('where_emptyArray').firstOrFail()
        expect(reloaded.where_emptyArray).toMatchDreamModels([])
      })

      context('ops.in', () => {
        it('returns no results', async () => {
          const reloaded = await Pet.leftJoinPreload('where_opsIn_emptyArray').firstOrFail()
          expect(reloaded.where_opsIn_emptyArray).toMatchDreamModels([])
        })
      })

      context('ops.not.in ', () => {
        it('returns results as if the array whereNot clause were not present', async () => {
          const reloaded = await Pet.leftJoinPreload('where_opsNotIn_emptyArray').firstOrFail()
          expect(reloaded.where_opsNotIn_emptyArray).toMatchDreamModels([
            redBalloon,
            greenBalloon,
            noColorBalloon,
          ])
        })
      })
    })

    context('a null value', () => {
      it('matches records with null in the specified column', async () => {
        const reloaded = await Pet.leftJoinPreload('where_null').firstOrFail()
        expect(reloaded.where_null).toMatchDreamModels([noColorBalloon])
      })

      context('ops.equal ', () => {
        it('matches records with null in the specified column', async () => {
          const reloaded = await Pet.leftJoinPreload('where_opsEqual_null').firstOrFail()
          expect(reloaded.where_opsEqual_null).toMatchDreamModels([noColorBalloon])
        })
      })

      context('ops.not.equal ', () => {
        it('include records with non-null in that field', async () => {
          const reloaded = await Pet.leftJoinPreload('where_opsNotEqual_null').firstOrFail()
          expect(reloaded.where_opsNotEqual_null).toMatchDreamModels([redBalloon, greenBalloon])
        })
      })
    })
  })

  context('whereNot', () => {
    context('a non-null value', () => {
      it('include records with fields with a value that doesn’t match specified value, including null', async () => {
        const reloaded = await Pet.leftJoinPreload('whereNot_red').firstOrFail()
        expect(reloaded.whereNot_red).toMatchDreamModels([greenBalloon, noColorBalloon])
      })

      context('ops.equal', () => {
        it('include records with fields with a value that doesn’t match specified value, including null', async () => {
          const reloaded = await Pet.leftJoinPreload('whereNot_opsEqual_red').firstOrFail()
          expect(reloaded.whereNot_opsEqual_red).toMatchDreamModels([greenBalloon, noColorBalloon])
        })
      })

      context('ops.not.equal', () => {
        it('matches records with the value in the specified column', async () => {
          const reloaded = await Pet.leftJoinPreload('whereNot_opsNotEqual_red').firstOrFail()
          expect(reloaded.whereNot_opsNotEqual_red).toMatchDreamModels([redBalloon])
        })
      })
    })

    context('a non-null value array', () => {
      it('include records with fields with a value that doesn’t match specified value, including null', async () => {
        const reloaded = await Pet.leftJoinPreload('whereNot_redArray').firstOrFail()
        expect(reloaded.whereNot_redArray).toMatchDreamModels([greenBalloon, noColorBalloon])
      })

      context('ops.in', () => {
        it('include records with fields with a value that doesn’t match specified value, including null', async () => {
          const reloaded = await Pet.leftJoinPreload('whereNot_opsIn_redArray').firstOrFail()
          expect(reloaded.whereNot_opsIn_redArray).toMatchDreamModels([greenBalloon, noColorBalloon])
        })
      })

      context('ops.not.in', () => {
        it('matches records with any array value in the specified column', async () => {
          const reloaded = await Pet.leftJoinPreload('whereNot_opsNotIn_redArray').firstOrFail()
          expect(reloaded.whereNot_opsNotIn_redArray).toMatchDreamModels([redBalloon])
        })
      })
    })

    context('an empty array', () => {
      it('returns results as if the array whereNotNot clause were not present', async () => {
        const reloaded = await Pet.leftJoinPreload('whereNot_emptyArray').firstOrFail()
        expect(reloaded.whereNot_emptyArray).toMatchDreamModels([redBalloon, greenBalloon, noColorBalloon])
      })

      context('ops.in', () => {
        it('returns results as if the array whereNotNot clause were not present', async () => {
          const reloaded = await Pet.leftJoinPreload('whereNot_opsIn_emptyArray').firstOrFail()
          expect(reloaded.whereNot_opsIn_emptyArray).toMatchDreamModels([
            redBalloon,
            greenBalloon,
            noColorBalloon,
          ])
        })
      })

      context('ops.not.in ', () => {
        it('returns no results', async () => {
          const reloaded = await Pet.leftJoinPreload('whereNot_opsNotIn_emptyArray').firstOrFail()
          expect(reloaded.whereNot_opsNotIn_emptyArray).toEqual([])
        })
      })
    })

    context('a null value', () => {
      it('matches records with null in the specified column', async () => {
        const reloaded = await Pet.leftJoinPreload('whereNot_null').firstOrFail()
        expect(reloaded.whereNot_null).toMatchDreamModels([redBalloon, greenBalloon])
      })

      context('ops.equal ', () => {
        it('matches records with null in the specified column', async () => {
          const reloaded = await Pet.leftJoinPreload('whereNot_opsEqual_null').firstOrFail()
          expect(reloaded.whereNot_opsEqual_null).toMatchDreamModels([redBalloon, greenBalloon])
        })
      })

      context('ops.not.equal ', () => {
        it('include records with non-null in that field', async () => {
          const reloaded = await Pet.leftJoinPreload('whereNot_opsNotEqual_null').firstOrFail()
          expect(reloaded.whereNot_opsNotEqual_null).toMatchDreamModels([noColorBalloon])
        })
      })
    })
  })
})
