import { DateTime } from '../../../src/helpers/DateTime.js'
import Latex from '../../../test-app/app/models/Balloon/Latex.js'
import User from '../../../test-app/app/models/User.js'

describe('Dream#dup', () => {
  it('returns a new, unpersisted copy', async () => {
    const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    const user2 = user.dup()
    expect(user).not.toBe(user2)
    expect(user.isPersisted).toEqual(true)
    expect(user2.isPersisted).toEqual(false)
  })

  it('does not contain changes', async () => {
    const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    const user2 = user.dup()
    expect(user2.changes()).toEqual({})
  })

  it('copies attributes to a new instance, resetting primary key, created and updated fields to undefined', async () => {
    const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    const user2 = user.dup()
    expect({
      ...user.getAttributes(),
      id: undefined,
      createdAt: undefined,
      updatedAt: undefined,
    }).toEqual(user2.getAttributes())
  })

  context('miscellaneous attributes', () => {
    it('copies miscellaneous deeply nested objects to the copy', async () => {
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

      const user2 = user.dup()
      expect((user2 as any).howyadoin).toEqual(deeplyNestedAttributes)
      expect((user2 as any).howyadoin).not.toBe(deeplyNestedAttributes)
    })

    it('copies miscellaneous numbers to the copy', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      ;(user as any).howyadoin = 7.7

      const user2 = user.dup()
      expect((user2 as any).howyadoin).toEqual(7.7)
    })

    it('copies miscellaneous strings to the copy', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      ;(user as any).howyadoin = 'howyadoin'

      const user2 = user.dup()
      expect((user2 as any).howyadoin).toEqual('howyadoin')
    })

    it('copies miscellaneous DateTime instances to the copy', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      const now = DateTime.now()
      ;(user as any).howyadoin = now

      const user2 = user.dup()
      expect((user2 as any).howyadoin).toEqual(now)
    })

    it('copies miscellaneous null values to the copy', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      ;(user as any).howyadoin = null

      const user2 = user.dup()
      expect((user2 as any).howyadoin).toBeNull()
    })
  })

  it('does not copy sortable attributes', async () => {
    const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    const balloon = await Latex.create({ user })

    const balloon2 = balloon.dup()
    expect(balloon2.positionAlpha).toBeUndefined()
    expect(balloon2.positionBeta).toBeUndefined()
  })
})
