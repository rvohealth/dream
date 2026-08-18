import ApplicationModel from '../../../test-app/app/models/ApplicationModel.js'
import Composition from '../../../test-app/app/models/Composition.js'
import CompositionAsset from '../../../test-app/app/models/CompositionAsset.js'
import Edge from '../../../test-app/app/models/Graph/Edge.js'
import EdgeNode from '../../../test-app/app/models/Graph/EdgeNode.js'
import Node from '../../../test-app/app/models/Graph/Node.js'
import User from '../../../test-app/app/models/User.js'

describe('Query#maxBy', () => {
  let user: User
  let composition: Composition

  beforeEach(async () => {
    user = await User.create({ email: 'fred@frewd', password: 'howyadoin', name: 'fred' })
    composition = await Composition.create({ user })
  })

  it('groups the max of the aggregated column by the group column', async () => {
    await CompositionAsset.create({ composition, name: 'primary', score: 3 })
    await CompositionAsset.create({ composition, name: 'primary', score: 7 })
    await CompositionAsset.create({ composition, name: 'secondary', score: 4 })

    const result = await CompositionAsset.query().maxBy('name', 'score')
    expect(result).toEqual(
      new Map<string | null, number | null>([
        ['primary', 7],
        ['secondary', 4],
      ])
    )
  })

  it('emits a real null key for records whose group column is null', async () => {
    await CompositionAsset.create({ composition, name: 'primary', score: 7 })
    await CompositionAsset.create({ composition, score: 8 })

    const result = await CompositionAsset.query().maxBy('name', 'score')
    expect(result).toEqual(
      new Map<string | null, number | null>([
        ['primary', 7],
        [null, 8],
      ])
    )
  })

  it('emits a null value for a group whose aggregated column is entirely null', async () => {
    await CompositionAsset.create({ composition, name: 'primary', score: 5 })
    await CompositionAsset.create({ composition, name: 'empty', score: null }, { skipHooks: true })
    await CompositionAsset.create({ composition, name: 'empty', score: null }, { skipHooks: true })

    const result = await CompositionAsset.query().maxBy('name', 'score')
    expect(result).toEqual(
      new Map<string | null, number | null>([
        ['primary', 5],
        ['empty', null],
      ])
    )
  })

  context('with a where clause', () => {
    it('respects the where clause', async () => {
      await CompositionAsset.create({ composition, name: 'primary', score: 3 })
      await CompositionAsset.create({ composition, name: 'primary', score: 7 })
      await CompositionAsset.create({ composition, name: 'secondary', score: 4 })

      const result = await CompositionAsset.where({ name: 'primary' }).maxBy('name', 'score')
      expect(result).toEqual(new Map<string | null, number | null>([['primary', 7]]))
    })
  })

  context('with no matching records', () => {
    it('returns an empty Map', async () => {
      const result = await CompositionAsset.where({ name: 'nonexistent-name' }).maxBy('name', 'score')
      expect(result).toEqual(new Map())
    })
  })

  context('within an association query', () => {
    it('groups the max for only the association records', async () => {
      await CompositionAsset.create({ composition, name: 'primary', score: 3 })
      await CompositionAsset.create({ composition, name: 'primary', score: 7 })
      await CompositionAsset.create({ composition, name: 'secondary', score: 4 })

      const otherComposition = await Composition.create({ user })
      await CompositionAsset.create({ composition: otherComposition, name: 'primary', score: 100 })

      const result = await composition.associationQuery('compositionAssets').maxBy('name', 'score')
      expect(result).toEqual(
        new Map<string | null, number | null>([
          ['primary', 7],
          ['secondary', 4],
        ])
      )
    })
  })

  context('on a join', () => {
    it('targets the root alias when a bare aggregate field collides with joined fields', async () => {
      const node = await Node.create({ name: 'root' })
      const edge = await Edge.create({ name: 'joined' })
      await EdgeNode.create({ node, edge })

      const query = Node.query().innerJoin('edgeNodes', 'edge')

      expect(await query.maxBy('name', 'id')).toEqual(new Map([[node.name, node.id]]))
    })

    it('supports a bare root field in both grouped aggregate positions', async () => {
      await CompositionAsset.create({ composition, name: 'primary', score: 3 })
      await CompositionAsset.create({ composition, name: 'primary', score: 7 })
      await CompositionAsset.create({ composition, name: 'secondary', score: 4 })

      const query = CompositionAsset.query().innerJoin('composition')
      const groupedByRoot = await query.maxBy('name', 'composition.createdAt')
      const aggregatingRoot = await query.maxBy('composition.content', 'score')
      const legacyQualified = await query.maxBy('composition_assets.name', 'composition_assets.score')

      expect(groupedByRoot).toEqual(
        new Map([
          ['primary', composition.createdAt],
          ['secondary', composition.createdAt],
        ])
      )
      expect(aggregatingRoot).toEqual(new Map([[composition.content, 7]]))
      expect(legacyQualified).toEqual(
        new Map<string | null, number | null>([
          ['primary', 7],
          ['secondary', 4],
        ])
      )
    })

    it('groups the max by a joined association column', async () => {
      await CompositionAsset.create({ composition, name: 'primary', score: 3 })
      await CompositionAsset.create({ composition, name: 'primary', score: 7 })
      await CompositionAsset.create({ composition, name: 'secondary', score: 4 })

      const result = await Composition.query()
        .innerJoin('compositionAssets')
        .maxBy('compositionAssets.name', 'compositionAssets.score')
      expect(result).toEqual(
        new Map<string | null, number | null>([
          ['primary', 7],
          ['secondary', 4],
        ])
      )
    })

    context('when passed an association and clause', () => {
      it('respects the association and clause', async () => {
        await CompositionAsset.create({ composition, name: 'primary', score: 3 })
        await CompositionAsset.create({ composition, name: 'primary', score: 7 })
        await CompositionAsset.create({ composition, name: 'secondary', score: 4 })

        const result = await Composition.query()
          .innerJoin('compositionAssets', { and: { name: 'primary' } })
          .maxBy('compositionAssets.name', 'compositionAssets.score')
        expect(result).toEqual(new Map<string | null, number | null>([['primary', 7]]))
      })
    })

    context('when passed a transaction', () => {
      it('reports accurate grouped maxes (Query#txn path)', async () => {
        await CompositionAsset.create({ composition, name: 'primary', score: 3 })

        await ApplicationModel.transaction(async txn => {
          await CompositionAsset.txn(txn).create({ composition, name: 'primary', score: 7 })
          await CompositionAsset.txn(txn).create({ composition, name: 'secondary', score: 4 })

          const result = await CompositionAsset.query().txn(txn).maxBy('name', 'score')
          expect(result).toEqual(
            new Map<string | null, number | null>([
              ['primary', 7],
              ['secondary', 4],
            ])
          )
        })
      })
    })
  })
})
