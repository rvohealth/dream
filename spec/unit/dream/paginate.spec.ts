import User from '../../../test-app/app/models/User.js'

describe('Dream.paginate', () => {
  let user1: User
  let user2: User
  let user3: User
  let user4: User

  beforeEach(async () => {
    user4 = await User.create({
      email: 'a@aaaaa',
      password: 'howyadoin',
    })
    user3 = await User.create({
      email: 'b@bbbbb',
      password: 'howyadoin',
    })
    user2 = await User.create({
      email: 'c@ccccc',
      password: 'howyadoin',
    })
    user1 = await User.create({
      email: 'd@ddddd',
      password: 'howyadoin',
    })
  })

  it('paginates the records, reverse-ordered by primary key', async () => {
    const results = await User.paginate({ pageSize: 2, page: 1 })

    expect(results).toEqual({
      recordCount: 4,
      pageCount: 2,
      currentPage: 1,
      results: [expect.toMatchDreamModel(user1), expect.toMatchDreamModel(user2)],
    })
  })

  context('page 2', () => {
    it('delivers page 2 results', async () => {
      const results = await User.paginate({ pageSize: 2, page: 2 })
      expect(results).toEqual({
        recordCount: 4,
        pageCount: 2,
        currentPage: 2,
        results: [expect.toMatchDreamModel(user3), expect.toMatchDreamModel(user4)],
      })
    })
  })

  context('pageSize', () => {
    it('delivers result count based on pageSize', async () => {
      const results = await User.paginate({ pageSize: 4, page: 1 })
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
        const page1Results = await User.paginate({ pageSize: 3, page: 1 })
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

        const page2Results = await User.paginate({ pageSize: 3, page: 2 })
        expect(page2Results).toEqual({
          recordCount: 4,
          pageCount: 2,
          currentPage: 2,
          results: [expect.toMatchDreamModel(user4)],
        })
      })
    })
  })
})
