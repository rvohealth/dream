import Pet from '../../../test-app/app/models/Pet.js'

describe('Dream.cursorPaginate', () => {
  let snoopy: Pet
  let woodstock: Pet
  let aster: Pet

  beforeEach(async () => {
    snoopy = await Pet.create({ name: 'Snoopy' })
    woodstock = await Pet.create({ name: 'Woodstock' })
    aster = await Pet.create({ name: 'Aster' })
  })

  it('returns a single page of results, reverse-ordered by primary key', async () => {
    const results = await Pet.cursorPaginate({ pageSize: 2, cursor: undefined })
    expect(results).toEqual({
      cursor: woodstock.id,
      results: [expect.toMatchDreamModel(aster), expect.toMatchDreamModel(woodstock)],
    })
  })

  context('passed cursor that is the primary key of a record', () => {
    it('includes records higher in the sort order than that record', async () => {
      const results = await Pet.cursorPaginate({ pageSize: 2, cursor: aster.id })
      expect(results).toEqual({
        cursor: snoopy.id,
        results: [expect.toMatchDreamModel(woodstock), expect.toMatchDreamModel(snoopy)],
      })
    })
  })

  context('when the results are fewer than a page size', () => {
    it('cursor is null', async () => {
      const results = await Pet.cursorPaginate({ pageSize: 2, cursor: woodstock.id })
      expect(results).toEqual({
        cursor: null,
        results: [expect.toMatchDreamModel(snoopy)],
      })
    })
  })
})
