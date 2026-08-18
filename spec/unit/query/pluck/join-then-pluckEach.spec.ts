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
  it('can pluck a bare root field alongside an associated field', async () => {
    const node = await Node.create({ name: 'N1' })
    const edge = await Edge.create({ name: 'E1' })
    await EdgeNode.create({ node, edge })

    const plucked: [Node['id'], Edge['name']][] = []
    await Node.query()
      .innerJoin('edgeNodes', 'edge')
      .pluckEach('id', 'edge.name', (nodeId, edgeName) => {
        const typedValues: [Node['id'], Edge['name']] = [nodeId, edgeName]
        plucked.push(typedValues)
      })

    expect(plucked).toEqual([[node.id, edge.name]])
  })

  it('can pluck from the legacy-qualified root and associated namespaces', async () => {
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

/*
 * These compile-only tests protect TypeScript diagnostic quality, not runtime behavior. An
 * invalid-field assertion without a callback would miss a regression that moves the useful error
 * away from the field argument or collapses the callback parameter to `any` or `never`.
 */
context.skip('type tests', () => {
  type IsAny<T> = 0 extends 1 & T ? true : false
  type IsNever<T> = [T] extends [never] ? true : false
  type ExpectFalse<T extends false> = T
  type MapKey<T> = T extends ReadonlyMap<infer Key, unknown> ? Key : never
  type MapValue<T> = T extends ReadonlyMap<unknown, infer Value> ? Value : never

  it('rejects an invalid bare field at the field while preserving callback contextual typing', async () => {
    await Node.query()
      .innerJoin('edgeNodes', 'edge')
      .pluckEach(
        // @ts-expect-error invalidField is neither a root nor joined field
        'invalidField',
        invalidField => {
          type InvalidFieldIsNotAny = ExpectFalse<IsAny<typeof invalidField>>
          type InvalidFieldIsNotNever = ExpectFalse<IsNever<typeof invalidField>>

          const value: string | number | DateTime | null = invalidField
          // @ts-expect-error the callback value is a model-property union, not any or never
          const invalidValue: boolean = invalidField

          void (null as unknown as InvalidFieldIsNotAny)
          void (null as unknown as InvalidFieldIsNotNever)
          void value
          void invalidValue
        }
      )
  })

  it('rejects an invalid qualified field at the field while preserving positional callback types', async () => {
    await Node.query()
      .innerJoin('edgeNodes', 'edge')
      .pluckEach(
        // @ts-expect-error edge.invalidField is not a joined field
        'edge.invalidField',
        'id',
        (invalidField, nodeId) => {
          type InvalidFieldIsNotAny = ExpectFalse<IsAny<typeof invalidField>>
          type InvalidFieldIsNotNever = ExpectFalse<IsNever<typeof invalidField>>
          type NodeIdIsNotAny = ExpectFalse<IsAny<typeof nodeId>>
          type NodeIdIsNotNever = ExpectFalse<IsNever<typeof nodeId>>

          const invalidFieldValue: string | number | DateTime | null = invalidField
          const typedNodeId: Node['id'] = nodeId
          // @ts-expect-error the invalid field callback value is not any
          const invalidValue: boolean = invalidField
          // @ts-expect-error the valid root id retains its string type
          const invalidNodeId: number = nodeId

          void (null as unknown as InvalidFieldIsNotAny)
          void (null as unknown as InvalidFieldIsNotNever)
          void (null as unknown as NodeIdIsNotAny)
          void (null as unknown as NodeIdIsNotNever)
          void invalidFieldValue
          void typedNodeId
          void invalidValue
          void invalidNodeId
        }
      )
  })

  it('preserves positional callback types for legacy-qualified root and joined fields with options', async () => {
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

  it('accepts bare root fields across joined ordering, plucking, and aggregate APIs', async () => {
    const node = Node.new({ name: 'root', omittedEdgePosition: 1 })
    const query = Node.query().innerJoin('edgeNodes', 'edge')

    async function pluckGeneric<ColumnNames extends ['id'] | ['edge.name']>(...columnNames: ColumnNames) {
      await query.pluckEach(...columnNames, (...values) => {
        const typedValues: (Node['id'] | Edge['name'])[] = values

        void typedValues
      })
    }

    query.order('id')

    await query.pluckEach('id', 'edge.name', (nodeId, edgeName) => {
      type RootIdIsNotAny = ExpectFalse<IsAny<typeof nodeId>>
      type RootIdIsNotNever = ExpectFalse<IsNever<typeof nodeId>>

      const inferredRootId: typeof nodeId = node.id
      const typedValues: [Node['id'], Edge['name']] = [nodeId, edgeName]

      void (null as unknown as RootIdIsNotAny)
      void (null as unknown as RootIdIsNotNever)
      void inferredRootId
      void typedValues
    })

    const countBy = await query.countBy('name')
    const typedCountBy: Map<Node['name'], number> = countBy

    type CountByRootKey = MapKey<typeof countBy>
    type CountByRootKeyIsNotAny = ExpectFalse<IsAny<CountByRootKey>>
    type CountByRootKeyIsNotNever = ExpectFalse<IsNever<CountByRootKey>>
    const inferredCountByRootKey: CountByRootKey = node.name

    const max = await query.max('omittedEdgePosition')
    const min = await query.min('omittedEdgePosition')
    const sum = await query.sum('omittedEdgePosition')
    const avg = await query.avg('omittedEdgePosition')
    const typedScalars: Node['omittedEdgePosition'][] = [max, min, sum, avg]

    type ScalarRootValue = typeof max
    type ScalarRootValueIsNotAny = ExpectFalse<IsAny<ScalarRootValue>>
    type ScalarRootValueIsNotNever = ExpectFalse<IsNever<ScalarRootValue>>
    const inferredScalarRootValue: ScalarRootValue = node.omittedEdgePosition

    const maxByRootGroup = await query.maxBy('name', 'edge.weight')
    const maxByRootAggregate = await query.maxBy('edge.name', 'omittedEdgePosition')
    const minByRootGroup = await query.minBy('name', 'edge.weight')
    const minByRootAggregate = await query.minBy('edge.name', 'omittedEdgePosition')
    const sumByRootGroup = await query.sumBy('name', 'edge.weight')
    const sumByRootAggregate = await query.sumBy('edge.name', 'omittedEdgePosition')
    const avgByRootGroup = await query.avgBy('name', 'edge.weight')
    const avgByRootAggregate = await query.avgBy('edge.name', 'omittedEdgePosition')

    const typedRootGroups: Map<Node['name'], Edge['weight']>[] = [
      maxByRootGroup,
      minByRootGroup,
      sumByRootGroup,
      avgByRootGroup,
    ]
    const typedRootAggregates: Map<Edge['name'], Node['omittedEdgePosition']>[] = [
      maxByRootAggregate,
      minByRootAggregate,
      sumByRootAggregate,
      avgByRootAggregate,
    ]

    type GroupedRootKey = MapKey<typeof maxByRootGroup>
    type GroupedRootKeyIsNotAny = ExpectFalse<IsAny<GroupedRootKey>>
    type GroupedRootKeyIsNotNever = ExpectFalse<IsNever<GroupedRootKey>>
    const inferredGroupedRootKey: GroupedRootKey = node.name

    type GroupedRootAggregate = MapValue<typeof maxByRootAggregate>
    type GroupedRootAggregateIsNotAny = ExpectFalse<IsAny<GroupedRootAggregate>>
    type GroupedRootAggregateIsNotNever = ExpectFalse<IsNever<GroupedRootAggregate>>
    const inferredGroupedRootAggregate: GroupedRootAggregate = node.omittedEdgePosition

    void (null as unknown as CountByRootKeyIsNotAny)
    void (null as unknown as CountByRootKeyIsNotNever)
    void (null as unknown as ScalarRootValueIsNotAny)
    void (null as unknown as ScalarRootValueIsNotNever)
    void (null as unknown as GroupedRootKeyIsNotAny)
    void (null as unknown as GroupedRootKeyIsNotNever)
    void (null as unknown as GroupedRootAggregateIsNotAny)
    void (null as unknown as GroupedRootAggregateIsNotNever)
    void inferredCountByRootKey
    void inferredScalarRootValue
    void inferredGroupedRootKey
    void inferredGroupedRootAggregate
    void typedCountBy
    void typedScalars
    void typedRootGroups
    void typedRootAggregates
    void pluckGeneric
  })

  it('keeps legacy root-qualified fields compatible across joined APIs', async () => {
    const query = Node.query().innerJoin('edgeNodes', 'edge')

    query.order('graph_nodes.id')

    const countBy = await query.countBy('graph_nodes.name')
    const max = await query.max('graph_nodes.omittedEdgePosition')
    const min = await query.min('graph_nodes.omittedEdgePosition')
    const sum = await query.sum('graph_nodes.omittedEdgePosition')
    const avg = await query.avg('graph_nodes.omittedEdgePosition')
    const maxBy = await query.maxBy('graph_nodes.name', 'graph_nodes.omittedEdgePosition')
    const minBy = await query.minBy('graph_nodes.name', 'graph_nodes.omittedEdgePosition')
    const sumBy = await query.sumBy('graph_nodes.name', 'graph_nodes.omittedEdgePosition')
    const avgBy = await query.avgBy('graph_nodes.name', 'graph_nodes.omittedEdgePosition')
    const plucked = await query.pluck('graph_nodes.id', 'edge.name')

    const typedCountBy: Map<Node['name'], number> = countBy
    const typedScalars: Node['omittedEdgePosition'][] = [max, min, sum, avg]
    const typedGrouped: Map<Node['name'], Node['omittedEdgePosition']>[] = [maxBy, minBy, sumBy, avgBy]
    const typedPlucked: [Node['id'], Edge['name']][] = plucked

    void typedCountBy
    void typedScalars
    void typedGrouped
    void typedPlucked
  })

  it('does not broaden root qualification into where or distinct', () => {
    const query = Node.query().innerJoin('edgeNodes', 'edge')

    query.where({
      // @ts-expect-error joined where keeps bare root fields canonical
      'graph_nodes.id': 'node-id',
    })
    // @ts-expect-error distinct continues to accept only bare root fields
    query.distinct('graph_nodes.id')
  })
})
