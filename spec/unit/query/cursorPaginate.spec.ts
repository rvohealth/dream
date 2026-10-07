import CannotPaginateWithLeftJoinPreload from '../../../src/errors/pagination/CannotPaginateWithLeftJoinPreload.js'
import CannotPaginateWithLimit from '../../../src/errors/pagination/CannotPaginateWithLimit.js'
import CannotPaginateWithOffset from '../../../src/errors/pagination/CannotPaginateWithOffset.js'
import ops from '../../../src/ops/index.js'
import Composition from '../../../test-app/app/models/Composition.js'
import Edge from '../../../test-app/app/models/Graph/Edge.js'
import EdgeNode from '../../../test-app/app/models/Graph/EdgeNode.js'
import Node from '../../../test-app/app/models/Graph/Node.js'
import Pet from '../../../test-app/app/models/Pet.js'
import Post from '../../../test-app/app/models/Post.js'
import User from '../../../test-app/app/models/User.js'

describe('Query#cursorPaginate', () => {
  let snoopy: Pet
  let woodstock: Pet
  let aster: Pet

  beforeEach(async () => {
    snoopy = await Pet.create({ name: 'Snoopy' })
    woodstock = await Pet.create({ name: 'Woodstock' })
    aster = await Pet.create({ name: 'Aster' })
  })

  it('returns a single page of results, reverse-ordered by primary key', async () => {
    const results = await Pet.query().cursorPaginate({ pageSize: 2, cursor: undefined })
    expect(results).toEqual({
      cursor: woodstock.id,
      results: [expect.toMatchDreamModel(aster), expect.toMatchDreamModel(woodstock)],
    })
  })

  context('soft-deleted records', () => {
    it('are omitted from the results', async () => {
      await woodstock.destroy()
      const results = await Pet.query().cursorPaginate({ pageSize: 2, cursor: undefined })
      expect(results).toEqual({
        cursor: snoopy.id,
        results: [expect.toMatchDreamModel(aster), expect.toMatchDreamModel(snoopy)],
      })
    })
  })

  context('passed cursor that is the primary key of a record', () => {
    it('includes records higher in the sort order than that record', async () => {
      const results = await Pet.query().cursorPaginate({ pageSize: 2, cursor: aster.id })
      expect(results).toEqual({
        cursor: snoopy.id,
        results: [expect.toMatchDreamModel(woodstock), expect.toMatchDreamModel(snoopy)],
      })
    })

    context('when the record corresponding to the cursor has been soft-deleted', () => {
      it('includes records higher in the sort order than that record', async () => {
        await aster.destroy()
        const results = await Pet.query().cursorPaginate({ pageSize: 2, cursor: aster.id })
        expect(results).toEqual({
          cursor: snoopy.id,
          results: [expect.toMatchDreamModel(woodstock), expect.toMatchDreamModel(snoopy)],
        })
      })
    })
  })

  context('when the results are fewer than a page size', () => {
    it('cursor is null', async () => {
      const results = await Pet.query().cursorPaginate({ pageSize: 2, cursor: woodstock.id })
      expect(results).toEqual({
        cursor: null,
        results: [expect.toMatchDreamModel(snoopy)],
      })
    })
  })

  context('a query ordered—ascending—by a non-primary key field', () => {
    it('cursor and results respect the order', async () => {
      const results = await Pet.query().order('name').cursorPaginate({ pageSize: 2, cursor: undefined })
      expect(results).toEqual({
        cursor: snoopy.id,
        results: [expect.toMatchDreamModel(aster), expect.toMatchDreamModel(snoopy)],
      })
    })

    context('passed cursor that is the primary key of a record', () => {
      it('includes records higher in the sort order than that record', async () => {
        const results = await Pet.query().order('name').cursorPaginate({ pageSize: 2, cursor: snoopy.id })
        expect(results).toEqual({
          cursor: null,
          results: [expect.toMatchDreamModel(woodstock)],
        })
      })

      context('when the record corresponding to the cursor has been soft-deleted', () => {
        it('includes records higher in the sort order than that record', async () => {
          await snoopy.destroy()
          const results = await Pet.query().order('name').cursorPaginate({ pageSize: 2, cursor: snoopy.id })
          expect(results).toEqual({
            cursor: null,
            results: [expect.toMatchDreamModel(woodstock)],
          })
        })
      })

      context('when the record corresponding to the cursor has been deleted', () => {
        it('treats it as if the cursor were undefined', async () => {
          await snoopy.reallyDestroy()
          const results = await Pet.query().order('name').cursorPaginate({ pageSize: 2, cursor: snoopy.id })
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
          .cursorPaginate({ pageSize: 2, cursor: undefined })
        expect(results).toEqual({
          cursor: snoopy2.id,
          results: [expect.toMatchDreamModel(aster), expect.toMatchDreamModel(snoopy2)],
        })

        const results2 = await Pet.query()
          .order({ name: 'asc' })
          .cursorPaginate({ pageSize: 2, cursor: snoopy2.id })
        expect(results2).toEqual({
          cursor: woodstock.id,
          results: [expect.toMatchDreamModel(snoopy), expect.toMatchDreamModel(woodstock)],
        })
      })
    })

    context('when the field is the primary key of a joined association', () => {
      it('includes the primary key of the model being paginated as a fallback sort so that no records are missed and no records are repeated', async () => {
        const snoopy3 = await Pet.create({ name: 'Snoopy' })
        const snoopy2 = await Pet.create({ name: 'Snoopy' })

        const userWithLowerPrimaryKey = await User.create({ email: 'b@b.com', password: 's3cr3t' })
        const user = await User.create({ email: 'a@a.com', password: 's3cr3t' })

        await aster.update({ user })
        await snoopy.update({ user })
        await snoopy2.update({ user })
        await snoopy3.update({ user: userWithLowerPrimaryKey })
        await woodstock.update({ user })

        const results = await Pet.query()
          .leftJoin('user')
          .order({ 'pets.name': 'asc', 'user.id': 'asc' })
          .cursorPaginate({ pageSize: 2, cursor: undefined })
        expect(results).toEqual({
          cursor: snoopy3.id,
          results: [expect.toMatchDreamModel(aster), expect.toMatchDreamModel(snoopy3)],
        })

        const results2 = await Pet.query()
          .leftJoin('user')
          .order({ 'pets.name': 'asc', 'user.id': 'asc' })
          .cursorPaginate({ pageSize: 2, cursor: snoopy3.id })
        expect(results2).toEqual({
          cursor: snoopy.id,
          results: [expect.toMatchDreamModel(snoopy2), expect.toMatchDreamModel(snoopy)],
        })

        const results3 = await Pet.query()
          .leftJoin('user')
          .order({ 'pets.name': 'asc', 'user.id': 'asc' })
          .cursorPaginate({ pageSize: 2, cursor: snoopy.id })
        expect(results3).toEqual({
          cursor: null,
          results: [expect.toMatchDreamModel(woodstock)],
        })
      })
    })
  })

  context('a query ordered—descending—by a non-primary key field', () => {
    it('cursor and results respect the order', async () => {
      const results = await Pet.query()
        .order({ name: 'desc' })
        .cursorPaginate({ pageSize: 2, cursor: undefined })
      expect(results).toEqual({
        cursor: snoopy.id,
        results: [expect.toMatchDreamModel(woodstock), expect.toMatchDreamModel(snoopy)],
      })
    })

    context('passed cursor that is the primary key of a record', () => {
      it('includes records higher in the sort order than that record', async () => {
        const results = await Pet.query()
          .order({ name: 'desc' })
          .cursorPaginate({ pageSize: 2, cursor: snoopy.id })
        expect(results).toEqual({
          cursor: null,
          results: [expect.toMatchDreamModel(aster)],
        })
      })

      context('when ascending primary key is passed in addition to the primary ordering', () => {
        it('includes records higher in the sort order than that record', async () => {
          const results = await Pet.query()
            .order({ name: 'desc', id: 'asc' })
            .cursorPaginate({ pageSize: 2, cursor: snoopy.id })
          expect(results).toEqual({
            cursor: null,
            results: [expect.toMatchDreamModel(aster)],
          })
        })
      })
    })

    context('when the field is not unique', () => {
      it('includes the primary key as a fallback sort so that no records are missed and no records are repeated', async () => {
        const snoopy2 = await Pet.create({ name: 'Snoopy' })

        const results = await Pet.query()
          .order({ name: 'desc' })
          .cursorPaginate({ pageSize: 2, cursor: undefined })
        expect(results).toEqual({
          cursor: snoopy2.id,
          results: [expect.toMatchDreamModel(woodstock), expect.toMatchDreamModel(snoopy2)],
        })

        const results2 = await Pet.query()
          .order({ name: 'desc' })
          .cursorPaginate({ pageSize: 2, cursor: snoopy2.id })
        expect(results2).toEqual({
          cursor: aster.id,
          results: [expect.toMatchDreamModel(snoopy), expect.toMatchDreamModel(aster)],
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
        .cursorPaginate({ cursor: undefined })

      expect(results[0]).toMatchDreamModel(composition3)
      expect(results[1]).toMatchDreamModel(composition1)
      expect(results[2]).toMatchDreamModel(composition2)
      expect(results[3]).toMatchDreamModel(composition4)
    })

    it('follows that order onto later pages, reaching every record exactly once', async () => {
      const user = await User.create({ email: 'fred@fred', password: 'howyadoin' })
      const composition1 = await Composition.create({ user, content: 'a' })
      const composition3 = await Composition.create({ user, content: 'a' })
      const composition4 = await Composition.create({ user, content: 'b' })
      const composition2 = await Composition.create({ user, content: 'b' })

      const page1 = await user
        .associationQuery('sortedCompositions')
        .cursorPaginate({ pageSize: 2, cursor: undefined })
      expect(page1).toEqual({
        cursor: composition1.id,
        results: [expect.toMatchDreamModel(composition3), expect.toMatchDreamModel(composition1)],
      })

      const page2 = await user
        .associationQuery('sortedCompositions')
        .cursorPaginate({ pageSize: 2, cursor: page1.cursor })
      expect(page2).toEqual({
        cursor: composition4.id,
        results: [expect.toMatchDreamModel(composition2), expect.toMatchDreamModel(composition4)],
      })

      const page3 = await user
        .associationQuery('sortedCompositions')
        .cursorPaginate({ pageSize: 2, cursor: page2.cursor })
      expect(page3).toEqual({ cursor: null, results: [] })
    })

    context('when the Query also carries an explicit order', () => {
      it('orders by the declared association order first, reaching every record exactly once across pages', async () => {
        const user = await User.create({ email: 'fred@fred', password: 'howyadoin' })
        const post1 = await Post.create({ user, body: 'd' })
        const post2 = await Post.create({ user, body: 'c' })
        const post3 = await Post.create({ user, body: 'b' })
        const post4 = await Post.create({ user, body: 'a' })
        // orderedPosts orders by position, which now runs post2, post3, post4, post1
        await post1.update({ position: 4 })

        const page1 = await user
          .associationQuery('orderedPosts')
          .order('body')
          .cursorPaginate({ pageSize: 2, cursor: undefined })
        expect(page1).toEqual({
          cursor: post3.id,
          results: [expect.toMatchDreamModel(post2), expect.toMatchDreamModel(post3)],
        })

        const page2 = await user
          .associationQuery('orderedPosts')
          .order('body')
          .cursorPaginate({ pageSize: 2, cursor: page1.cursor })
        expect(page2).toEqual({
          cursor: post1.id,
          results: [expect.toMatchDreamModel(post4), expect.toMatchDreamModel(post1)],
        })
      })
    })
  })

  context(
    'paginating a through association whose order is declared on the association it goes through',
    () => {
      it('follows that order onto later pages, reaching every record exactly once', async () => {
        const node = await Node.create({ name: 'world' })
        const edge1 = await Edge.create({ name: 'a' })
        const edge2 = await Edge.create({ name: 'b' })
        const edge3 = await Edge.create({ name: 'c' })
        const edge4 = await Edge.create({ name: 'd' })
        const edgeNode1 = await EdgeNode.create({ node, edge: edge1 })
        await EdgeNode.create({ node, edge: edge2 })
        await EdgeNode.create({ node, edge: edge3 })
        await EdgeNode.create({ node, edge: edge4 })
        // edgesOrderedByPosition goes through orderedEdgeNodes, ordered by position,
        // which now runs edge2, edge3, edge4, edge1
        await edgeNode1.update({ position: 4 })

        const page1 = await node
          .associationQuery('edgesOrderedByPosition')
          .cursorPaginate({ pageSize: 2, cursor: undefined })
        expect(page1).toEqual({
          cursor: edge3.id,
          results: [expect.toMatchDreamModel(edge2), expect.toMatchDreamModel(edge3)],
        })

        const page2 = await node
          .associationQuery('edgesOrderedByPosition')
          .cursorPaginate({ pageSize: 2, cursor: page1.cursor })
        expect(page2).toEqual({
          cursor: edge1.id,
          results: [expect.toMatchDreamModel(edge4), expect.toMatchDreamModel(edge1)],
        })
      })
    }
  )

  context('with a similarity condition', () => {
    it('pages in descending primary key order rather than by rank, reaching every match exactly once', async () => {
      // "chalupazz" passes the similarity threshold for "chalupa" but ranks below
      // an exact "chalupa", so the lowest primary keys rank best
      const user1 = await User.create({ email: 'a@a.com', password: 'howyadoin', name: 'chalupa' })
      const user2 = await User.create({ email: 'b@b.com', password: 'howyadoin', name: 'chalupa' })
      const user3 = await User.create({ email: 'c@c.com', password: 'howyadoin', name: 'chalupazz' })
      const user4 = await User.create({ email: 'd@d.com', password: 'howyadoin', name: 'chalupazz' })
      await User.create({ email: 'e@e.com', password: 'howyadoin', name: 'calvin' })

      const page1 = await User.where({ name: ops.similarity('chalupa') }).cursorPaginate({
        pageSize: 2,
        cursor: undefined,
      })
      expect(page1).toEqual({
        cursor: user3.id,
        results: [expect.toMatchDreamModel(user4), expect.toMatchDreamModel(user3)],
      })

      const page2 = await User.where({ name: ops.similarity('chalupa') }).cursorPaginate({
        pageSize: 2,
        cursor: page1.cursor,
      })
      expect(page2).toEqual({
        cursor: user1.id,
        results: [expect.toMatchDreamModel(user2), expect.toMatchDreamModel(user1)],
      })
    })
  })

  context('when a limit is applied to the query', () => {
    it('throws an exception', async () => {
      await expect(async () => {
        await User.limit(100).cursorPaginate({ pageSize: 2, cursor: undefined } as any)
      }).rejects.toThrow(CannotPaginateWithLimit)
    })
  })

  context('when an offset is applied to the query', () => {
    it('throws an exception', async () => {
      await expect(async () => {
        await User.offset(100).cursorPaginate({ pageSize: 2, cursor: undefined } as any)
      }).rejects.toThrow(CannotPaginateWithOffset)
    })
  })

  context('when a leftJoinPreload is applied to the query', () => {
    it('throws an exception', async () => {
      await expect(async () => {
        await User.leftJoinPreload('pets').cursorPaginate({ pageSize: 2, cursor: undefined } as any)
      }).rejects.toThrow(CannotPaginateWithLeftJoinPreload)
    })
  })
})
