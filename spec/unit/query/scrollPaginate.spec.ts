import CannotPaginateWithLeftJoinPreload from '../../../src/errors/pagination/CannotPaginateWithLeftJoinPreload.js'
import CannotPaginateWithLimit from '../../../src/errors/pagination/CannotPaginateWithLimit.js'
import CannotPaginateWithOffset from '../../../src/errors/pagination/CannotPaginateWithOffset.js'
import Composition from '../../../test-app/app/models/Composition.js'
import Pet from '../../../test-app/app/models/Pet.js'
import User from '../../../test-app/app/models/User.js'

describe('Query#scrollPaginate', () => {
  let snoopy: Pet
  let woodstock: Pet
  let aster: Pet

  beforeEach(async () => {
    snoopy = await Pet.create({ name: 'Snoopy' })
    woodstock = await Pet.create({ name: 'Woodstock' })
    aster = await Pet.create({ name: 'Aster' })
  })

  it('returns a single page of results, ordered by primary key', async () => {
    const results = await Pet.query().scrollPaginate({ pageSize: 2, cursor: undefined })
    expect(results).toEqual({
      cursor: woodstock.id,
      results: [expect.toMatchDreamModel(snoopy), expect.toMatchDreamModel(woodstock)],
    })
  })

  context('soft-deleted records', () => {
    it('are omitted from the results', async () => {
      await woodstock.destroy()
      const results = await Pet.query().scrollPaginate({ pageSize: 2, cursor: undefined })
      expect(results).toEqual({
        cursor: aster.id,
        results: [expect.toMatchDreamModel(snoopy), expect.toMatchDreamModel(aster)],
      })
    })
  })

  context('passed cursor that is the primary key of a record', () => {
    it('includes records higher in the sort order than that record', async () => {
      const results = await Pet.query().scrollPaginate({ pageSize: 2, cursor: snoopy.id })
      expect(results).toEqual({
        cursor: aster.id,
        results: [expect.toMatchDreamModel(woodstock), expect.toMatchDreamModel(aster)],
      })
    })

    context('when the record corresponding to the cursor has been soft-deleted', () => {
      it('includes records higher in the sort order than that record', async () => {
        await snoopy.destroy()
        const results = await Pet.query().scrollPaginate({ pageSize: 2, cursor: snoopy.id })
        expect(results).toEqual({
          cursor: aster.id,
          results: [expect.toMatchDreamModel(woodstock), expect.toMatchDreamModel(aster)],
        })
      })
    })
  })

  context('when the results are fewer than a page size', () => {
    it('cursor is null', async () => {
      const results = await Pet.query().scrollPaginate({ pageSize: 2, cursor: woodstock.id })
      expect(results).toEqual({
        cursor: null,
        results: [expect.toMatchDreamModel(aster)],
      })
    })
  })

  context('a query ordered—ascending—by a non-primary key field', () => {
    it('cursor and results respect the order', async () => {
      const results = await Pet.query().order('name').scrollPaginate({ pageSize: 2, cursor: undefined })
      expect(results).toEqual({
        cursor: snoopy.id,
        results: [expect.toMatchDreamModel(aster), expect.toMatchDreamModel(snoopy)],
      })
    })

    context('passed cursor that is the primary key of a record', () => {
      it('includes records higher in the sort order than that record', async () => {
        const results = await Pet.query().order('name').scrollPaginate({ pageSize: 2, cursor: snoopy.id })
        expect(results).toEqual({
          cursor: null,
          results: [expect.toMatchDreamModel(woodstock)],
        })
      })

      context('when the record corresponding to the cursor has been soft-deleted', () => {
        it('includes records higher in the sort order than that record', async () => {
          await snoopy.destroy()
          const results = await Pet.query().order('name').scrollPaginate({ pageSize: 2, cursor: snoopy.id })
          expect(results).toEqual({
            cursor: null,
            results: [expect.toMatchDreamModel(woodstock)],
          })
        })
      })

      context('when the record corresponding to the cursor has been deleted', () => {
        it('treats it as if the cursor were undefined', async () => {
          await snoopy.reallyDestroy()
          const results = await Pet.query().order('name').scrollPaginate({ pageSize: 2, cursor: snoopy.id })
          expect(results).toEqual({
            cursor: woodstock.id,
            results: [expect.toMatchDreamModel(aster), expect.toMatchDreamModel(woodstock)],
          })
        })
      })
    })

    context('when the field is not unique', () => {
      it('includes the primary key as a fallback sort so that no records are missed and no records are repeated', async () => {
        const snoopy2 = await Pet.create({ name: 'Snoopy' })

        const results = await Pet.query()
          .order({ name: 'asc' })
          .scrollPaginate({ pageSize: 2, cursor: undefined })
        expect(results).toEqual({
          cursor: snoopy.id,
          results: [expect.toMatchDreamModel(aster), expect.toMatchDreamModel(snoopy)],
        })

        const results2 = await Pet.query()
          .order({ name: 'asc' })
          .scrollPaginate({ pageSize: 2, cursor: snoopy.id })
        expect(results2).toEqual({
          cursor: woodstock.id,
          results: [expect.toMatchDreamModel(snoopy2), expect.toMatchDreamModel(woodstock)],
        })
      })
    })

    context('when the field is the primary key of a joined association', () => {
      it('includes the primary key of the model being paginated as a fallback sort so that no records are missed and no records are repeated', async () => {
        const snoopy2 = await Pet.create({ name: 'Snoopy' })

        const user = await User.create({ email: 'a@b.com', password: 's3cr3t' })
        await aster.update({ user })
        await snoopy.update({ user })
        await snoopy2.update({ user })
        await woodstock.update({ user })

        const results = await Pet.query()
          .leftJoin('user')
          .order({ 'pets.name': 'asc', 'user.id': 'asc' })
          .scrollPaginate({ pageSize: 2, cursor: undefined })
        expect(results).toEqual({
          cursor: snoopy.id,
          results: [expect.toMatchDreamModel(aster), expect.toMatchDreamModel(snoopy)],
        })

        const results2 = await Pet.query()
          .leftJoin('user')
          .order({ 'pets.name': 'asc', 'user.id': 'asc' })
          .scrollPaginate({ pageSize: 2, cursor: snoopy.id })
        expect(results2).toEqual({
          cursor: woodstock.id,
          results: [expect.toMatchDreamModel(snoopy2), expect.toMatchDreamModel(woodstock)],
        })
      })
    })
  })

  context('a query ordered—descending—by a non-primary key field', () => {
    it('cursor and results respect the order', async () => {
      const results = await Pet.query()
        .order({ name: 'desc' })
        .scrollPaginate({ pageSize: 2, cursor: undefined })
      expect(results).toEqual({
        cursor: snoopy.id,
        results: [expect.toMatchDreamModel(woodstock), expect.toMatchDreamModel(snoopy)],
      })
    })

    context('passed cursor that is the primary key of a record', () => {
      it('includes records higher in the sort order than that record', async () => {
        const results = await Pet.query()
          .order({ name: 'desc' })
          .scrollPaginate({ pageSize: 2, cursor: snoopy.id })
        expect(results).toEqual({
          cursor: null,
          results: [expect.toMatchDreamModel(aster)],
        })
      })
    })

    context('when the field is not unique', () => {
      it('includes the primary key as a fallback sort so that no records are missed and no records are repeated', async () => {
        const snoopy2 = await Pet.create({ name: 'Snoopy' })

        const results = await Pet.query()
          .order({ name: 'desc' })
          .scrollPaginate({ pageSize: 2, cursor: undefined })
        expect(results).toEqual({
          cursor: snoopy.id,
          results: [expect.toMatchDreamModel(woodstock), expect.toMatchDreamModel(snoopy)],
        })

        const results2 = await Pet.query()
          .order({ name: 'desc' })
          .scrollPaginate({ pageSize: 2, cursor: snoopy.id })
        expect(results2).toEqual({
          cursor: aster.id,
          results: [expect.toMatchDreamModel(snoopy2), expect.toMatchDreamModel(aster)],
        })
      })
    })
  })

  context('paginating an association with an order defined on the association', () => {
    it('actually does order by column defined on the association', async () => {
      const user = await User.create({ email: 'fred@fred', password: 'howyadoin' })
      const composition1 = await Composition.create({ user, content: 'a' })
      const composition3 = await Composition.create({ user, content: 'a' })
      const composition4 = await Composition.create({ user, content: 'b' })
      const composition2 = await Composition.create({ user, content: 'b' })

      const { results } = await user
        .associationQuery('sortedCompositions')
        .scrollPaginate({ cursor: undefined })

      expect(results[0]).toMatchDreamModel(composition3)
      expect(results[1]).toMatchDreamModel(composition1)
      expect(results[2]).toMatchDreamModel(composition2)
      expect(results[3]).toMatchDreamModel(composition4)
    })
  })

  context('when a limit is applied to the query', () => {
    it('throws an exception', async () => {
      await expect(async () => {
        await User.limit(100).scrollPaginate({ pageSize: 2, cursor: undefined } as any)
      }).rejects.toThrow(CannotPaginateWithLimit)
    })
  })

  context('when an offset is applied to the query', () => {
    it('throws an exception', async () => {
      await expect(async () => {
        await User.offset(100).scrollPaginate({ pageSize: 2, cursor: undefined } as any)
      }).rejects.toThrow(CannotPaginateWithOffset)
    })
  })

  context('when a leftJoinPreload is applied to the query', () => {
    it('throws an exception', async () => {
      await expect(async () => {
        await User.leftJoinPreloadFor('default').scrollPaginate({ pageSize: 2, cursor: undefined } as any)
      }).rejects.toThrow(CannotPaginateWithLeftJoinPreload)
    })
  })
})
