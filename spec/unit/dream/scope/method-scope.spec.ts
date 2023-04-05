import Composition from '../../../../src/test-app/app/models/composition'
import User from '../../../../src/test-app/app/models/user'

describe('Dream Scope (method variant)', () => {
  it('builds scope mapping', async () => {
    const scopes = User.scopes.named
    expect(scopes[0].method).toEqual('withEmail')
    expect(scopes[0].default).toEqual(false)
  })
})
