import Balloon from '../../../../../test-app/app/models/Balloon.js'
import Latex from '../../../../../test-app/app/models/Balloon/Latex.js'
import Mylar from '../../../../../test-app/app/models/Balloon/Mylar.js'
import Pet from '../../../../../test-app/app/models/Pet.js'

describe('on clauses on associations (also see various specs in spec/unit/query)', () => {
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

  context('on', () => {
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

    context('an array without null', () => {
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

    context('an array with null', () => {
      it('matches records with null in the specified column', async () => {
        const reloaded = await Pet.leftJoinPreload('where_arrayWithNull').firstOrFail()
        expect(reloaded.where_arrayWithNull).toMatchDreamModels([noColorBalloon])
      })

      context('ops.in', () => {
        it('matches records with null in the specified column', async () => {
          const reloaded = await Pet.leftJoinPreload('where_opsIn_arrayWithNull').firstOrFail()
          expect(reloaded.where_opsIn_arrayWithNull).toMatchDreamModels([noColorBalloon])
        })
      })

      context('ops.not.in', () => {
        it('include records with non-null in that field', async () => {
          const reloaded = await Pet.leftJoinPreload('where_opsNotIn_arrayWithNull').firstOrFail()
          expect(reloaded.where_opsNotIn_arrayWithNull).toMatchDreamModels([redBalloon, greenBalloon])
        })
      })
    })

    context('an array with null and a non-null value', () => {
      it('matches records with null or the non-null value in the specified column', async () => {
        const reloaded = await Pet.leftJoinPreload('where_arrayWithNullAndRed').firstOrFail()
        expect(reloaded.where_arrayWithNullAndRed).toMatchDreamModels([noColorBalloon, redBalloon])
      })

      context('ops.in', () => {
        it('matches records with null or the non-null value in the specified column', async () => {
          const reloaded = await Pet.leftJoinPreload('where_opsIn_arrayWithNullAndRed').firstOrFail()
          expect(reloaded.where_opsIn_arrayWithNullAndRed).toMatchDreamModels([noColorBalloon, redBalloon])
        })
      })

      context('ops.not.in', () => {
        it('include records with non-null in that field that don’t match the non-null value', async () => {
          const reloaded = await Pet.leftJoinPreload('where_opsNotIn_arrayWithNullAndRed').firstOrFail()
          expect(reloaded.where_opsNotIn_arrayWithNullAndRed).toMatchDreamModels([greenBalloon])
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

      context('ops.not.equal', () => {
        it('include records with non-null in that field', async () => {
          const reloaded = await Pet.leftJoinPreload('where_opsNotEqual_null').firstOrFail()
          expect(reloaded.where_opsNotEqual_null).toMatchDreamModels([redBalloon, greenBalloon])
        })
      })
    })
  })

  context('notOn', () => {
    context('multiple clauses', () => {
      it('negates the logic of all the clauses ANDed together', async () => {
        const redMylarBalloon = await Mylar.create({ color: 'red' })
        await pet.createAssociation('collars', { balloon: redBalloon })

        const balloons = await Balloon.whereNot({ color: 'red', type: 'Latex' }).all()
        expect(balloons).toMatchDreamModels([redMylarBalloon, greenBalloon, noColorBalloon])
      })
    })

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
      it('returns results as if the where in empty array clause were not present', async () => {
        const reloaded = await Pet.leftJoinPreload('whereNot_emptyArray').firstOrFail()
        expect(reloaded.whereNot_emptyArray).toMatchDreamModels([redBalloon, greenBalloon, noColorBalloon])
      })

      context('ops.in', () => {
        it('returns results as if the where in empty array clause were not present', async () => {
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
          expect(reloaded.whereNot_opsNotIn_emptyArray).toMatchDreamModels([])
        })
      })
    })

    context('an array with null', () => {
      it('include records with non-null in that field', async () => {
        const reloaded = await Pet.leftJoinPreload('whereNot_arrayWithNull').firstOrFail()
        expect(reloaded.whereNot_arrayWithNull).toMatchDreamModels([redBalloon, greenBalloon])
      })

      context('ops.in', () => {
        it('include records with non-null in that field', async () => {
          const reloaded = await Pet.leftJoinPreload('whereNot_opsIn_arrayWithNull').firstOrFail()
          expect(reloaded.whereNot_opsIn_arrayWithNull).toMatchDreamModels([redBalloon, greenBalloon])
        })
      })

      context('ops.not.in', () => {
        it('matches records with null in the specified column', async () => {
          const reloaded = await Pet.leftJoinPreload('whereNot_opsNotIn_arrayWithNull').firstOrFail()
          expect(reloaded.whereNot_opsNotIn_arrayWithNull).toMatchDreamModels([noColorBalloon])
        })
      })
    })

    context('an array with null and a non-null value', () => {
      it('matches records with null or the non-null value in the specified column', async () => {
        const reloaded = await Pet.leftJoinPreload('whereNot_arrayWithNullAndRed').firstOrFail()
        expect(reloaded.whereNot_arrayWithNullAndRed).toMatchDreamModels([greenBalloon])
      })

      context('ops.in', () => {
        it('matches records with null or the non-null value in the specified column', async () => {
          const reloaded = await Pet.leftJoinPreload('whereNot_opsIn_arrayWithNullAndRed').firstOrFail()
          expect(reloaded.whereNot_opsIn_arrayWithNullAndRed).toMatchDreamModels([greenBalloon])
        })
      })

      context('ops.not.in', () => {
        it('include records with non-null in that field that don’t match the non-null value', async () => {
          const reloaded = await Pet.leftJoinPreload('whereNot_opsNotIn_arrayWithNullAndRed').firstOrFail()
          expect(reloaded.whereNot_opsNotIn_arrayWithNullAndRed).toMatchDreamModels([
            noColorBalloon,
            redBalloon,
          ])
        })
      })
    })

    context('a null value', () => {
      it('matches records with null in the specified column', async () => {
        const reloaded = await Pet.leftJoinPreload('whereNot_null').firstOrFail()
        expect(reloaded.whereNot_null).toMatchDreamModels([redBalloon, greenBalloon])
      })

      context('ops.equal', () => {
        it('matches records with null in the specified column', async () => {
          const reloaded = await Pet.leftJoinPreload('whereNot_opsEqual_null').firstOrFail()
          expect(reloaded.whereNot_opsEqual_null).toMatchDreamModels([redBalloon, greenBalloon])
        })
      })

      context('ops.not.equal', () => {
        it('include records with non-null in that field', async () => {
          const reloaded = await Pet.leftJoinPreload('whereNot_opsNotEqual_null').firstOrFail()
          expect(reloaded.whereNot_opsNotEqual_null).toMatchDreamModels([noColorBalloon])
        })
      })
    })
  })

  context('onAny', () => {
    context('a non-null value', () => {
      it('matches records with the value in the specified column', async () => {
        const reloaded = await Pet.leftJoinPreload('onAny_red').firstOrFail()
        expect(reloaded.onAny_red).toMatchDreamModels([redBalloon])
      })

      context('ops.equal', () => {
        it('matches records with the value in the specified column', async () => {
          const reloaded = await Pet.leftJoinPreload('onAny_opsEqual_red').firstOrFail()
          expect(reloaded.onAny_opsEqual_red).toMatchDreamModels([redBalloon])
        })
      })

      context('ops.not.equal', () => {
        it('include records with fields with a value that doesn’t match specified value, including null', async () => {
          const reloaded = await Pet.leftJoinPreload('onAny_opsNotEqual_red').firstOrFail()
          expect(reloaded.onAny_opsNotEqual_red).toMatchDreamModels([greenBalloon, noColorBalloon])
        })
      })
    })

    context('an array without null', () => {
      it('matches records with any array value in the specified column', async () => {
        const reloaded = await Pet.leftJoinPreload('onAny_redArray').firstOrFail()
        expect(reloaded.onAny_redArray).toMatchDreamModels([redBalloon])
      })

      context('ops.in', () => {
        it('matches records with any array value in the specified column', async () => {
          const reloaded = await Pet.leftJoinPreload('onAny_opsIn_redArray').firstOrFail()
          expect(reloaded.onAny_opsIn_redArray).toMatchDreamModels([redBalloon])
        })
      })

      context('ops.not.in', () => {
        it('include records with fields with a value that doesn’t match specified value, including null', async () => {
          const reloaded = await Pet.leftJoinPreload('onAny_opsNotIn_redArray').firstOrFail()
          expect(reloaded.onAny_opsNotIn_redArray).toMatchDreamModels([greenBalloon, noColorBalloon])
        })
      })
    })

    context('an array with null', () => {
      it('matches records with null in the specified column', async () => {
        const reloaded = await Pet.leftJoinPreload('onAny_arrayWithNull').firstOrFail()
        expect(reloaded.onAny_arrayWithNull).toMatchDreamModels([noColorBalloon])
      })

      context('ops.in', () => {
        it('matches records with null in the specified column', async () => {
          const reloaded = await Pet.leftJoinPreload('onAny_opsIn_arrayWithNull').firstOrFail()
          expect(reloaded.onAny_opsIn_arrayWithNull).toMatchDreamModels([noColorBalloon])
        })
      })

      context('ops.not.in', () => {
        it('include records with non-null in that field', async () => {
          const reloaded = await Pet.leftJoinPreload('onAny_opsNotIn_arrayWithNull').firstOrFail()
          expect(reloaded.onAny_opsNotIn_arrayWithNull).toMatchDreamModels([redBalloon, greenBalloon])
        })
      })
    })

    context('an array with null and a non-null value', () => {
      it('matches records with null or the non-null value in the specified column', async () => {
        const reloaded = await Pet.leftJoinPreload('onAny_arrayWithNullAndRed').firstOrFail()
        expect(reloaded.onAny_arrayWithNullAndRed).toMatchDreamModels([noColorBalloon, redBalloon])
      })

      context('ops.in', () => {
        it('matches records with null or the non-null value in the specified column', async () => {
          const reloaded = await Pet.leftJoinPreload('onAny_opsIn_arrayWithNullAndRed').firstOrFail()
          expect(reloaded.onAny_opsIn_arrayWithNullAndRed).toMatchDreamModels([noColorBalloon, redBalloon])
        })
      })

      context('ops.not.in', () => {
        it('include records with non-null in that field that don’t match the non-null value', async () => {
          const reloaded = await Pet.leftJoinPreload('onAny_opsNotIn_arrayWithNullAndRed').firstOrFail()
          expect(reloaded.onAny_opsNotIn_arrayWithNullAndRed).toMatchDreamModels([greenBalloon])
        })
      })
    })

    context('an empty array', () => {
      it('returns no results', async () => {
        const reloaded = await Pet.leftJoinPreload('onAny_emptyArray').firstOrFail()
        expect(reloaded.onAny_emptyArray).toMatchDreamModels([])
      })

      context('ops.in', () => {
        it('returns no results', async () => {
          const reloaded = await Pet.leftJoinPreload('onAny_opsIn_emptyArray').firstOrFail()
          expect(reloaded.onAny_opsIn_emptyArray).toMatchDreamModels([])
        })
      })

      context('ops.not.in ', () => {
        it('returns results as if the array whereNot clause were not present', async () => {
          const reloaded = await Pet.leftJoinPreload('onAny_opsNotIn_emptyArray').firstOrFail()
          expect(reloaded.onAny_opsNotIn_emptyArray).toMatchDreamModels([
            redBalloon,
            greenBalloon,
            noColorBalloon,
          ])
        })
      })
    })

    context('a null value', () => {
      it('matches records with null in the specified column', async () => {
        const reloaded = await Pet.leftJoinPreload('onAny_null').firstOrFail()
        expect(reloaded.onAny_null).toMatchDreamModels([noColorBalloon])
      })

      context('ops.equal ', () => {
        it('matches records with null in the specified column', async () => {
          const reloaded = await Pet.leftJoinPreload('onAny_opsEqual_null').firstOrFail()
          expect(reloaded.onAny_opsEqual_null).toMatchDreamModels([noColorBalloon])
        })
      })

      context('ops.not.equal', () => {
        it('include records with non-null in that field', async () => {
          const reloaded = await Pet.leftJoinPreload('onAny_opsNotEqual_null').firstOrFail()
          expect(reloaded.onAny_opsNotEqual_null).toMatchDreamModels([redBalloon, greenBalloon])
        })
      })
    })
  })
})
