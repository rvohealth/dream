import ops from '../../../../src/ops/index.js'
import { DateTime } from '../../../../src/utils/datetime/DateTime.js'
import Composition from '../../../../test-app/app/models/Composition.js'
import CompositionAsset from '../../../../test-app/app/models/CompositionAsset.js'
import CompositionAssetAudit from '../../../../test-app/app/models/CompositionAssetAudit.js'
import Edge from '../../../../test-app/app/models/Graph/Edge.js'
import EdgeNode from '../../../../test-app/app/models/Graph/EdgeNode.js'
import Node from '../../../../test-app/app/models/Graph/Node.js'
import Pet from '../../../../test-app/app/models/Pet.js'
import User from '../../../../test-app/app/models/User.js'

describe('Query#pluckEach on a join query', () => {
  it('can pluck from the root and associated namespaces', async () => {
    const node = await Node.create({ name: 'N1' })
    const edge1 = await Edge.create({ name: 'E1' })
    const edge2 = await Edge.create({ name: 'E2' })
    await EdgeNode.create({ node, edge: edge1 })
    await EdgeNode.create({ node, edge: edge2 })

    const plucked: any[] = []
    await Node.query()
      .innerJoin('edgeNodes', 'edge', { and: { name: 'E1' } })
      .pluckEach('graph_nodes.name', 'edge.name', (...arr) => {
        plucked.push(arr)
      })

    expect(plucked).toEqual([[node.name, edge1.name]])
  })

  context('when primary key is not one of the plucked fields', () => {
    it('uses primary key for ordering, but discards primary key from results', async () => {
      const node = await Node.create({ name: 'N1' })
      const edge1 = await Edge.create({ name: 'E1' })
      const edge2 = await Edge.create({ name: 'E2' })
      await EdgeNode.create({ node, edge: edge1 })
      await EdgeNode.create({ node, edge: edge2 })

      const plucked: any[] = []
      await Node.query()
        .innerJoin('edgeNodes', 'edge')
        .pluckEach('edge.name', arr => {
          plucked.push(arr)
        })

      expect(plucked.sort()).toEqual([edge1.name, edge2.name].sort())
    })
  })

  context('columns that get transformed during marshalling', () => {
    it('are properly marshalled', async () => {
      const node = await Node.create({ name: 'N1' })
      const edge1 = await Edge.create({ name: 'E1', weight: 2.3 })
      const edge2 = await Edge.create({ name: 'E2', weight: 7.1 })
      await EdgeNode.create({ node, edge: edge1 })
      await EdgeNode.create({ node, edge: edge2 })

      const plucked: any[] = []
      await Node.query()
        .innerJoin('edgeNodes', 'edge', { and: { name: 'E1' } })
        .pluckEach('edge.weight', data => {
          plucked.push(data)
        })
      expect(plucked[0]).toEqual(2.3)
    })
  })

  it('association name after conditional', async () => {
    const node = await Node.create({ name: 'N1' })
    const edge1 = await Edge.create({ name: 'E1' })
    const edge2 = await Edge.create({ name: 'E2' })
    await EdgeNode.create({ node, edge: edge1 })
    await EdgeNode.create({ node, edge: edge2 })

    const plucked: any[] = []
    await Node.query()
      .innerJoin('edgeNodes', { and: { edgeId: edge2.id } }, 'edge')
      .pluckEach('edge.id', 'edge.name', (...data) => {
        plucked.push(data)
      })
    expect(plucked).toEqual([[edge2.id, edge2.name]])
  })

  context('with a similarity operator', () => {
    it('respects the similarity operator', async () => {
      const user1 = await User.create({ name: 'jeremy', email: 'hello@world1', password: 'howyadoin' })
      await Composition.create({ content: 'howyadoin', user: user1 })

      const user2 = await User.create({ name: 'cheeseman', email: 'hello@world2', password: 'howyadoin' })
      await Composition.create({ content: 'howyadoin', user: user2 })

      const plucked: any[] = []
      await Composition.query()
        .innerJoin('user', { and: { name: ops.similarity('jerem') } })
        .pluckEach('user.id', data => {
          plucked.push(data)
        })
      expect(plucked).toEqual([user1.id])
    })
  })

  context('with a default scope', () => {
    it('applies the default scope to the included results', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      await Pet.create({ user, name: 'Snoopy' })
      await Pet.create({ user, name: 'Woodstock', deletedAt: DateTime.now() })

      const names: any[] = []
      await User.query()
        .innerJoin('pets')
        .pluckEach('pets.name', data => {
          names.push(data)
        })
      expect(names).toEqual(['Snoopy'])
    })
  })

  context('nested through associations', () => {
    it('plucks from the through associations', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      await User.create({ email: 'how@yadoin', password: 'howyadoin' })
      const composition = await Composition.create({ user })
      const compositionAsset = await CompositionAsset.create({ composition })
      await CompositionAssetAudit.create({
        compositionAssetId: compositionAsset.id,
      })

      const plucked: any[] = []
      await CompositionAssetAudit.query()
        .innerJoin('user')
        .pluckEach('user.email', data => {
          plucked.push(data)
        })
      expect(plucked).toEqual(['fred@frewd'])
    })

    context('limiting batch size on a tree', () => {
      it('plucks from the through associations', async () => {
        const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
        const user2 = await User.create({ email: 'how@yadoin', password: 'howyadoin' })
        const composition = await Composition.create({ user })
        const composition2 = await Composition.create({ user: user2 })
        await CompositionAsset.create({ composition, name: 'asset 1' })
        await CompositionAsset.create({ composition, name: 'asset 2' })
        await CompositionAsset.create({
          composition: composition2,
          name: 'asset 3',
        })
        await CompositionAsset.create({
          composition: composition2,
          name: 'asset 4',
        })

        const plucked: any[] = []
        await User.query()
          .innerJoin('compositions', 'compositionAssets')
          .pluckEach(
            'compositionAssets.name',
            name => {
              plucked.push(name)
            },
            { batchSize: 1 }
          )
        expect(plucked).toEqual(expect.arrayContaining(['asset 1', 'asset 2', 'asset 3', 'asset 4']))
      })
    })
  })
})

