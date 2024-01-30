import User from '../../../../test-app/app/models/User'
import Pet from '../../../../test-app/app/models/Pet'

describe('attribute getters', () => {
  it('are set based on the columns in the table', () => {
    const user = User.new()
    user['currentAttributes']['email'] = 'hello@world'
    expect(user.email).toEqual('hello@world')
  })

  context('other Dream clases', () => {
    it('are not affected by the columns in a Dream’s table', () => {
      const pet = Pet.new()
      pet['currentAttributes']['email'] = 'hello@world'
      expect((pet as any).email).toBeUndefined()
    })
  })
})
