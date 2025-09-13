import CannotPaginateWithLimit from '../../../src/errors/pagination/CannotPaginateWithLimit.js'
import CannotPaginateWithOffset from '../../../src/errors/pagination/CannotPaginateWithOffset.js'
import { DreamApp } from '../../../src/index.js'
import { PaginatedDreamQueryResult } from '../../../src/types/query.js'
import ApplicationModel from '../../../test-app/app/models/ApplicationModel.js'
import User from '../../../test-app/app/models/User.js'

describe('Dream.paginate', () => {
  let user1: User
  let user2: User
  let user3: User
  let user4: User

  beforeEach(async () => {
    user2 = await User.create({
      email: 'b@bbbb',
      password: 'howyadoin',
    })
    user3 = await User.create({
      email: 'c@cccc',
      password: 'howyadoin',
    })
    user4 = await User.create({
      email: 'd@dddd',
      password: 'howyadoin',
    })
    user1 = await User.create({
      email: 'a@aaaa',
      password: 'howyadoin',
    })
  })

  context('without an explicit order', () => {
    it('orders by primary key', async () => {
      const results = await User.paginate({ pageSize: 2, page: 1 })

      expect(results).toEqual({
        recordCount: 4,
        pageCount: 2,
        currentPage: 1,
        results: [expect.toMatchDreamModel(user2), expect.toMatchDreamModel(user3)],
      })
    })
  })

  context('with an explicit order', () => {
    it('paginates the records by the explicit order', async () => {
      const results = await User.order({ email: 'asc' }).paginate({ pageSize: 2, page: 1 })

      expect(results).toEqual({
        recordCount: 4,
        pageCount: 2,
        currentPage: 1,
        results: [expect.toMatchDreamModel(user1), expect.toMatchDreamModel(user2)],
      })
    })
  })

  context('in a transaction', () => {
    it('enables pagination', async () => {
      let res: PaginatedDreamQueryResult<User>
      let user: User

      await ApplicationModel.transaction(async txn => {
        user = await User.txn(txn).create({ email: 'how@yadoin', password: 'howyadoin' })
        res = await User.order('email').txn(txn).paginate({ pageSize: 4, page: 2 })
      })

      expect(res!).toEqual({
        currentPage: 2,
        pageCount: 2,
        recordCount: 5,
        results: [expect.toMatchDreamModel(user!)],
      })
    })
  })

  context('page', () => {
    context('page 2', () => {
      it('delivers page 2 results', async () => {
        const results = await User.order('email').paginate({ pageSize: 2, page: 2 })
        expect(results).toEqual({
          recordCount: 4,
          pageCount: 2,
          currentPage: 2,
          results: [expect.toMatchDreamModel(user3), expect.toMatchDreamModel(user4)],
        })
      })
    })

    context('page 0', () => {
      it('delivers page 1 results', async () => {
        const results = await User.order('email').paginate({ pageSize: 2, page: 0 })
        expect(results).toEqual({
          recordCount: 4,
          pageCount: 2,
          currentPage: 1,
          results: [expect.toMatchDreamModel(user1), expect.toMatchDreamModel(user2)],
        })
      })
    })

    context('page null', () => {
      it('delivers page 1 results', async () => {
        const results = await User.order('email').paginate({ pageSize: 2, page: null })
        expect(results).toEqual({
          recordCount: 4,
          pageCount: 2,
          currentPage: 1,
          results: [expect.toMatchDreamModel(user1), expect.toMatchDreamModel(user2)],
        })
      })
    })

    context('page undefined', () => {
      it('delivers page 1 results', async () => {
        const results = await User.order('email').paginate({ pageSize: 2, page: undefined })
        expect(results).toEqual({
          recordCount: 4,
          pageCount: 2,
          currentPage: 1,
          results: [expect.toMatchDreamModel(user1), expect.toMatchDreamModel(user2)],
        })
      })
    })
  })

  context('when a limit is applied to the query', () => {
    it('throws an exception', async () => {
      await expect(async () => {
        await User.limit(100).paginate({ pageSize: 2, page: 1 } as any)
      }).rejects.toThrow(CannotPaginateWithLimit)
    })
  })

  context('when an offset is applied to the query', () => {
    it('throws an exception', async () => {
      await expect(async () => {
        await User.offset(100).paginate({ pageSize: 2, page: 1 } as any)
      }).rejects.toThrow(CannotPaginateWithOffset)
    })
  })

  context('pageSize', () => {
    it('delivers result count based on pageSize', async () => {
      const results = await User.order('email').paginate({ pageSize: 4, page: 1 })
      expect(results).toEqual({
        recordCount: 4,
        pageCount: 1,
        currentPage: 1,
        results: [
          expect.toMatchDreamModel(user1),
          expect.toMatchDreamModel(user2),
          expect.toMatchDreamModel(user3),
          expect.toMatchDreamModel(user4),
        ],
      })
    })

    context('when pageSize unevenly divides records', () => {
      it('returns remaining records in final page', async () => {
        const page1Results = await User.order('email').paginate({ pageSize: 3, page: 1 })
        expect(page1Results).toEqual({
          recordCount: 4,
          pageCount: 2,
          currentPage: 1,
          results: [
            expect.toMatchDreamModel(user1),
            expect.toMatchDreamModel(user2),
            expect.toMatchDreamModel(user3),
          ],
        })

        const page2Results = await User.order('email').paginate({ pageSize: 3, page: 2 })
        expect(page2Results).toEqual({
          recordCount: 4,
          pageCount: 2,
          currentPage: 2,
          results: [expect.toMatchDreamModel(user4)],
        })
      })
    })

    context('when pageSize is not specified', () => {
      beforeEach(async () => {
        await Promise.all(
          [...Array(25).keys()].map((_, i) =>
            User.create({ email: `anotheremail${i}@a`, password: 'howyadoin' })
          )
        )
      })

      it('defaults to the default page size', async () => {
        const page1Results = await User.order('email').paginate({ page: 1 })
        expect(page1Results.recordCount).toEqual(29)
        expect(page1Results.currentPage).toEqual(1)
        expect(page1Results.pageCount).toEqual(2)
        expect(page1Results.results.length).toEqual(25)
      })

      context('when the user overrides the default page size', () => {
        let originalPageSize: number
        beforeEach(() => {
          const dreamApp = DreamApp.getOrFail()
          originalPageSize = dreamApp.paginationPageSize
          dreamApp.set('paginationPageSize', 5)
        })

        afterEach(() => {
          const dreamApp = DreamApp.getOrFail()
          dreamApp.set('paginationPageSize', originalPageSize)
        })

        it('factors in the custom default', async () => {
          const page1Results = await User.order('email').paginate({ page: 1 })
          expect(page1Results.recordCount).toEqual(29)
          expect(page1Results.currentPage).toEqual(1)
          expect(page1Results.pageCount).toEqual(6)
          expect(page1Results.results.length).toEqual(5)
        })
      })
    })
  })
})