context.skip('type tests', () => {
  type IsAny<T> = 0 extends 1 & T ? true : false
  type IsNever<T> = [T] extends [never] ? true : false
  type ExpectFalse<T extends false> = T

  it('rejects a bare root field at the field while preserving callback contextual typing', async () => {
    await Node.query()
      .innerJoin('edgeNodes', 'edge')
      .pluckEach(
        // @ts-expect-error joined pluckEach fields must be qualified
        'id',
        id => {
          type IdIsNotAny = ExpectFalse<IsAny<typeof id>>
          type IdIsNotNever = ExpectFalse<IsNever<typeof id>>

          const value: string | number | DateTime | null = id
          // @ts-expect-error the callback value is a model-property union, not any or never
          const invalidValue: boolean = id

          void (null as unknown as IdIsNotAny)
          void (null as unknown as IdIsNotNever)
          void value
          void invalidValue
        }
      )
  })

  it('preserves positional callback types for qualified root and joined fields with options', async () => {
    await Node.query()
      .innerJoin('edgeNodes', 'edge')
      .pluckEach(
        'graph_nodes.id',
        'edge.name',
        (nodeId, edgeName) => {
          type NodeIdIsNotAny = ExpectFalse<IsAny<typeof nodeId>>
          type NodeIdIsNotNever = ExpectFalse<IsNever<typeof nodeId>>
          type EdgeNameIsNotAny = ExpectFalse<IsAny<typeof edgeName>>
          type EdgeNameIsNotNever = ExpectFalse<IsNever<typeof edgeName>>

          const values: [Node['id'], Edge['name']] = [nodeId, edgeName]
          // @ts-expect-error qualified root id retains its string type
          const invalidNodeId: number = nodeId
          // @ts-expect-error joined edge name retains its nullable string type
          const invalidEdgeName: number = edgeName

          void (null as unknown as NodeIdIsNotAny)
          void (null as unknown as NodeIdIsNotNever)
          void (null as unknown as EdgeNameIsNotAny)
          void (null as unknown as EdgeNameIsNotNever)
          void values
          void invalidNodeId
          void invalidEdgeName
        },
        { batchSize: 1 }
      )
  })
})
