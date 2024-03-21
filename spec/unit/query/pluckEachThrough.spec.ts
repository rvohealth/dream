import { DateTime } from 'luxon'
import Node from '../../../test-app/app/models/Graph/Node'
import Edge from '../../../test-app/app/models/Graph/Edge'
import EdgeNode from '../../../test-app/app/models/Graph/EdgeNode'
import ops from '../../../src/ops'
import User from '../../../test-app/app/models/User'
import Composition from '../../../test-app/app/models/Composition'
import Pet from '../../../test-app/app/models/Pet'
import CompositionAsset from '../../../test-app/app/models/CompositionAsset'
import CompositionAssetAudit from '../../../test-app/app/models/CompositionAssetAudit'
import MissingRequiredCallbackFunctionToPluckEach from '../../../src/exceptions/missing-required-callback-function-to-pluck-each'
import CannotPassAdditionalFieldsToPluckEachAfterCallback from '../../../src/exceptions/cannot-pass-additional-fields-to-pluck-each-after-callback-function'

describe('Query#pluckEachThrough', () => {
  it('can pluck from the associated namespace', async () => {
    const node = await Node.create({ name: 'N1' })
    const edge1 = await Edge.create({ name: 'E1' })
    const edge2 = await Edge.create({ name: 'E2' })
    await EdgeNode.create({ node, edge: edge1 })
    await EdgeNode.create({ node, edge: edge2 })

    const plucked: any[] = []
    await Node.query().pluckEachThrough(
      'edgeNodes',
      'edge',
      { name: 'E1' },
      ['edge.id', 'edge.name'],
      arr => {
        plucked.push(arr)
      }
    )

    expect(plucked).toEqual([[edge1.id, edge1.name]])
  })

  context('with invalid arguments', () => {
    context('when the cb function is not provided', () => {
      it('raises a targeted exception', async () => {
        await expect(
          async () => await Node.query().pluckEachThrough('edgeNodes', 'edge', ['edge.id'])
        ).rejects.toThrowError(MissingRequiredCallbackFunctionToPluckEach)
      })
    })

    context('when additional pluck arguments are following the call to pluckEachThrough', () => {
      it('raises a targeted exception', async () => {
        await expect(
          async () => await Node.query().pluckEachThrough('edgeNodes', 'edge', () => {}, ['edge.id'] as any)
        ).rejects.toThrowError(CannotPassAdditionalFieldsToPluckEachAfterCallback)
      })
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
      await Node.query().pluckEachThrough('edgeNodes', 'edge', { name: 'E1' }, 'edge.weight', data => {
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
    await Node.query().pluckEachThrough(
      'edgeNodes',
      { edgeId: edge2.id },
      'edge',
      ['edge.id', 'edge.name'],
      data => {
        plucked.push(data)
      }
    )
    expect(plucked).toEqual([[edge2.id, edge2.name]])
  })

  context('with a similarity operator', () => {
    it('respects the similarity operator', async () => {
      const user1 = await User.create({ name: 'jeremy', email: 'hello@world1', password: 'howyadoin' })
      await Composition.create({ content: 'howyadoin', user: user1 })

      const user2 = await User.create({ name: 'cheeseman', email: 'hello@world2', password: 'howyadoin' })
      await Composition.create({ content: 'howyadoin', user: user2 })

      const plucked: any[] = []
      await Composition.query().pluckEachThrough(
        'user',
        { name: ops.similarity('jerem') },
        ['user.id'],
        data => {
          plucked.push(data)
        }
      )
      expect(plucked).toEqual([user1.id])
    })
  })

  context('with a default scope', () => {
    it('applies the default scope to the included results', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      await Pet.create({ user, name: 'Snoopy' })
      await Pet.create({ user, name: 'Woodstock', deletedAt: DateTime.now() })

      const names: any[] = []
      await User.pluckEachThrough('pets', 'pets.name', data => {
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
      await CompositionAssetAudit.query().pluckEachThrough('user', 'user.email', data => {
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
        await User.query().pluckEachThrough(
          'compositions',
          'compositionAssets',
          ['compositionAssets.name'],
          (data: any) => {
            plucked.push(data)
          },
          { batchSize: 1 }
        )
        expect(plucked).toEqual(expect.arrayContaining(['asset 1', 'asset 2', 'asset 3', 'asset 4']))
      })
    })
  })

  // this is skipped, since it is only here to ensure that types are working
  // from args a-g, which does not actually need to be run, since if this is
  // broken, tests will fail to compile due to type errors
  it.skip('permits types a-g', async () => {
    await Node.query().pluckEachThrough('edgeNodes', 'edge', 'edgeNodes', 'edge', 'edgeNodes', 'edge', [
      'edge.id',
    ])
  })
})
