import User from '../../../test-app/app/models/User'
import Composition from '../../../test-app/app/models/Composition'
import CompositionAsset from '../../../test-app/app/models/CompositionAsset'
import CompositionAssetAudit from '../../../test-app/app/models/CompositionAssetAudit'
import Node from '../../../test-app/app/models/Graph/Node'
import Edge from '../../../test-app/app/models/Graph/Edge'
import EdgeNode from '../../../test-app/app/models/Graph/EdgeNode'

describe('Query.joinsPluck', () => {
  it('can pluck from the associated namespace', async () => {
    const node = await Node.create({ name: 'N1' })
    const edge1 = await Edge.create({ name: 'E1' })
    const edge2 = await Edge.create({ name: 'E2' })
    await EdgeNode.create({ node, edge: edge1 })
    await EdgeNode.create({ node, edge: edge2 })

    const plucked = await Node.joinsPluck('edgeNodes', 'edge', { name: 'E1' }, ['edge.id', 'edge.name'])
    expect(plucked).toEqual([[edge1.id, edge1.name]])
  })

  it('association name after conditional', async () => {
    const node = await Node.create({ name: 'N1' })
    const edge1 = await Edge.create({ name: 'E1' })
    const edge2 = await Edge.create({ name: 'E2' })
    await EdgeNode.create({ node, edge: edge1 })
    await EdgeNode.create({ node, edge: edge2 })

    const plucked = await Node.joinsPluck('edgeNodes', { edge_id: edge2.id }, 'edge', [
      'edge.id',
      'edge.name',
    ])
    expect(plucked).toEqual([[edge2.id, edge2.name]])
  })
})

describe('Query#joinsPluck', () => {
  it('can pluck from the associated namespace', async () => {
    const node = await Node.create({ name: 'N1' })
    const edge1 = await Edge.create({ name: 'E1' })
    const edge2 = await Edge.create({ name: 'E2' })
    await EdgeNode.create({ node, edge: edge1 })
    await EdgeNode.create({ node, edge: edge2 })

    const plucked = await node.joinsPluck('edgeNodes', 'edge', { name: 'E1' }, ['edge.id', 'edge.name'])
    expect(plucked).toEqual([[edge1.id, edge1.name]])
  })

  it('two association names after conditional', async () => {
    const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })

    const composition1 = await Composition.create({ user })
    const compositionAsset1 = await CompositionAsset.create({ composition: composition1 })
    const compositionAssetAudit1 = await CompositionAssetAudit.create({
      compositionAsset: compositionAsset1,
      approval: true,
    })

    const composition2 = await Composition.create({ user })
    const compositionAsset2 = await CompositionAsset.create({ composition: composition2 })
    const compositionAssetAudit2 = await CompositionAssetAudit.create({
      compositionAsset: compositionAsset2,
      approval: true,
    })

    const plucked = await user.joinsPluck(
      'compositions',
      { id: composition2.id },
      'compositionAssets',
      'compositionAssetAudits',
      ['compositionAssetAudits.id', 'compositionAssetAudits.approval']
    )

    expect(plucked).toEqual([[compositionAssetAudit2.id, true]])
  })
})
