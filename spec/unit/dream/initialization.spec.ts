import User from '../../../src/test-app/app/models/user'

describe('Dream initialization', () => {
  it('sets attributes', () => {
    const user = new User({ email: 'fred' })
    expect(user.email).toEqual('fred')
    expect(user.attributes.email).toEqual('fred')
  })
})
