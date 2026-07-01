import DreamApp from '../../../src/dream-app/index.js'
import Pet from '../../../test-app/app/models/Pet.js'

describe('pagination max page size (paginationMaxPageSize)', () => {
  let originalMaxPageSize: number

  beforeEach(() => {
    originalMaxPageSize = DreamApp.getOrFail().paginationMaxPageSize
  })

  afterEach(() => {
    DreamApp.getOrFail().set('paginationMaxPageSize', originalMaxPageSize)
  })

  it('defaults to a maximum page size of 200', () => {
    expect(DreamApp.getOrFail().paginationMaxPageSize).toEqual(200)
  })

  context('with more records than the configured maximum page size', () => {
    // A small fixture is sufficient to prove the clamp: we lower
    // paginationMaxPageSize to a small value rather than inserting 200+ rows.
    // The larger fixture contended for locks on the shared `pets` table and
    // deadlocked under sharded CI runs.
    beforeEach(async () => {
      await Promise.all([...Array(4).keys()].map(i => Pet.create({ name: `pet${i}` })))
    })

    context('with a small configured maximum (3)', () => {
      beforeEach(() => {
        DreamApp.getOrFail().set('paginationMaxPageSize', 3)
      })

      it('paginate clamps an over-large pageSize to the configured maximum', async () => {
        const results = await Pet.query().paginate({ pageSize: 100000, page: 1 })
        expect(results.results.length).toEqual(3)
        // ceil(4 / 3)
        expect(results.pageCount).toEqual(2)
      })

      it('cursorPaginate clamps an over-large pageSize to the configured maximum', async () => {
        const results = await Pet.query().cursorPaginate({ pageSize: 100000, cursor: undefined })
        expect(results.results.length).toEqual(3)
      })

      it('scrollPaginate clamps an over-large pageSize to the configured maximum', async () => {
        const results = await Pet.query().scrollPaginate({ pageSize: 100000, cursor: undefined })
        expect(results.results.length).toEqual(3)
      })
    })

    context('when paginationMaxPageSize is lowered to 2', () => {
      beforeEach(() => {
        DreamApp.getOrFail().set('paginationMaxPageSize', 2)
      })

      it('paginate clamps to the lowered maximum', async () => {
        const results = await Pet.query().paginate({ pageSize: 100000, page: 1 })
        expect(results.results.length).toEqual(2)
        // ceil(4 / 2)
        expect(results.pageCount).toEqual(2)
      })

      it('cursorPaginate clamps to the lowered maximum', async () => {
        const results = await Pet.query().cursorPaginate({ pageSize: 100000, cursor: undefined })
        expect(results.results.length).toEqual(2)
      })

      it('scrollPaginate clamps to the lowered maximum', async () => {
        const results = await Pet.query().scrollPaginate({ pageSize: 100000, cursor: undefined })
        expect(results.results.length).toEqual(2)
      })
    })

    context('when paginationMaxPageSize is raised above the record count', () => {
      beforeEach(() => {
        DreamApp.getOrFail().set('paginationMaxPageSize', 1000)
      })

      it('paginate honors a pageSize larger than the record count', async () => {
        const results = await Pet.query().paginate({ pageSize: 100000, page: 1 })
        expect(results.results.length).toEqual(4)
        expect(results.pageCount).toEqual(1)
      })

      it('cursorPaginate honors a pageSize larger than the record count', async () => {
        const results = await Pet.query().cursorPaginate({ pageSize: 100000, cursor: undefined })
        expect(results.results.length).toEqual(4)
      })

      it('scrollPaginate honors a pageSize larger than the record count', async () => {
        const results = await Pet.query().scrollPaginate({ pageSize: 100000, cursor: undefined })
        expect(results.results.length).toEqual(4)
      })
    })
  })
})
