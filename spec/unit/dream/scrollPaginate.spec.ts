import Pet from '../../../test-app/app/models/Pet.js'

describe('Dream.scrollPaginate', () => {
  let snoopy: Pet
  let woodstock: Pet
  let aster: Pet

  beforeEach(async () => {
    snoopy = await Pet.create({ name: 'Snoopy' })
    woodstock = await Pet.create({ name: 'Woodstock' })
    aster = await Pet.create({ name: 'Aster' })
  })

  it('returns a single page of results, ordered by primary key', async () => {
    const results = await Pet.scrollPaginate({ pageSize: 2, cursor: undefined })
    expect(results).toEqual({
      cursor: woodstock.id,
      results: [expect.toMatchDreamModel(snoopy), expect.toMatchDreamModel(woodstock)],
    })
  })

  context('passed cursor that is the primary key of a record', () => {
    it('includes records higher in the sort order than that record', async () => {
      const results = await Pet.scrollPaginate({ pageSize: 2, cursor: snoopy.id })
      expect(results).toEqual({
        cursor: aster.id,
        results: [expect.toMatchDreamModel(woodstock), expect.toMatchDreamModel(aster)],
      })
    })
  })

  context('when the results are fewer than a page size', () => {
    it('cursor is null', async () => {
      const results = await Pet.scrollPaginate({ pageSize: 2, cursor: woodstock.id })
      expect(results).toEqual({
        cursor: null,
        results: [expect.toMatchDreamModel(aster)],
      })
    })
  })
})
