import Balloon from '../../../../../test-app/app/models/Balloon.js'
import Latex from '../../../../../test-app/app/models/Balloon/Latex.js'
import Mylar from '../../../../../test-app/app/models/Balloon/Mylar.js'
import Pet from '../../../../../test-app/app/models/Pet.js'

describe('and-clauses on associations (also see various specs in spec/unit/query)', () => {
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

  context('and', () => {
    context('a non-null value', () => {
      it('matches records with the value in the specified column', async () => {
        const reloaded = await Pet.leftJoinPreload('and_red').firstOrFail()
        expect(reloaded.and_red).toMatchDreamModels([redBalloon])
      })

      context('ops.equal', () => {
        it('matches records with the value in the specified column', async () => {
          const reloaded = await Pet.leftJoinPreload('and_opsEqual_red').firstOrFail()
          expect(reloaded.and_opsEqual_red).toMatchDreamModels([redBalloon])
        })
      })

      context('ops.not.equal', () => {
        it('include records with fields with a value that doesn’t match specified value, including null', async () => {
          const reloaded = await Pet.leftJoinPreload('and_opsNotEqual_red').firstOrFail()
          expect(reloaded.and_opsNotEqual_red).toMatchDreamModels([greenBalloon, noColorBalloon])
        })
      })
    })

    context('an array without null', () => {
      it('matches records with any array value in the specified column', async () => {
        const reloaded = await Pet.leftJoinPreload('and_redArray').firstOrFail()
        expect(reloaded.and_redArray).toMatchDreamModels([redBalloon])
      })

      context('ops.in', () => {
        it('matches records with any array value in the specified column', async () => {
          const reloaded = await Pet.leftJoinPreload('and_opsIn_redArray').firstOrFail()
          expect(reloaded.and_opsIn_redArray).toMatchDreamModels([redBalloon])
        })
      })

      context('ops.not.in', () => {
        it('include records with fields with a value that doesn’t match specified value, including null', async () => {
          const reloaded = await Pet.leftJoinPreload('and_opsNotIn_redArray').firstOrFail()
          expect(reloaded.and_opsNotIn_redArray).toMatchDreamModels([greenBalloon, noColorBalloon])
        })
      })
    })

    context('an array with null', () => {
      it('matches records with null in the specified column', async () => {
        const reloaded = await Pet.leftJoinPreload('and_arrayWithNull').firstOrFail()
        expect(reloaded.and_arrayWithNull).toMatchDreamModels([noColorBalloon])
      })

      context('ops.in', () => {
        it('matches records with null in the specified column', async () => {
          const reloaded = await Pet.leftJoinPreload('and_opsIn_arrayWithNull').firstOrFail()
          expect(reloaded.and_opsIn_arrayWithNull).toMatchDreamModels([noColorBalloon])
        })
      })

      context('ops.not.in', () => {
        it('include records with non-null in that field', async () => {
          const reloaded = await Pet.leftJoinPreload('and_opsNotIn_arrayWithNull').firstOrFail()
          expect(reloaded.and_opsNotIn_arrayWithNull).toMatchDreamModels([redBalloon, greenBalloon])
        })
      })
    })

    context('an array with null and a non-null value', () => {
      it('matches records with null or the non-null value in the specified column', async () => {
        const reloaded = await Pet.leftJoinPreload('and_arrayWithNullAndRed').firstOrFail()
        expect(reloaded.and_arrayWithNullAndRed).toMatchDreamModels([noColorBalloon, redBalloon])
      })

      context('ops.in', () => {
        it('matches records with null or the non-null value in the specified column', async () => {
          const reloaded = await Pet.leftJoinPreload('and_opsIn_arrayWithNullAndRed').firstOrFail()
          expect(reloaded.and_opsIn_arrayWithNullAndRed).toMatchDreamModels([noColorBalloon, redBalloon])
        })
      })

      context('ops.not.in', () => {
        it('include records with non-null in that field that don’t match the non-null value', async () => {
          const reloaded = await Pet.leftJoinPreload('and_opsNotIn_arrayWithNullAndRed').firstOrFail()
          expect(reloaded.and_opsNotIn_arrayWithNullAndRed).toMatchDreamModels([greenBalloon])
        })
      })
    })

    context('an empty array', () => {
      it('returns no results', async () => {
        const reloaded = await Pet.leftJoinPreload('and_emptyArray').firstOrFail()
        expect(reloaded.and_emptyArray).toMatchDreamModels([])
      })

      context('ops.in', () => {
        it('returns no results', async () => {
          const reloaded = await Pet.leftJoinPreload('and_opsIn_emptyArray').firstOrFail()
          expect(reloaded.and_opsIn_emptyArray).toMatchDreamModels([])
        })
      })

      context('ops.not.in ', () => {
        it('returns results as if the array whereNot clause were not present', async () => {
          const reloaded = await Pet.leftJoinPreload('and_opsNotIn_emptyArray').firstOrFail()
          expect(reloaded.and_opsNotIn_emptyArray).toMatchDreamModels([
            redBalloon,
            greenBalloon,
            noColorBalloon,
          ])
        })
      })
    })

    context('a null value', () => {
      it('matches records with null in the specified column', async () => {
        const reloaded = await Pet.leftJoinPreload('and_null').firstOrFail()
        expect(reloaded.and_null).toMatchDreamModels([noColorBalloon])
      })

      context('ops.equal ', () => {
        it('matches records with null in the specified column', async () => {
          const reloaded = await Pet.leftJoinPreload('and_opsEqual_null').firstOrFail()
          expect(reloaded.and_opsEqual_null).toMatchDreamModels([noColorBalloon])
        })
      })

      context('ops.not.equal', () => {
        it('include records with non-null in that field', async () => {
          const reloaded = await Pet.leftJoinPreload('and_opsNotEqual_null').firstOrFail()
          expect(reloaded.and_opsNotEqual_null).toMatchDreamModels([redBalloon, greenBalloon])
        })
      })
    })
  })

  context('andNot', () => {
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
        const reloaded = await Pet.leftJoinPreload('andNot_red').firstOrFail()
        expect(reloaded.andNot_red).toMatchDreamModels([greenBalloon, noColorBalloon])
      })

      context('ops.equal', () => {
        it('include records with fields with a value that doesn’t match specified value, including null', async () => {
          const reloaded = await Pet.leftJoinPreload('andNot_opsEqual_red').firstOrFail()
          expect(reloaded.andNot_opsEqual_red).toMatchDreamModels([greenBalloon, noColorBalloon])
        })
      })

      context('ops.not.equal', () => {
        it('matches records with the value in the specified column', async () => {
          const reloaded = await Pet.leftJoinPreload('andNot_opsNotEqual_red').firstOrFail()
          expect(reloaded.andNot_opsNotEqual_red).toMatchDreamModels([redBalloon])
        })
      })
    })

    context('a non-null value array', () => {
      it('include records with fields with a value that doesn’t match specified value, including null', async () => {
        const reloaded = await Pet.leftJoinPreload('andNot_redArray').firstOrFail()
        expect(reloaded.andNot_redArray).toMatchDreamModels([greenBalloon, noColorBalloon])
      })

      context('ops.in', () => {
        it('include records with fields with a value that doesn’t match specified value, including null', async () => {
          const reloaded = await Pet.leftJoinPreload('andNot_opsIn_redArray').firstOrFail()
          expect(reloaded.andNot_opsIn_redArray).toMatchDreamModels([greenBalloon, noColorBalloon])
        })
      })

      context('ops.not.in', () => {
        it('matches records with any array value in the specified column', async () => {
          const reloaded = await Pet.leftJoinPreload('andNot_opsNotIn_redArray').firstOrFail()
          expect(reloaded.andNot_opsNotIn_redArray).toMatchDreamModels([redBalloon])
        })
      })
    })

    context('an empty array', () => {
      it('returns results as if the where in empty array clause were not present', async () => {
        const reloaded = await Pet.leftJoinPreload('andNot_emptyArray').firstOrFail()
        expect(reloaded.andNot_emptyArray).toMatchDreamModels([redBalloon, greenBalloon, noColorBalloon])
      })

      context('ops.in', () => {
        it('returns results as if the where in empty array clause were not present', async () => {
          const reloaded = await Pet.leftJoinPreload('andNot_opsIn_emptyArray').firstOrFail()
          expect(reloaded.andNot_opsIn_emptyArray).toMatchDreamModels([
            redBalloon,
            greenBalloon,
            noColorBalloon,
          ])
        })
      })

      context('ops.not.in ', () => {
        it('returns no results', async () => {
          const reloaded = await Pet.leftJoinPreload('andNot_opsNotIn_emptyArray').firstOrFail()
          expect(reloaded.andNot_opsNotIn_emptyArray).toMatchDreamModels([])
        })
      })
    })

    context('an array with null', () => {
      it('include records with non-null in that field', async () => {
        const reloaded = await Pet.leftJoinPreload('andNot_arrayWithNull').firstOrFail()
        expect(reloaded.andNot_arrayWithNull).toMatchDreamModels([redBalloon, greenBalloon])
      })

      context('ops.in', () => {
        it('include records with non-null in that field', async () => {
          const reloaded = await Pet.leftJoinPreload('andNot_opsIn_arrayWithNull').firstOrFail()
          expect(reloaded.andNot_opsIn_arrayWithNull).toMatchDreamModels([redBalloon, greenBalloon])
        })
      })

      context('ops.not.in', () => {
        it('matches records with null in the specified column', async () => {
          const reloaded = await Pet.leftJoinPreload('andNot_opsNotIn_arrayWithNull').firstOrFail()
          expect(reloaded.andNot_opsNotIn_arrayWithNull).toMatchDreamModels([noColorBalloon])
        })
      })
    })

    context('an array with null and a non-null value', () => {
      it('matches records with null or the non-null value in the specified column', async () => {
        const reloaded = await Pet.leftJoinPreload('andNot_arrayWithNullAndRed').firstOrFail()
        expect(reloaded.andNot_arrayWithNullAndRed).toMatchDreamModels([greenBalloon])
      })

      context('ops.in', () => {
        it('matches records with null or the non-null value in the specified column', async () => {
          const reloaded = await Pet.leftJoinPreload('andNot_opsIn_arrayWithNullAndRed').firstOrFail()
          expect(reloaded.andNot_opsIn_arrayWithNullAndRed).toMatchDreamModels([greenBalloon])
        })
      })

      context('ops.not.in', () => {
        it('include records with non-null in that field that don’t match the non-null value', async () => {
          const reloaded = await Pet.leftJoinPreload('andNot_opsNotIn_arrayWithNullAndRed').firstOrFail()
          expect(reloaded.andNot_opsNotIn_arrayWithNullAndRed).toMatchDreamModels([
            noColorBalloon,
            redBalloon,
          ])
        })
      })
    })

    context('a null value', () => {
      it('matches records with null in the specified column', async () => {
        const reloaded = await Pet.leftJoinPreload('andNot_null').firstOrFail()
        expect(reloaded.andNot_null).toMatchDreamModels([redBalloon, greenBalloon])
      })

      context('ops.equal', () => {
        it('matches records with null in the specified column', async () => {
          const reloaded = await Pet.leftJoinPreload('andNot_opsEqual_null').firstOrFail()
          expect(reloaded.andNot_opsEqual_null).toMatchDreamModels([redBalloon, greenBalloon])
        })
      })

      context('ops.not.equal', () => {
        it('include records with non-null in that field', async () => {
          const reloaded = await Pet.leftJoinPreload('andNot_opsNotEqual_null').firstOrFail()
          expect(reloaded.andNot_opsNotEqual_null).toMatchDreamModels([noColorBalloon])
        })
      })
    })
  })

  context('andAny', () => {
    context('a non-null value', () => {
      it('matches records with the value in the specified column', async () => {
        const reloaded = await Pet.leftJoinPreload('andAny_red').firstOrFail()
        expect(reloaded.andAny_red).toMatchDreamModels([redBalloon])
      })

      context('ops.equal', () => {
        it('matches records with the value in the specified column', async () => {
          const reloaded = await Pet.leftJoinPreload('andAny_opsEqual_red').firstOrFail()
          expect(reloaded.andAny_opsEqual_red).toMatchDreamModels([redBalloon])
        })
      })

      context('ops.not.equal', () => {
        it('include records with fields with a value that doesn’t match specified value, including null', async () => {
          const reloaded = await Pet.leftJoinPreload('andAny_opsNotEqual_red').firstOrFail()
          expect(reloaded.andAny_opsNotEqual_red).toMatchDreamModels([greenBalloon, noColorBalloon])
        })
      })
    })

    context('an array without null', () => {
      it('matches records with any array value in the specified column', async () => {
        const reloaded = await Pet.leftJoinPreload('andAny_redArray').firstOrFail()
        expect(reloaded.andAny_redArray).toMatchDreamModels([redBalloon])
      })

      context('ops.in', () => {
        it('matches records with any array value in the specified column', async () => {
          const reloaded = await Pet.leftJoinPreload('andAny_opsIn_redArray').firstOrFail()
          expect(reloaded.andAny_opsIn_redArray).toMatchDreamModels([redBalloon])
        })
      })

      context('ops.not.in', () => {
        it('include records with fields with a value that doesn’t match specified value, including null', async () => {
          const reloaded = await Pet.leftJoinPreload('andAny_opsNotIn_redArray').firstOrFail()
          expect(reloaded.andAny_opsNotIn_redArray).toMatchDreamModels([greenBalloon, noColorBalloon])
        })
      })
    })

    context('an array with null', () => {
      it('matches records with null in the specified column', async () => {
        const reloaded = await Pet.leftJoinPreload('andAny_arrayWithNull').firstOrFail()
        expect(reloaded.andAny_arrayWithNull).toMatchDreamModels([noColorBalloon])
      })

      context('ops.in', () => {
        it('matches records with null in the specified column', async () => {
          const reloaded = await Pet.leftJoinPreload('andAny_opsIn_arrayWithNull').firstOrFail()
          expect(reloaded.andAny_opsIn_arrayWithNull).toMatchDreamModels([noColorBalloon])
        })
      })

      context('ops.not.in', () => {
        it('include records with non-null in that field', async () => {
          const reloaded = await Pet.leftJoinPreload('andAny_opsNotIn_arrayWithNull').firstOrFail()
          expect(reloaded.andAny_opsNotIn_arrayWithNull).toMatchDreamModels([redBalloon, greenBalloon])
        })
      })
    })

    context('an array with null and a non-null value', () => {
      it('matches records with null or the non-null value in the specified column', async () => {
        const reloaded = await Pet.leftJoinPreload('andAny_arrayWithNullAndRed').firstOrFail()
        expect(reloaded.andAny_arrayWithNullAndRed).toMatchDreamModels([noColorBalloon, redBalloon])
      })

      context('ops.in', () => {
        it('matches records with null or the non-null value in the specified column', async () => {
          const reloaded = await Pet.leftJoinPreload('andAny_opsIn_arrayWithNullAndRed').firstOrFail()
          expect(reloaded.andAny_opsIn_arrayWithNullAndRed).toMatchDreamModels([noColorBalloon, redBalloon])
        })
      })

      context('ops.not.in', () => {
        it('include records with non-null in that field that don’t match the non-null value', async () => {
          const reloaded = await Pet.leftJoinPreload('andAny_opsNotIn_arrayWithNullAndRed').firstOrFail()
          expect(reloaded.andAny_opsNotIn_arrayWithNullAndRed).toMatchDreamModels([greenBalloon])
        })
      })
    })

    context('an empty array', () => {
      it('returns no results', async () => {
        const reloaded = await Pet.leftJoinPreload('andAny_emptyArray').firstOrFail()
        expect(reloaded.andAny_emptyArray).toMatchDreamModels([])
      })

      context('ops.in', () => {
        it('returns no results', async () => {
          const reloaded = await Pet.leftJoinPreload('andAny_opsIn_emptyArray').firstOrFail()
          expect(reloaded.andAny_opsIn_emptyArray).toMatchDreamModels([])
        })
      })

      context('ops.not.in ', () => {
        it('returns results as if the array whereNot clause were not present', async () => {
          const reloaded = await Pet.leftJoinPreload('andAny_opsNotIn_emptyArray').firstOrFail()
          expect(reloaded.andAny_opsNotIn_emptyArray).toMatchDreamModels([
            redBalloon,
            greenBalloon,
            noColorBalloon,
          ])
        })
      })
    })

    context('a null value', () => {
      it('matches records with null in the specified column', async () => {
        const reloaded = await Pet.leftJoinPreload('andAny_null').firstOrFail()
        expect(reloaded.andAny_null).toMatchDreamModels([noColorBalloon])
      })

      context('ops.equal ', () => {
        it('matches records with null in the specified column', async () => {
          const reloaded = await Pet.leftJoinPreload('andAny_opsEqual_null').firstOrFail()
          expect(reloaded.andAny_opsEqual_null).toMatchDreamModels([noColorBalloon])
        })
      })

      context('ops.not.equal', () => {
        it('include records with non-null in that field', async () => {
          const reloaded = await Pet.leftJoinPreload('andAny_opsNotEqual_null').firstOrFail()
          expect(reloaded.andAny_opsNotEqual_null).toMatchDreamModels([redBalloon, greenBalloon])
        })
      })
    })
  })
})
