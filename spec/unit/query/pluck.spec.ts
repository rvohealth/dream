import ops from '../../../src/ops'
import Edge from '../../../test-app/app/models/Graph/Edge'
import User from '../../../test-app/app/models/User'

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

  context('plucking from base model when joining associations', () => {
    it('plucks the specified attributes from the base model', async () => {
      await user2.createAssociation('compositions')
      const plucked = await User.joins('compositions').pluck('id')
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
})
