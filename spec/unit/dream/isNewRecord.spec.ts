import User from '../../../test-app/app/models/User.js'

describe('Dream#isNewRecord', () => {
  context('for a new record', () => {
    it('is true', () => {
      const user = User.new({ email: 'hi@there', password: 'howyadoin' })
      expect(user.isNewRecord).toBe(true)
    })
  })

  context('after a record has been saved', () => {
    it('is false', async () => {
      const user = await User.create({ email: 'hi@there', password: 'howyadoin' })
      expect(user.isNewRecord).toBe(false)
    })

    context('when saving failed', () => {
      it('is true', async () => {
        await User.create({ email: 'hi@there', password: 'howyadoin' })
        const failedUser = User.new({ email: 'hi@there', password: 'howyadoin' })

        try {
          await failedUser.save()
        } catch {
          // no-op
        }

        expect(failedUser.isNewRecord).toBe(true)
      })
    })
  })
})
