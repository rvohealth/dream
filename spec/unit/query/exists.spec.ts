import User from '../../../test-app/app/models/User'

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
})
