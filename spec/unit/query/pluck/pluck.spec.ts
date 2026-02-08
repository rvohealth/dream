import ops from '../../../../src/ops/index.js'
import { DateTime } from '../../../../src/utils/datetime/DateTime.js'
import ApplicationModel from '../../../../test-app/app/models/ApplicationModel.js'
import Mylar from '../../../../test-app/app/models/Balloon/Mylar.js'
import Composition from '../../../../test-app/app/models/Composition.js'
import Edge from '../../../../test-app/app/models/Graph/Edge.js'
import EdgeNode from '../../../../test-app/app/models/Graph/EdgeNode.js'
import Node from '../../../../test-app/app/models/Graph/Node.js'
import Pet from '../../../../test-app/app/models/Pet.js'
import User from '../../../../test-app/app/models/User.js'

describe('Query#pluck', () => {
  let user1: User
  let user2: User
  let user3: User

  beforeEach(async () => {
    user1 = await User.create({ email: 'fred@frewd', password: 'howyadoin', name: 'helloworld' })
    user2 = await User.create({ email: 'how@yadoin', password: 'howyadoin', name: 'hello world' })
    user3 = await User.create({ email: 'fred@fishman', password: 'howyadoin', name: 'herzog' })
  })

  it('plucks the specified attributes and returns them as raw data', async () => {
    const plucked = await User.order('id').pluck('id')
    expect(plucked).toEqual([user1.id, user2.id, user3.id])
  })

  context('soft-deleted records', () => {
    it('are omitted', async () => {
      const snoopy = await Pet.create({ name: 'Snoopy' })
      const woodstock = await Pet.create({ name: 'Woodstock' })
      const aster = await Pet.create({ name: 'Aster' })

      expect(await Pet.order('id').pluck('id')).toEqual([snoopy.id, woodstock.id, aster.id])

      await woodstock.destroy()
      expect(await Pet.order('id').pluck('id')).toEqual([snoopy.id, aster.id])
    })
  })

  context('on an associationQuery', () => {
    it('columns corresponding to the root of the query are namespaced to the association name in associationQuery', async () => {
      await Mylar.create({ user: user1, color: 'red' })

      const colors = await user1.associationQuery('balloons').pluck('color')
      expect(colors[0]).toEqual('red')
    })
  })

  context('plucking from base model when joining associations', () => {
    it('plucks the specified attributes from the base model', async () => {
      await user2.createAssociation('compositions')
      const plucked = await User.innerJoin('compositions').pluck('users.id')
      expect(plucked).toEqual([user2.id])
    })
  })

  context('columns that get transformed during marshalling', () => {
    context('a single value', () => {
      it('are properly marshalled', async () => {
        await Edge.create({ name: 'E1', weight: 2.3 })
        await Edge.create({ name: 'E2', weight: 7.1 })

        const plucked = await Edge.query().pluck('weight')
        expect(plucked[0]).toEqual(2.3)
        expect(plucked[1]).toEqual(7.1)
      })
    })

    context('multiple values', () => {
      it('are properly marshalled', async () => {
        await Edge.create({ name: 'E1', weight: 2.3 })
        await Edge.create({ name: 'E2', weight: 7.1 })

        const plucked = await Edge.query().pluck('name', 'weight')
        expect(plucked[0]).toEqual(['E1', 2.3])
        expect(plucked[1]).toEqual(['E2', 7.1])
      })
    })
  })

  context('with multiple fields', () => {
    it('should return multi-dimensional array', async () => {
      const plucked = await User.order('id').pluck('id', 'createdAt')
      expect(plucked).toEqual([
        [user1.id, user1.createdAt],
        [user2.id, user2.createdAt],
        [user3.id, user3.createdAt],
      ])
    })
  })

  context('with a where clause specified', () => {
    it('respects the where clause', async () => {
      const plucked = await User.order('id').where({ name: 'helloworld' }).pluck('id')
      expect(plucked).toEqual([user1.id])
    })

    context('with a similarity operator', () => {
      it('respects the similarity operator', async () => {
        const plucked = await User.where({ name: ops.similarity('hello world') }).pluck('id')
        expect(plucked).toEqual([user2.id, user1.id])
      })
    })
  })

  context('when in a transaction', () => {
    it('correctly applies scope to transaction', async () => {
      let plucked: string[] = []
      await ApplicationModel.transaction(async txn => {
        const ids = await User.txn(txn).pluck('id')
        plucked = ids
      })

      expect(plucked).toEqual([user1.id, user2.id, user3.id])
    })
  })

  context('when the association is aliased', () => {
    it('plucks the specified columns', async () => {
      await Composition.create({
        user: user1,
        createdAt: DateTime.now().minus({ day: 1 }),
        content: 'hello world',
      })

      const plucked = await User.where({ id: user1.id })
        .leftJoin('recentCompositions as rc')
        .pluck('rc.content')
      expect(plucked[0]).toEqual('hello world')
    })
  })

  context('with order-clause-on-the-association', () => {
    let node: Node
    let edge1: Edge
    let edge2: Edge
    let edge3: Edge
    let edgeNode1: EdgeNode
    let edgeNode2: EdgeNode
    let edgeNode3: EdgeNode

    beforeEach(async () => {
      node = await Node.create({ name: 'world', omittedEdgePosition: 1 })
      edge1 = await Edge.create({ name: 'c' })
      edge2 = await Edge.create({ name: 'a' })
      edge3 = await Edge.create({ name: 'b' })

      // position is automatically set by sortable
      edgeNode1 = await EdgeNode.create({ node, edge: edge1 })
      edgeNode2 = await EdgeNode.create({ node, edge: edge2 })
      edgeNode3 = await EdgeNode.create({ node, edge: edge3 })
      await edgeNode3.update({ position: 1 })
    })

    it('orders the results based on the order specified in the association', async () => {
      const plucked = await Node.leftJoin('edgesOrderedByName').pluck('edgesOrderedByName.name')
      expect(plucked[0]).toEqual(edge2.name)
      expect(plucked[1]).toEqual(edge3.name)
      expect(plucked[2]).toEqual(edge1.name)
    })

    context('aliased', () => {
      it('orders the results based on the order specified in the association', async () => {
        const plucked = await Node.leftJoin('edgesOrderedByName as eobn').pluck('eobn.name')
        expect(plucked[0]).toEqual(edge2.name)
        expect(plucked[1]).toEqual(edge3.name)
        expect(plucked[2]).toEqual(edge1.name)
      })
    })

    context('order on the association we’re going through', () => {
      it('orders the results based on the order specified in the association', async () => {
        const plucked = await Node.leftJoin('edgesOrderedByPosition').pluck('edgesOrderedByPosition.name')
        expect(plucked[0]).toEqual(edge3.name)
        expect(plucked[1]).toEqual(edge1.name)
        expect(plucked[2]).toEqual(edge2.name)
      })
    })

    context('through a BelongsTo association', () => {
      it('orders the results based on the order specified in the root association', async () => {
        const plucked = await edgeNode2.leftJoin('orderedSiblings').pluck('orderedSiblings.id')
        expect(plucked[0]).toEqual(edgeNode3.id)
        expect(plucked[1]).toEqual(edgeNode1.id)
        expect(plucked[2]).toEqual(edgeNode2.id)
      })

      it('orders the results based on the order specified in the source association', async () => {
        const plucked = await edgeNode2
          .leftJoin('orderedSiblingsWithOrderOnSource')
          .pluck('orderedSiblingsWithOrderOnSource.id')
        expect(plucked[0]).toEqual(edgeNode3.id)
        expect(plucked[1]).toEqual(edgeNode1.id)
        expect(plucked[2]).toEqual(edgeNode2.id)
      })
    })
  })
})
