import Latex from '../../../../../test-app/app/models/Balloon/Latex'
import Pet from '../../../../../test-app/app/models/Pet'

describe('where clauses on associations (also see various specs in spec/unit/query)', () => {
  context('where', () => {
    it('properly applies the where clause', async () => {
      const pet = await Pet.create()
      const redBalloon = await Latex.create({ color: 'red' })
      const greenBalloon = await Latex.create({ color: 'green' })
      const blueBalloon = await Latex.create({ color: 'blue' })

      await pet.createAssociation('collars', { balloon: redBalloon })
      await pet.createAssociation('collars', { balloon: greenBalloon })
      await pet.createAssociation('collars', { balloon: blueBalloon })

      const reloaded = await Pet.leftJoinPreload('redBalloons').firstOrFail()
      expect(reloaded.redBalloons).toMatchDreamModels([redBalloon])
    })

    context('negated', () => {
      it('properly applies the whereNot clause', async () => {
        const pet = await Pet.create()
        const redBalloon = await Latex.create({ color: 'red' })
        const greenBalloon = await Latex.create({ color: 'green' })
        const blueBalloon = await Latex.create({ color: 'blue' })

        await pet.createAssociation('collars', { balloon: redBalloon })
        await pet.createAssociation('collars', { balloon: greenBalloon })
        await pet.createAssociation('collars', { balloon: blueBalloon })

        const reloaded = await Pet.leftJoinPreload('redBalloonsNegated').firstOrFail()
        expect(reloaded.redBalloonsNegated).toMatchDreamModels([greenBalloon, blueBalloon])
      })
    })
  })

  context('whereNot', () => {
    it('properly applies the whereNot clause', async () => {
      const pet = await Pet.create()
      const redBalloon = await Latex.create({ color: 'red' })
      const greenBalloon = await Latex.create({ color: 'green' })
      const blueBalloon = await Latex.create({ color: 'blue' })

      await pet.createAssociation('collars', { balloon: redBalloon })
      await pet.createAssociation('collars', { balloon: greenBalloon })
      await pet.createAssociation('collars', { balloon: blueBalloon })

      const reloaded = await Pet.leftJoinPreload('notRedBalloons').firstOrFail()
      expect(reloaded.notRedBalloons).toMatchDreamModels([greenBalloon, blueBalloon])
    })

    context('negated', () => {
      it('properly applies the where clause', async () => {
        const pet = await Pet.create()
        const redBalloon = await Latex.create({ color: 'red' })
        const greenBalloon = await Latex.create({ color: 'green' })
        const blueBalloon = await Latex.create({ color: 'blue' })

        await pet.createAssociation('collars', { balloon: redBalloon })
        await pet.createAssociation('collars', { balloon: greenBalloon })
        await pet.createAssociation('collars', { balloon: blueBalloon })

        const reloaded = await Pet.leftJoinPreload('notRedBalloonsNegated').firstOrFail()
        expect(reloaded.notRedBalloonsNegated).toMatchDreamModels([redBalloon])
      })
    })
  })

  context('where in an array', () => {
    it('properly applies the array clause', async () => {
      const pet = await Pet.create()
      const redBalloon = await Latex.create({ color: 'red' })
      const greenBalloon = await Latex.create({ color: 'green' })
      const blueBalloon = await Latex.create({ color: 'blue' })

      await pet.createAssociation('collars', { balloon: redBalloon })
      await pet.createAssociation('collars', { balloon: greenBalloon })
      await pet.createAssociation('collars', { balloon: blueBalloon })

      const reloaded = await Pet.leftJoinPreload('redBalloonsWithArrayWhere').firstOrFail()
      expect(reloaded.redBalloonsWithArrayWhere).toMatchDreamModels([redBalloon])
    })

    context('when the array is empty', () => {
      it('returns no results', async () => {
        const pet = await Pet.create()
        const redBalloon = await Latex.create({ color: 'red' })
        const greenBalloon = await Latex.create({ color: 'green' })
        const blueBalloon = await Latex.create({ color: 'blue' })

        await pet.createAssociation('collars', { balloon: redBalloon })
        await pet.createAssociation('collars', { balloon: greenBalloon })
        await pet.createAssociation('collars', { balloon: blueBalloon })

        const reloaded = await Pet.leftJoinPreload('redBalloonsWithEmptyArrayWhere').firstOrFail()
        expect(reloaded.redBalloonsWithEmptyArrayWhere).toEqual([])
      })
    })

    context('negated (i.e.: where: ops.not.in)', () => {
      it('properly applies the array clause', async () => {
        const pet = await Pet.create()
        const redBalloon = await Latex.create({ color: 'red' })
        const greenBalloon = await Latex.create({ color: 'green' })
        const blueBalloon = await Latex.create({ color: 'blue' })

        await pet.createAssociation('collars', { balloon: redBalloon })
        await pet.createAssociation('collars', { balloon: greenBalloon })
        await pet.createAssociation('collars', { balloon: blueBalloon })

        const reloaded = await Pet.leftJoinPreload('redBalloonsWithArrayWhereNegated').firstOrFail()
        expect(reloaded.redBalloonsWithArrayWhereNegated).toMatchDreamModels([greenBalloon, blueBalloon])
      })

      context('when the array is empty', () => {
        it('returns results as if the array whereNot clause were not present', async () => {
          const pet = await Pet.create()
          const redBalloon = await Latex.create({ color: 'red' })
          const greenBalloon = await Latex.create({ color: 'green' })
          const blueBalloon = await Latex.create({ color: 'blue' })

          await pet.createAssociation('collars', { balloon: redBalloon })
          await pet.createAssociation('collars', { balloon: greenBalloon })
          await pet.createAssociation('collars', { balloon: blueBalloon })

          const reloaded = await Pet.leftJoinPreload('redBalloonsWithEmptyArrayWhereNegated').firstOrFail()
          expect(reloaded.redBalloonsWithEmptyArrayWhereNegated).toMatchDreamModels([
            redBalloon,
            greenBalloon,
            blueBalloon,
          ])
        })
      })
    })
  })

  context('whereNot in an array', () => {
    it('properly applies the array clause', async () => {
      const pet = await Pet.create()
      const redBalloon = await Latex.create({ color: 'red' })
      const greenBalloon = await Latex.create({ color: 'green' })
      const blueBalloon = await Latex.create({ color: 'blue' })

      await pet.createAssociation('collars', { balloon: redBalloon })
      await pet.createAssociation('collars', { balloon: greenBalloon })
      await pet.createAssociation('collars', { balloon: blueBalloon })

      const reloaded = await Pet.leftJoinPreload('notRedBalloonsWithArrayWhereNot').firstOrFail()
      expect(reloaded.notRedBalloonsWithArrayWhereNot).toMatchDreamModels([greenBalloon, blueBalloon])
    })

    context('when the array is empty', () => {
      it('returns results as if the array whereNot clause were not present', async () => {
        const pet = await Pet.create()
        const redBalloon = await Latex.create({ color: 'red' })
        const greenBalloon = await Latex.create({ color: 'green' })
        const blueBalloon = await Latex.create({ color: 'blue' })

        await pet.createAssociation('collars', { balloon: redBalloon })
        await pet.createAssociation('collars', { balloon: greenBalloon })
        await pet.createAssociation('collars', { balloon: blueBalloon })

        const reloaded = await Pet.leftJoinPreload('notRedBalloonsWithEmptyArrayWhereNot').firstOrFail()
        expect(reloaded.notRedBalloonsWithEmptyArrayWhereNot).toMatchDreamModels([
          redBalloon,
          greenBalloon,
          blueBalloon,
        ])
      })
    })

    context('negated (i.e.: whereNot: ops.not.in)', () => {
      it('properly applies the array clause', async () => {
        const pet = await Pet.create()
        const redBalloon = await Latex.create({ color: 'red' })
        const greenBalloon = await Latex.create({ color: 'green' })
        const blueBalloon = await Latex.create({ color: 'blue' })

        await pet.createAssociation('collars', { balloon: redBalloon })
        await pet.createAssociation('collars', { balloon: greenBalloon })
        await pet.createAssociation('collars', { balloon: blueBalloon })

        const reloaded = await Pet.leftJoinPreload('notRedBalloonsWithArrayWhereNotNegated').firstOrFail()
        expect(reloaded.notRedBalloonsWithArrayWhereNotNegated).toMatchDreamModels([redBalloon])
      })

      context('when the array is empty', () => {
        it('returns no results', async () => {
          const pet = await Pet.create()
          const redBalloon = await Latex.create({ color: 'red' })
          const greenBalloon = await Latex.create({ color: 'green' })
          const blueBalloon = await Latex.create({ color: 'blue' })

          await pet.createAssociation('collars', { balloon: redBalloon })
          await pet.createAssociation('collars', { balloon: greenBalloon })
          await pet.createAssociation('collars', { balloon: blueBalloon })

          const reloaded = await Pet.leftJoinPreload(
            'notRedBalloonsWithEmptyArrayWhereNotNegated'
          ).firstOrFail()
          expect(reloaded.notRedBalloonsWithEmptyArrayWhereNotNegated).toEqual([])
        })
      })
    })
  })
})
