import { describe as context } from '@jest/globals'
import Edge from '../../../test-app/app/models/Graph/Edge'
import Node from '../../../test-app/app/models/Graph/Node'
import EdgeNode from '../../../test-app/app/models/Graph/EdgeNode'
import { ExpressionBuilder } from 'kysely'
import NonExistentScopeProvidedToResort from '../../../src/exceptions/non-existent-scope-provided-to-resort'
import Mylar from '../../../test-app/app/models/Balloon/Mylar'
import Latex from '../../../test-app/app/models/Balloon/Latex'
import User from '../../../test-app/app/models/User'
import Balloon from '../../../test-app/app/models/Balloon'

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

    expect((await edge1Node1_1.reload()).position).toEqual(1)
    expect((await edge1Node1_2.reload()).position).toEqual(2)
    expect((await edge1Node1_3.reload()).position).toEqual(3)
    expect((await edge2Node1_1.reload()).position).toEqual(1)
    expect((await edge2Node1_2.reload()).position).toEqual(2)
    expect((await edge2Node2_1.reload()).position).toEqual(1)
    expect((await edge2Node2_2.reload()).position).toEqual(2)
  })

  context('with valid data that is already correctly ordered', () => {
    it('does not tamper with data', async () => {
      await EdgeNode.resort('position')

      expect((await edge1Node1_1.reload()).position).toEqual(1)
      expect((await edge1Node1_2.reload()).position).toEqual(2)
      expect((await edge1Node1_3.reload()).position).toEqual(3)
      expect((await edge2Node1_1.reload()).position).toEqual(1)
      expect((await edge2Node1_2.reload()).position).toEqual(2)
      expect((await edge2Node2_1.reload()).position).toEqual(1)
      expect((await edge2Node2_2.reload()).position).toEqual(2)
    })
  })

  context('with scrambled positions mysteriously applied to fields', () => {
    beforeEach(async () => {
      await EdgeNode.where({})
        .toKysely('update')
        .set((eb: ExpressionBuilder<any, any>) => ({
          position: eb('position', '+', 100),
        }))
        .execute()

      expect((await edge1Node1_1.reload()).position).toEqual(101)
      expect((await edge1Node1_2.reload()).position).toEqual(102)
      expect((await edge1Node1_3.reload()).position).toEqual(103)
      expect((await edge2Node1_1.reload()).position).toEqual(101)
      expect((await edge2Node1_2.reload()).position).toEqual(102)
      expect((await edge2Node2_1.reload()).position).toEqual(101)
      expect((await edge2Node2_2.reload()).position).toEqual(102)
    })

    it('resets their positions to auto-incrementing order', async () => {
      await EdgeNode.resort('position')

      expect((await edge1Node1_1.reload()).position).toEqual(1)
      expect((await edge1Node1_2.reload()).position).toEqual(2)
      expect((await edge1Node1_3.reload()).position).toEqual(3)
      expect((await edge2Node1_1.reload()).position).toEqual(1)
      expect((await edge2Node1_2.reload()).position).toEqual(2)
      expect((await edge2Node2_1.reload()).position).toEqual(1)
      expect((await edge2Node2_2.reload()).position).toEqual(2)
    })
  })

  context('with an invalid scope passed', () => {
    it('raises a targeted exception', async () => {
      await expect(async () => await EdgeNode.resort('createdAt')).rejects.toThrowError(
        NonExistentScopeProvidedToResort
      )
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

      expect((await balloon1.reload()).positionAlpha).toEqual(7)
      await Balloon.resort('positionAlpha')

      expect((await balloon2.reload()).positionAlpha).toEqual(1)
      expect((await balloon3.reload()).positionAlpha).toEqual(2)
      expect((await balloon4.reload()).positionAlpha).toEqual(3)
      expect((await balloon1.reload()).positionAlpha).toEqual(4)
      expect((await unrelatedBalloon.reload()).positionAlpha).toEqual(1)
    })
  })
})
