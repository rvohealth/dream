import User from '../../../test-app/app/models/User'

describe('Dream#isPersisted', () => {
  context('after a record has been saved', () => {
    it('is true', async () => {
      const user = await User.create({ email: 'hi@there', password: 'howyadoin' })
      expect(user.isPersisted).toBe(true)
    })

    context('when saving failed', () => {
      it('is false', async () => {
        await User.create({ email: 'hi@there', password: 'howyadoin' })
        const failedUser = User.new({ email: 'hi@there', password: 'howyadoin' })

        try {
          await failedUser.save()
        } catch {
          // no-op
        }

        expect(failedUser.isPersisted).toBe(false)
      })
    })
  })

  context('when the record is pulled from the database', () => {
    it('is true ', async () => {
      await User.create({ email: 'hi@there', password: 'howyadoin' })
      const user = await User.first()
      expect(user!.isPersisted).toBe(true)
    })
  })

  context('when the record’s primary key is manually set by the user', () => {
    it('is false ', () => {
      const user = User.new({ email: 'hi@there', password: 'howyadoin' })
      user.id = 5
      expect(user.isPersisted).toBe(false)
    })
  })

  context('for a new record', () => {
    it('is false', () => {
      const user = User.new({ email: 'hi@there', password: 'howyadoin' })
      expect(user.isPersisted).toBe(false)
    })
  })
})
