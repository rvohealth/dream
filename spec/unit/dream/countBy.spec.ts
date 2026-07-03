import ApplicationModel from '../../../test-app/app/models/ApplicationModel.js'
import Pet from '../../../test-app/app/models/Pet.js'

describe('Dream.countBy', () => {
  it('groups the count for all records of a model', async () => {
    await Pet.create({ species: 'cat' })
    await Pet.create({ species: 'cat' })
    await Pet.create({ species: 'dog' })
    await Pet.create()

    const result = await Pet.countBy('species')
    expect(result).toEqual(
      new Map<string | null, number>([
        ['cat', 2],
        ['dog', 1],
        [null, 1],
      ])
    )
  })

  context('with no records', () => {
    it('returns an empty Map', async () => {
      const result = await Pet.countBy('species')
      expect(result).toEqual(new Map())
    })
  })

  context('when passed a transaction', () => {
    it('reports accurate grouped counts (builder path)', async () => {
      await Pet.create({ species: 'cat' })

      await ApplicationModel.transaction(async txn => {
        await Pet.txn(txn).create({ species: 'cat' })
        await Pet.txn(txn).create({ species: 'dog' })

        const result = await Pet.txn(txn).countBy('species')
        expect(result).toEqual(
          new Map<string | null, number>([
            ['cat', 2],
            ['dog', 1],
          ])
        )
      })
    })
  })
})
