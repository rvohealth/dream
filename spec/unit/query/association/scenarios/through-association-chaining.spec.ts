import A from '../../../../../test-app/app/models/Through/A.js'
import AToOtherModelJoinModel from '../../../../../test-app/app/models/Through/AToOtherModelJoinModel.js'
import B from '../../../../../test-app/app/models/Through/B.js'
import MyModel from '../../../../../test-app/app/models/Through/MyModel.js'
import OtherModel from '../../../../../test-app/app/models/Through/OtherModel.js'

describe('through association chaining', () => {
  context('chaining through another model to yet another model', () => {
    it('carry through to the source association on another model', async () => {
      const myModel = await MyModel.create({ name: 'My model' })
      const otherModel = await OtherModel.create({ name: 'Other model', myModel })
      const a = await A.create({ name: 'A' })
      const b = await B.create({ name: 'B', a })
      await AToOtherModelJoinModel.create({ a, otherModel })

      const associatedA = await myModel.associationQuery('myA').first()
      expect(associatedA).toMatchDreamModel(a)

      const associatedB = await myModel.associationQuery('myB').first()
      expect(associatedB).toMatchDreamModel(b)
    })
  })

  context('conditions on a through association with a source that is itself a through association', () => {
    it('applies the conditions to the join of the table the through association targets', async () => {
      const myModel = await MyModel.create({ name: 'My model' })
      const otherModel = await OtherModel.create({ name: 'Other model', myModel })
      const a = await A.create({ name: 'A' })
      await B.create({ name: 'B', a })
      await AToOtherModelJoinModel.create({ a, otherModel })
      const beautifulA = await A.create({ name: 'Beautiful A' })
      const beautifulB = await B.create({ name: 'B2', a: beautifulA })
      await AToOtherModelJoinModel.create({ a: beautifulA, otherModel })

      const associatedA = await myModel.associationQuery('myConditionalA').first()
      expect(associatedA).toMatchDreamModel(beautifulA)

      const associatedBs = await myModel.associationQuery('myConditionalB').all()
      expect(associatedBs).toMatchDreamModels([beautifulB])
    })
  })

  context('options on a through association whose source is itself a through association', () => {
    let myModel: MyModel

    beforeEach(async () => {
      myModel = await MyModel.create({ name: 'My model' })
    })

    context('and', () => {
      it('applies the and clause when loading the association directly', async () => {
        const beautifulA = await createAReachableFrom(myModel, 'Beautiful A')
        await createAReachableFrom(myModel, 'Plain A')

        const as = await myModel.associationQuery('myAndA').all()
        expect(as).toMatchDreamModels([beautifulA])
      })

      it('applies the and clause when bridged by a further through association', async () => {
        const beautifulA = await createAReachableFrom(myModel, 'Beautiful A')
        const plainA = await createAReachableFrom(myModel, 'Plain A')
        const beautifulB = await B.create({ name: 'B of beautiful A', a: beautifulA })
        await B.create({ name: 'B of plain A', a: plainA })

        const bs = await myModel.associationQuery('myAndB').all()
        expect(bs).toMatchDreamModels([beautifulB])
      })
    })

    context('andAny', () => {
      it('applies the andAny clause when loading the association directly', async () => {
        const beautifulA = await createAReachableFrom(myModel, 'Beautiful A')
        const gorgeousA = await createAReachableFrom(myModel, 'Gorgeous A')
        await createAReachableFrom(myModel, 'Plain A')

        const as = await myModel.associationQuery('myAndAnyA').all()
        expect(as).toMatchDreamModels([beautifulA, gorgeousA])
      })

      it('applies the andAny clause when bridged by a further through association', async () => {
        const beautifulA = await createAReachableFrom(myModel, 'Beautiful A')
        const gorgeousA = await createAReachableFrom(myModel, 'Gorgeous A')
        const plainA = await createAReachableFrom(myModel, 'Plain A')
        const beautifulB = await B.create({ name: 'B of beautiful A', a: beautifulA })
        const gorgeousB = await B.create({ name: 'B of gorgeous A', a: gorgeousA })
        await B.create({ name: 'B of plain A', a: plainA })

        const bs = await myModel.associationQuery('myAndAnyB').all()
        expect(bs).toMatchDreamModels([beautifulB, gorgeousB])
      })
    })

    context('andNot', () => {
      it('applies the andNot clause when loading the association directly', async () => {
        await createAReachableFrom(myModel, 'Forgettable A')
        const plainA = await createAReachableFrom(myModel, 'Plain A')

        const as = await myModel.associationQuery('myAndNotA').all()
        expect(as).toMatchDreamModels([plainA])
      })

      it('applies the andNot clause when bridged by a further through association', async () => {
        const forgettableA = await createAReachableFrom(myModel, 'Forgettable A')
        const plainA = await createAReachableFrom(myModel, 'Plain A')
        await B.create({ name: 'B of forgettable A', a: forgettableA })
        const plainB = await B.create({ name: 'B of plain A', a: plainA })

        const bs = await myModel.associationQuery('myAndNotB').all()
        expect(bs).toMatchDreamModels([plainB])
      })
    })

    context('selfAnd', () => {
      it('applies the selfAnd clause when loading the association directly', async () => {
        const matchingA = await createAReachableFrom(myModel, 'My model')
        await createAReachableFrom(myModel, 'Plain A')

        const as = await myModel.associationQuery('mySelfAndA').all()
        expect(as).toMatchDreamModels([matchingA])
      })

      it('applies the selfAnd clause when bridged by a further through association', async () => {
        const matchingA = await createAReachableFrom(myModel, 'My model')
        const plainA = await createAReachableFrom(myModel, 'Plain A')
        const matchingB = await B.create({ name: 'B of matching A', a: matchingA })
        await B.create({ name: 'B of plain A', a: plainA })

        const bs = await myModel.associationQuery('mySelfAndB').all()
        expect(bs).toMatchDreamModels([matchingB])
      })
    })

    context('selfAndNot', () => {
      it('applies the selfAndNot clause when loading the association directly', async () => {
        await createAReachableFrom(myModel, 'My model')
        const plainA = await createAReachableFrom(myModel, 'Plain A')

        const as = await myModel.associationQuery('mySelfAndNotA').all()
        expect(as).toMatchDreamModels([plainA])
      })

      it('applies the selfAndNot clause when bridged by a further through association', async () => {
        const matchingA = await createAReachableFrom(myModel, 'My model')
        const plainA = await createAReachableFrom(myModel, 'Plain A')
        await B.create({ name: 'B of matching A', a: matchingA })
        const plainB = await B.create({ name: 'B of plain A', a: plainA })

        const bs = await myModel.associationQuery('mySelfAndNotB').all()
        expect(bs).toMatchDreamModels([plainB])
      })
    })

    context('order', () => {
      it('applies the order clause when loading the association directly', async () => {
        const cA = await createAReachableFrom(myModel, 'c')
        const aA = await createAReachableFrom(myModel, 'a')
        const bA = await createAReachableFrom(myModel, 'b')

        const as = await myModel.associationQuery('myOrderedA').all()
        expect(as[0]).toMatchDreamModel(aA)
        expect(as[1]).toMatchDreamModel(bA)
        expect(as[2]).toMatchDreamModel(cA)
      })

      it('applies the order clause when bridged by a further through association', async () => {
        const cA = await createAReachableFrom(myModel, 'c')
        const aA = await createAReachableFrom(myModel, 'a')
        const bA = await createAReachableFrom(myModel, 'b')
        const cB = await B.create({ name: 'B of c', a: cA })
        const aB = await B.create({ name: 'B of a', a: aA })
        const bB = await B.create({ name: 'B of b', a: bA })

        const bs = await myModel.associationQuery('myOrderedB').all()
        expect(bs[0]).toMatchDreamModel(aB)
        expect(bs[1]).toMatchDreamModel(bB)
        expect(bs[2]).toMatchDreamModel(cB)
      })

      context('stacked order clauses', () => {
        it(
          'applies order clauses in join order: the bridged through association’s order first, ' +
            'the outer association’s own order last',
          async () => {
            const zebraA = await createAReachableFrom(myModel, 'Zebra A')
            const alphaA1 = await createAReachableFrom(myModel, 'Alpha A')
            const alphaA2 = await createAReachableFrom(myModel, 'Alpha A')
            const zzz = await B.create({ name: 'zzz', a: zebraA })
            const aaa = await B.create({ name: 'aaa', a: alphaA1 })
            const mmm = await B.create({ name: 'mmm', a: alphaA2 })

            // myStackOrderedB orders by name descending through myOrderedA, which
            // orders by name ascending; A-name ascending dominates (Alpha before
            // Zebra), and B-name descending breaks the tie between the two Alpha As
            const bs = await myModel.associationQuery('myStackOrderedB').all()
            expect(bs[0]).toMatchDreamModel(mmm)
            expect(bs[1]).toMatchDreamModel(aaa)
            expect(bs[2]).toMatchDreamModel(zzz)
          }
        )
      })
    })

    context('distinct', () => {
      it('applies the distinct clause when loading the association directly', async () => {
        const a = await createAReachableFrom(myModel, 'Shared A')
        await attachAToNewOtherModel(myModel, a)

        const duplicatedAs = await myModel.associationQuery('myA').all()
        expect(duplicatedAs).toMatchDreamModels([a, a])

        const as = await myModel.associationQuery('myDistinctA').all()
        expect(as).toMatchDreamModels([a])
      })

      it('applies the distinct clause when bridged by a further through association', async () => {
        const a = await createAReachableFrom(myModel, 'Shared A')
        await attachAToNewOtherModel(myModel, a)
        const b = await B.create({ name: 'B of shared A', a })

        const duplicatedBs = await myModel.associationQuery('myB').all()
        expect(duplicatedBs).toMatchDreamModels([b, b])

        const bs = await myModel.associationQuery('myDistinctB').all()
        expect(bs).toMatchDreamModels([b])
      })
    })
  })
})

async function createAReachableFrom(myModel: MyModel, name: string): Promise<A> {
  const otherModel = await OtherModel.create({ name: 'Other model', myModel })
  const a = await A.create({ name })
  await AToOtherModelJoinModel.create({ a, otherModel })
  return a
}

async function attachAToNewOtherModel(myModel: MyModel, a: A): Promise<void> {
  const otherModel = await OtherModel.create({ name: 'Other model', myModel })
  await AToOtherModelJoinModel.create({ a, otherModel })
}
