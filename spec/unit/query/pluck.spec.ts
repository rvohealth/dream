import User from '../../../test-app/app/models/User'
import Node from '../../../test-app/app/models/Graph/Node'
import Edge from '../../../test-app/app/models/Graph/Edge'
import EdgeNode from '../../../test-app/app/models/Graph/EdgeNode'
import Composition from '../../../test-app/app/models/Composition'
import CompositionAsset from '../../../test-app/app/models/CompositionAsset'

describe('Query#pluck', () => {
  let user1: User
  let user2: User
  let user3: User

  beforeEach(async () => {
    user1 = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    user2 = await User.create({ email: 'how@yadoin', password: 'howyadoin' })
    user3 = await User.create({ email: 'fred@fishman', password: 'howyadoin' })
  })

  it('plucks the specified attributes and returns them as raw data', async () => {
    const plucked = await User.order('id').pluck('id')
    expect(plucked).toEqual([user1.id, user2.id, user3.id])
  })

  context('with multiple fields', () => {
    it('should return multi-dimensional array', async () => {
      const plucked = await User.order('id').pluck('id', 'created_at')
      expect(plucked).toEqual([
        [user1.id, user1.created_at],
        [user2.id, user2.created_at],
        [user3.id, user3.created_at],
      ])
    })
  })
})
