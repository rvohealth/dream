import ops from '../../../src/ops'
import Node from '../../../test-app/app/models/Graph/Node'
import Pet from '../../../test-app/app/models/Pet'

describe('Dream.distinct', () => {
  it('returns unique results distinct on the primary key', async () => {
    const node1 = await Node.create({ name: 'mynode' })
    const node2 = await Node.create({ name: 'mynode' })
    const node3 = await Node.create({ name: 'chalupas' })

    let ids = await Node.distinct().pluck('id')
    expect(ids).toEqual([node1.id, node2.id, node3.id])
  })

  context('with a specific column name passed', () => {
    it('returns unique results', async () => {
      const node1 = await Node.create({ name: 'mynode' })
      const node2 = await Node.create({ name: 'mynode' })
      const node3 = await Node.create({ name: 'chalupas' })

      const names = await Node.distinct('name').pluck('name')
      expect(names).toEqual(['chalupas', 'mynode'])
    })
  })

  context('with "true" passed', () => {
    it('returns unique results distinct on the primary key', async () => {
      const node1 = await Node.create({ name: 'mynode' })
      const node2 = await Node.create({ name: 'mynode' })
      const node3 = await Node.create({ name: 'chalupas' })

      let ids = await Node.distinct(true).pluck('id')
      expect(ids).toEqual([node1.id, node2.id, node3.id])
    })
  })

  context('with "false" passed', () => {
    it('unsets distinct clause', async () => {
      const node1 = await Node.create({ name: 'mynode' })
      const node2 = await Node.create({ name: 'mynode' })
      const node3 = await Node.create({ name: 'chalupas' })

      const names = await Node.distinct('name').distinct(false).pluck('name')
      expect(names).toEqual(['mynode', 'mynode', 'chalupas'])
    })
  })

  context('with a similarity operator passed', () => {
    it('respects the similarity operator', async () => {
      const node1 = await Node.create({ name: 'mynode' })
      const node2 = await Node.create({ name: 'mynode' })
      const node3 = await Node.create({ name: 'chalupas' })

      let ids = await Node.distinct('name')
        .where({ name: ops.similarity('mynod') })
        .order('name', 'desc')
        .pluck('graph_nodes.id')
      expect(ids).toEqual([node1.id])
    })
  })

  context('with matching distinct-clause-on-the-association', () => {
    context('HasMany', () => {
      it('applies distinct clause to association upon loading', async () => {
        const pet = await Pet.create()
        const collar1 = await pet.createAssociation('collars', {
          tagName: 'chalupas jr',
        })
        const collar2 = await pet.createAssociation('collars', {
          tagName: 'chalupas jr',
        })

        const reloaded = await Pet.preload('uniqueCollars').first()
        expect(reloaded!.uniqueCollars).toMatchDreamModels([collar1])
      })
    })
  })
})
