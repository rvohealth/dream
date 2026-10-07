import CannotPaginateWithLeftJoinPreload from '../../../src/errors/pagination/CannotPaginateWithLeftJoinPreload.js'
import CannotPaginateWithLimit from '../../../src/errors/pagination/CannotPaginateWithLimit.js'
import CannotPaginateWithOffset from '../../../src/errors/pagination/CannotPaginateWithOffset.js'
import ops from '../../../src/ops/index.js'
import { CursorPaginatedDreamQueryResult } from '../../../src/types/query.js'
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

    context('when the field holds NULL', () => {
      it('pages the NULL records last, reaching every record exactly once', async () => {
        const unnamed1 = await Pet.create({ name: null })
        const unnamed2 = await Pet.create({ name: null })

        const page1 = await Pet.query()
          .order({ name: 'desc' })
          .cursorPaginate({ pageSize: 2, cursor: undefined })
        expect(page1).toEqual({
          cursor: snoopy.id,
          results: [expect.toMatchDreamModel(woodstock), expect.toMatchDreamModel(snoopy)],
        })

        const page2 = await Pet.query()
          .order({ name: 'desc' })
          .cursorPaginate({ pageSize: 2, cursor: page1.cursor })
        expect(page2).toEqual({
          cursor: unnamed2.id,
          results: [expect.toMatchDreamModel(aster), expect.toMatchDreamModel(unnamed2)],
        })

        const page3 = await Pet.query()
          .order({ name: 'desc' })
          .cursorPaginate({ pageSize: 2, cursor: page2.cursor })
        expect(page3).toEqual({
          cursor: null,
          results: [expect.toMatchDreamModel(unnamed1)],
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

    context('when the ordered column holds NULL', () => {
      it('pages the NULL records first, then the rest, reaching every record exactly once', async () => {
        const user = await User.create({ email: 'fred@fred', password: 'howyadoin' })
        const composition1 = await Composition.create({ user })
        const composition2 = await Composition.create({ user })
        const composition3 = await Composition.create({ user })
        // creating a Composition fills in blank content, so clear it on the three created so far
        await Composition.where({ user }).update({ content: null })
        const composition4 = await Composition.create({ user, content: 'a' })
        const composition5 = await Composition.create({ user, content: 'b' })

        const page1 = await user
          .associationQuery('sortedCompositions')
          .cursorPaginate({ pageSize: 2, cursor: undefined })
        expect(page1).toEqual({
          cursor: composition2.id,
          results: [expect.toMatchDreamModel(composition3), expect.toMatchDreamModel(composition2)],
        })

        const page2 = await user
          .associationQuery('sortedCompositions')
          .cursorPaginate({ pageSize: 2, cursor: page1.cursor })
        expect(page2).toEqual({
          cursor: composition4.id,
          results: [expect.toMatchDreamModel(composition1), expect.toMatchDreamModel(composition4)],
        })

        const page3 = await user
          .associationQuery('sortedCompositions')
          .cursorPaginate({ pageSize: 2, cursor: page2.cursor })
        expect(page3).toEqual({
          cursor: null,
          results: [expect.toMatchDreamModel(composition5)],
        })
      })
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
          cursor: expect.any(String),
          results: [expect.toMatchDreamModel(edge2), expect.toMatchDreamModel(edge3)],
        })

        const page2 = await node
          .associationQuery('edgesOrderedByPosition')
          .cursorPaginate({ pageSize: 2, cursor: page1.cursor })
        expect(page2).toEqual({
          cursor: expect.any(String),
          results: [expect.toMatchDreamModel(edge4), expect.toMatchDreamModel(edge1)],
        })
      })

      it('resumes after the record whose primary key is passed as the cursor', async () => {
        const node = await Node.create({ name: 'world' })
        const edge1 = await Edge.create({ name: 'a' })
        const edge2 = await Edge.create({ name: 'b' })
        const edge3 = await Edge.create({ name: 'c' })
        const edge4 = await Edge.create({ name: 'd' })
        await EdgeNode.create({ node, edge: edge1 })
        await EdgeNode.create({ node, edge: edge2 })
        await EdgeNode.create({ node, edge: edge3 })
        await EdgeNode.create({ node, edge: edge4 })

        const page = await node
          .associationQuery('edgesOrderedByPosition')
          .cursorPaginate({ pageSize: 3, cursor: edge2.id })
        expect(page).toEqual({
          cursor: null,
          results: [expect.toMatchDreamModel(edge3), expect.toMatchDreamModel(edge4)],
        })
      })

      it('resumes after the cursor’s record when the cursor came from a query with a different order', async () => {
        const node = await Node.create({ name: 'world' })
        const edgeA = await Edge.create({ name: 'a' })
        const edgeB = await Edge.create({ name: 'b' })
        const edgeC = await Edge.create({ name: 'c' })
        const edgeD = await Edge.create({ name: 'd' })
        // positions run 1 through 4 in creation order, so by position the edges run c, a, d, b
        await EdgeNode.create({ node, edge: edgeC })
        await EdgeNode.create({ node, edge: edgeA })
        await EdgeNode.create({ node, edge: edgeD })
        await EdgeNode.create({ node, edge: edgeB })

        const byPosition = await node
          .associationQuery('edgesOrderedByPosition')
          .cursorPaginate({ pageSize: 2, cursor: undefined })
        expect(byPosition.results).toMatchDreamModels([edgeC, edgeA])

        const byName = await node
          .associationQuery('edgesOrderedByName')
          .cursorPaginate({ pageSize: 4, cursor: byPosition.cursor })
        expect(byName).toEqual({
          cursor: null,
          results: [
            expect.toMatchDreamModel(edgeB),
            expect.toMatchDreamModel(edgeC),
            expect.toMatchDreamModel(edgeD),
          ],
        })
      })

      context('when the association it goes through reaches a record more than once', () => {
        it('returns the record once each time it is reached, in that order, ending with a null cursor', async () => {
          const node = await Node.create({ name: 'world' })
          const edgeA = await Edge.create({ name: 'a' })
          const edgeB = await Edge.create({ name: 'b' })
          const edgeC = await Edge.create({ name: 'c' })
          // positions run 1 through 4 in creation order
          await EdgeNode.create({ node, edge: edgeA })
          await EdgeNode.create({ node, edge: edgeB })
          await EdgeNode.create({ node, edge: edgeA })
          await EdgeNode.create({ node, edge: edgeC })

          const results: Edge[] = []
          let cursor: string | null | undefined = undefined
          for (let pageCount = 0; pageCount < 10 && cursor !== null; pageCount++) {
            const page: CursorPaginatedDreamQueryResult<Edge> = await node
              .associationQuery('edgesOrderedByPosition')
              .cursorPaginate({ pageSize: 1, cursor })
            results.push(...page.results)
            cursor = page.cursor
          }

          expect(cursor).toBeNull()
          expect(results).toMatchDreamModels([edgeA, edgeB, edgeA, edgeC])
        })
      })
    }
  )

  context('a query joining an ordered HasMany association that matches several records to one record', () => {
    it('returns the record once for each record it joins, in the association’s order, ending with a null cursor', async () => {
      const user1 = await User.create({ email: 'fred@fred', password: 'howyadoin' })
      const user2 = await User.create({ email: 'fred@fred2', password: 'howyadoin' })
      // orderedPosts orders by position, which numbers each user's posts from 1
      await Post.create({ user: user1 })
      await Post.create({ user: user1 })
      await Post.create({ user: user2 })
      await Post.create({ user: user2 })
      await Post.create({ user: user2 })

      const results: User[] = []
      let cursor: string | null | undefined = undefined
      for (let pageCount = 0; pageCount < 10 && cursor !== null; pageCount++) {
        const page: CursorPaginatedDreamQueryResult<User> = await User.innerJoin(
          'orderedPosts'
        ).cursorPaginate({ pageSize: 2, cursor })
        results.push(...page.results)
        cursor = page.cursor
      }

      expect(cursor).toBeNull()
      // positions 1, 1, 2, 2, 3, ties broken by descending user primary key
      expect(results).toMatchDreamModels([user2, user1, user2, user1, user2])
    })

    context('when the Query also orders by the joined records’ primary key', () => {
      it('returns the record once for each record it joins, in that order, ending with a null cursor', async () => {
        const user1 = await User.create({ email: 'fred@fred', password: 'howyadoin' })
        const user2 = await User.create({ email: 'fred@fred2', password: 'howyadoin' })
        // orderedPosts orders by position, which numbers each user's posts from 1
        await Post.create({ user: user2 })
        await Post.create({ user: user1 })
        await Post.create({ user: user2 })
        await Post.create({ user: user1 })

        const results: User[] = []
        let cursor: string | null | undefined = undefined
        for (let pageCount = 0; pageCount < 10 && cursor !== null; pageCount++) {
          const page: CursorPaginatedDreamQueryResult<User> = await User.innerJoin('orderedPosts')
            .order({ 'orderedPosts.id': 'asc' })
            .cursorPaginate({ pageSize: 1, cursor })
          results.push(...page.results)
          cursor = page.cursor
        }

        expect(cursor).toBeNull()
        // positions 1, 1, 2, 2, ties broken by ascending post primary key
        expect(results).toMatchDreamModels([user2, user1, user2, user1])
      })
    })
  })

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
