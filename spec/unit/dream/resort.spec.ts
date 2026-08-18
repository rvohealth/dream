import { ExpressionBuilder } from 'kysely'
import Query from '../../../src/dream/Query.js'
import KyselyQueryDriver from '../../../src/dream/QueryDriver/Kysely.js'
import NonExistentScopeProvidedToResort from '../../../src/errors/NonExistentScopeProvidedToResort.js'
import ops from '../../../src/ops/index.js'
import Balloon from '../../../test-app/app/models/Balloon.js'
import Latex from '../../../test-app/app/models/Balloon/Latex.js'
import Mylar from '../../../test-app/app/models/Balloon/Mylar.js'
import Collar from '../../../test-app/app/models/Collar.js'
import Edge from '../../../test-app/app/models/Graph/Edge.js'
import EdgeNode from '../../../test-app/app/models/Graph/EdgeNode.js'
import Node from '../../../test-app/app/models/Graph/Node.js'
import Pet from '../../../test-app/app/models/Pet.js'
import TextScopedSortableModel from '../../../test-app/app/models/TextScopedSortableModel.js'
import UnscopedSortableModel from '../../../test-app/app/models/UnscopedSortableModel.js'
import User from '../../../test-app/app/models/User.js'

describe('Dream#resort', () => {
  let edge1: Edge
  let edge2: Edge
  let node1: Node
  let node2: Node
  let edge1Node1_1: EdgeNode
  let edge1Node1_2: EdgeNode
  let edge1Node1_3: EdgeNode
  let edge2Node1_1: EdgeNode
  let edge2Node1_2: EdgeNode
  let edge2Node2_1: EdgeNode
  let edge2Node2_2: EdgeNode

  beforeEach(async () => {
    edge1 = await Edge.create({ name: 'edge 1' })
    edge2 = await Edge.create({ name: 'edge 2' })
    node1 = await Node.create({ name: 'node 1' })
    node2 = await Node.create({ name: 'node 2' })

    edge1Node1_1 = await EdgeNode.create({ edge: edge1, node: node1 })
    edge1Node1_2 = await EdgeNode.create({ edge: edge1, node: node1 })
    edge1Node1_3 = await EdgeNode.create({ edge: edge1, node: node1 })
    edge2Node1_1 = await EdgeNode.create({ edge: edge2, node: node1 })
    edge2Node1_2 = await EdgeNode.create({ edge: edge2, node: node1 })
    edge2Node2_1 = await EdgeNode.create({ edge: edge2, node: node2 })
    edge2Node2_2 = await EdgeNode.create({ edge: edge2, node: node2 })

    await edge1Node1_1.reload()
    expect(edge1Node1_1.multiScopedPosition).toEqual(1)
    await edge1Node1_2.reload()
    expect(edge1Node1_2.multiScopedPosition).toEqual(2)
    await edge1Node1_3.reload()
    expect(edge1Node1_3.multiScopedPosition).toEqual(3)
    await edge2Node1_1.reload()
    expect(edge2Node1_1.multiScopedPosition).toEqual(1)
    await edge2Node1_2.reload()
    expect(edge2Node1_2.multiScopedPosition).toEqual(2)
    await edge2Node2_1.reload()
    expect(edge2Node2_1.multiScopedPosition).toEqual(1)
    await edge2Node2_2.reload()
    expect(edge2Node2_2.multiScopedPosition).toEqual(2)
  })

  context('with valid data that is already correctly ordered', () => {
    it('does not tamper with data', async () => {
      await EdgeNode.resort('multiScopedPosition')

      await edge1Node1_1.reload()
      expect(edge1Node1_1.multiScopedPosition).toEqual(1)
      await edge1Node1_2.reload()
      expect(edge1Node1_2.multiScopedPosition).toEqual(2)
      await edge1Node1_3.reload()
      expect(edge1Node1_3.multiScopedPosition).toEqual(3)
      await edge2Node1_1.reload()
      expect(edge2Node1_1.multiScopedPosition).toEqual(1)
      await edge2Node1_2.reload()
      expect(edge2Node1_2.multiScopedPosition).toEqual(2)
      await edge2Node2_1.reload()
      expect(edge2Node2_1.multiScopedPosition).toEqual(1)
      await edge2Node2_2.reload()
      expect(edge2Node2_2.multiScopedPosition).toEqual(2)
    })

    it('writes nothing at all', async () => {
      const kyselyBuilders = vi.spyOn(Query.prototype, 'toKysely')

      await EdgeNode.resort('multiScopedPosition')

      // each sort scope is summarized under its lock and left alone when it
      // already runs 1..n, so no renumbering statement is built for any of them
      expect(kyselyBuilders.mock.calls.filter(([type]) => type === 'update')).toHaveLength(0)
    })
  })

  context('with scrambled positions mysteriously applied to fields', () => {
    beforeEach(async () => {
      await EdgeNode.where({})
        .toKysely('update')
        .set((eb: ExpressionBuilder<any, any>) => ({
          multiScopedPosition: eb('multiScopedPosition', '+', 100),
        }))
        .execute()

      await edge1Node1_1.reload()
      expect(edge1Node1_1.multiScopedPosition).toEqual(101)
      await edge1Node1_2.reload()
      expect(edge1Node1_2.multiScopedPosition).toEqual(102)
      await edge1Node1_3.reload()
      expect(edge1Node1_3.multiScopedPosition).toEqual(103)
      await edge2Node1_1.reload()
      expect(edge2Node1_1.multiScopedPosition).toEqual(101)
      await edge2Node1_2.reload()
      expect(edge2Node1_2.multiScopedPosition).toEqual(102)
      await edge2Node2_1.reload()
      expect(edge2Node2_1.multiScopedPosition).toEqual(101)
      await edge2Node2_2.reload()
      expect(edge2Node2_2.multiScopedPosition).toEqual(102)
    })

    it('resets their positions to auto-incrementing order', async () => {
      await EdgeNode.resort('multiScopedPosition')

      await edge1Node1_1.reload()
      expect(edge1Node1_1.multiScopedPosition).toEqual(1)
      await edge1Node1_2.reload()
      expect(edge1Node1_2.multiScopedPosition).toEqual(2)
      await edge1Node1_3.reload()
      expect(edge1Node1_3.multiScopedPosition).toEqual(3)
      await edge2Node1_1.reload()
      expect(edge2Node1_1.multiScopedPosition).toEqual(1)
      await edge2Node1_2.reload()
      expect(edge2Node1_2.multiScopedPosition).toEqual(2)
      await edge2Node2_1.reload()
      expect(edge2Node2_1.multiScopedPosition).toEqual(1)
      await edge2Node2_2.reload()
      expect(edge2Node2_2.multiScopedPosition).toEqual(2)
    })
  })

  context('with an invalid scope passed', () => {
    it('raises a targeted exception', async () => {
      await expect(EdgeNode.resort('createdAt')).rejects.toThrow(NonExistentScopeProvidedToResort)
    })
  })

  context('with an STI base class', () => {
    it('resets their positions to auto-incrementing order', async () => {
      const user = await User.create({ email: 'how@yadoin', password: 'howyadoin' })
      const user2 = await User.create({ email: 'how@yadoin2', password: 'howyadoin' })
      const unrelatedBalloon = await Mylar.create({ user: user2 })
      const balloon1 = await Mylar.create({ user })
      const balloon2 = await Latex.create({ user })
      const balloon3 = await Mylar.create({ user })
      const balloon4 = await Latex.create({ user })

      await Balloon.where({ id: balloon1.id })
        .toKysely('update')
        .set({
          positionAlpha: 7,
        })
        .execute()

      await balloon1.reload()
      expect(balloon1.positionAlpha).toEqual(7)
      await Balloon.resort('positionAlpha')

      await balloon2.reload()
      expect(balloon2.positionAlpha).toEqual(1)
      await balloon3.reload()
      expect(balloon3.positionAlpha).toEqual(2)
      await balloon4.reload()
      expect(balloon4.positionAlpha).toEqual(3)
      await balloon1.reload()
      expect(balloon1.positionAlpha).toEqual(4)
      await unrelatedBalloon.reload()
      expect(unrelatedBalloon.positionAlpha).toEqual(1)
    })
  })

  context('when rows are deleted while the sort scopes are being discovered', () => {
    // Discovering the sort scopes by walking the table in windows is not stable
    // under a concurrent delete: deleting rows an earlier window returned shifts
    // every later window past rows it never returned, and a sort scope whose
    // only rows fall in that gap is never renumbered — while `resort` reports
    // success. The shrunken batch size below makes any such walk take several
    // windows over these few rows; a single read is unaffected by it.
    function deleteOnFirstWindowRead(sabotage: () => Promise<void>) {
      // eslint-disable-next-line @typescript-eslint/unbound-method
      const originalPluck = KyselyQueryDriver.prototype.pluck
      let sabotaged = false

      return vi.spyOn(KyselyQueryDriver.prototype, 'pluck').mockImplementation(async function (
        this: KyselyQueryDriver<TextScopedSortableModel>,
        ...fields: any[]
      ) {
        const results = await originalPluck.apply(this, fields)

        if (!sabotaged) {
          sabotaged = true
          await sabotage()
        }

        return results
      })
    }

    it('renumbers a sort scope whose only row is ordered behind the deleted rows', async () => {
      const doomed1 = await TextScopedSortableModel.create({ scopeA: 'shared' })
      const doomed2 = await TextScopedSortableModel.create({ scopeA: 'shared' })
      const lonely = await TextScopedSortableModel.create({ scopeA: 'lonely' })
      await TextScopedSortableModel.create({ scopeA: 'shared' })
      await TextScopedSortableModel.create({ scopeA: 'shared' })

      await TextScopedSortableModel.where({ id: lonely.id }).update({ position: 7 }, { skipHooks: true })

      const originalBatchSize = Query.BATCH_SIZES.PLUCK_EACH_THROUGH
      Query.BATCH_SIZES.PLUCK_EACH_THROUGH = 2
      const spy = deleteOnFirstWindowRead(async () => {
        await TextScopedSortableModel.where({ id: ops.in([doomed1.id, doomed2.id]) })
          .toKysely('delete')
          .execute()
      })

      try {
        await TextScopedSortableModel.resort('position')
      } finally {
        Query.BATCH_SIZES.PLUCK_EACH_THROUGH = originalBatchSize
        spy.mockRestore()
      }

      await lonely.reload()
      expect(lonely.position).toEqual(1)
    })
  })

  context('with a sortable field that has no scope', () => {
    it('renumbers the whole table', async () => {
      const model1 = await UnscopedSortableModel.create()
      const model2 = await UnscopedSortableModel.create()

      await UnscopedSortableModel.where({ id: model1.id }).update({ position: 7 }, { skipHooks: true })

      await UnscopedSortableModel.resort('position')

      await model1.reload()
      await model2.reload()
      expect(model2.position).toEqual(1)
      expect(model1.position).toEqual(2)
    })
  })

  context('when part of the scope is pointing to a column', () => {
    let pet: Pet
    let collar1: Collar
    let collar2: Collar
    let collar3: Collar
    let collar4: Collar
    beforeEach(async () => {
      pet = await Pet.create()
      await Pet.create()
      collar1 = await Collar.create({ tagName: 'hello', pet })
      collar2 = await Collar.create({ tagName: 'hello', pet })
      collar3 = await Collar.create({ tagName: 'goodbye', pet })
      collar4 = await Collar.create({ tagName: 'goodbye', pet })
    })

    it('correctly resorts among multiple scopes', async () => {
      await Collar.where({ id: collar1.id }).update({ position: 10 }, { skipHooks: true })
      await Collar.where({ id: collar2.id }).update({ position: 20 }, { skipHooks: true })
      await Collar.where({ id: collar3.id }).update({ position: 30 }, { skipHooks: true })
      await Collar.where({ id: collar4.id }).update({ position: 40 }, { skipHooks: true })

      await collar1.reload()
      await collar2.reload()
      await collar3.reload()
      await collar4.reload()

      expect(collar1.position).toEqual(10)
      expect(collar2.position).toEqual(20)
      expect(collar3.position).toEqual(30)
      expect(collar4.position).toEqual(40)

      await Collar.resort('position')

      await collar1.reload()
      await collar2.reload()
      await collar3.reload()
      await collar4.reload()

      expect(collar1.position).toEqual(1)
      expect(collar2.position).toEqual(2)
      expect(collar3.position).toEqual(1)
      expect(collar4.position).toEqual(2)
    })
  })
})
