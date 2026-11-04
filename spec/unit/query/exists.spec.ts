import ops from '../../../src/ops/index.js'
import Pet from '../../../test-app/app/models/Pet.js'
import User from '../../../test-app/app/models/User.js'

describe('Query#exists', () => {
  context('when a matching record exists', () => {
    it('returns true', async () => {
      await User.create({ email: 'how@yadoin', password: 'howyadoin' })
      const result = await User.where({ email: 'how@yadoin' }).exists()
      expect(result).toBe(true)
    })
  })

  context('when a matching record does not exist', () => {
    it('returns false', async () => {
      const result = await User.where({ email: 'how@yadoin' }).exists()
      expect(result).toBe(false)
    })
  })

  context('when the query joins an association whose table also has an id column', () => {
    it('returns true when a matching record exists', async () => {
      const user = await User.create({ email: 'how@yadoin', password: 'howyadoin' })
      await Pet.create({ user, name: 'Snoopy' })
      const result = await User.innerJoin('pets', { and: { name: 'Snoopy' } }).exists()
      expect(result).toBe(true)
    })

    it('returns false when no matching record exists', async () => {
      const user = await User.create({ email: 'how@yadoin', password: 'howyadoin' })
      await Pet.create({ user, name: 'Snoopy' })
      const result = await User.innerJoin('pets', { and: { name: 'Woodstock' } }).exists()
      expect(result).toBe(false)
    })
  })

  context('when the query loads an association with leftJoinPreload', () => {
    it('returns true when a matching record exists', async () => {
      const user = await User.create({ email: 'how@yadoin', password: 'howyadoin' })
      await Pet.create({ user, name: 'Snoopy' })
      const result = await User.where({ email: 'how@yadoin' }).leftJoinPreload('pets').exists()
      expect(result).toBe(true)
    })

    it('returns false when no matching record exists', async () => {
      const result = await User.where({ email: 'how@yadoin' }).leftJoinPreload('pets').exists()
      expect(result).toBe(false)
    })
  })

  context('when a similarity operator is passed', () => {
    context('when a matching record exists', () => {
      it('returns true', async () => {
        await User.create({ email: 'how@yadoin', password: 'howyadoin', name: 'fred o' })
        const result = await User.where({ name: ops.similarity('fredo') }).exists()
        expect(result).toBe(true)
      })
    })

    context('when a matching record does not exist', () => {
      it('returns false', async () => {
        await User.create({ email: 'how@yadoin', password: 'howyadoin', name: 'fred o' })
        const result = await User.where({ email: ops.similarity('calvin') }).exists()
        expect(result).toBe(false)
      })
    })
  })
})
