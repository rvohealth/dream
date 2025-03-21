import { DateTime } from '../../../src/index.js'
import User from '../../../test-app/app/models/User.js'

describe('Dream#clone', () => {
  it('returns a new copy', async () => {
    const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    const user2 = user['clone']()
    expect(user).not.toBe(user2)
  })

  it('returns a record which is comparibly still the same dream model', async () => {
    const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    const user2 = user['clone']()
    expect(user).toMatchDreamModel(user2)
  })

  it('copies the attributes to a new instance (immutable objects are copied by reference)', async () => {
    const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    const user2 = user['clone']()
    expect(user.getAttributes()).toEqual(user2.getAttributes())
    expect(user.getAttributes().createdAt).toBe(user2.getAttributes().createdAt)
  })

  it('copies by reference the loaded associations to a new instance', async () => {
    let user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    await user.createAssociation('balloons', { type: 'Latex', color: 'red' })
    user = (await User.preload('balloons').first())!

    const user2 = user['clone']()
    expect(user.balloons).toMatchDreamModels(user2.balloons)
    expect(user.balloons[0]).toBe(user2.balloons[0])
  })

  context('miscellaneous attributes', () => {
    it('copies miscellaneous deeply nested objects to the clone', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      const deeplyNestedAttributes = {
        how: {
          ya: {
            doin: [
              {
                how: { ya: { doin: 'fine, just fiiiine' } },
              },
            ],
          },
        },
      }

      ;(user as any).howyadoin = deeplyNestedAttributes

      const user2 = user['clone']()
      expect((user2 as any).howyadoin).toEqual(deeplyNestedAttributes)
      expect((user2 as any).howyadoin).not.toBe(deeplyNestedAttributes)
    })

    it('copies miscellaneous numbers to the clone', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      ;(user as any).howyadoin = 7.7

      const user2 = user['clone']()
      expect((user2 as any).howyadoin).toEqual(7.7)
    })

    it('copies miscellaneous strings to the clone', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      ;(user as any).howyadoin = 'howyadoin'

      const user2 = user['clone']()
      expect((user2 as any).howyadoin).toEqual('howyadoin')
    })

    it('copies miscellaneous DateTime instances by reference (since they are immutable) to the clone', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      const now = DateTime.now()
      ;(user as any).howyadoin = now

      const user2 = user['clone']()
      expect((user2 as any).howyadoin).toBe(now)
    })

    it('copies miscellaneous null values to the clone', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      ;(user as any).howyadoin = null

      const user2 = user['clone']()
      expect((user2 as any).howyadoin).toBeNull()
    })
  })
})
