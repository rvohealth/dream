import { DateTime } from 'luxon'
import User from '../../../test-app/app/models/User'

describe('Dream#clone', () => {
  it('returns a new copy', async () => {
    const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    const user2 = user.clone()
    expect(user).not.toBe(user2)
  })

  it('returns a record which is comparibly still the same dream model', async () => {
    const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    const user2 = user.clone()
    expect(user).toMatchDreamModel(user2)
  })

  it('clones the attributes to a new instance', async () => {
    const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    const user2 = user.clone()
    expect(user.attributes()).toEqual(user2.attributes())
    expect(user.attributes().createdAt).not.toBe(user2.attributes().createdAt)
  })

  it('clones the loaded associations to a new instance', async () => {
    const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    await user.createAssociation('balloons', { type: 'Latex', color: 'red' })
    await user.load('balloons').execute()

    const user2 = user.clone()
    expect(user.balloons).toMatchDreamModels(user2.balloons)
  })

  context('miscillanious attributes', () => {
    it('copies miscillanious deeply nested objects to the clone', async () => {
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

      const user2 = user.clone()
      expect((user2 as any).howyadoin).toEqual(deeplyNestedAttributes)
      expect((user2 as any).howyadoin).not.toBe(deeplyNestedAttributes)
    })

    it('copies miscillanious numbers to the clone', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      ;(user as any).howyadoin = 7.7

      const user2 = user.clone()
      expect((user2 as any).howyadoin).toEqual(7.7)
    })

    it('copies miscillanious strings to the clone', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      ;(user as any).howyadoin = 'howyadoin'

      const user2 = user.clone()
      expect((user2 as any).howyadoin).toEqual('howyadoin')
    })

    it('copies miscillanious DateTime instances to the clone', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      const now = DateTime.now()
      ;(user as any).howyadoin = now

      const user2 = user.clone()
      expect((user2 as any).howyadoin).toEqual(now)
      expect((user2 as any).howyadoin).not.toBe(now)
    })

    it('copies miscillanious null values to the clone', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      ;(user as any).howyadoin = null

      const user2 = user.clone()
      expect((user2 as any).howyadoin).toBeNull()
    })

    it('copies nested objects containing dreams', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      const balloon = await user.createAssociation('balloons', { type: 'Latex', color: 'red' })
      await user.load('balloons').execute()
      ;(user as any).howyadoin = { stuff: [{ dreams: [balloon] }] }

      const user2 = user.clone()
      expect((user2 as any).howyadoin.stuff[0].dreams).toMatchDreamModels([balloon])

      const clonedDream = (user2 as any).howyadoin.stuff[0].dreams[0]
      expect(clonedDream).not.toBe(balloon)
      expect(clonedDream.constructor.name).toEqual(balloon.constructor.name)
    })
  })
})
