import Dream from '../../../src'
import User from '../../../src/test-app/app/models/user'

describe('Dream#schema', () => {
  it('includes all properties set on class', async () => {
    console.log(User)
    // expect(User.schema.id).toEqual('howyadoin')
  })

  it('does not modify neighboring model schemas', async () => {
    // expect(Dream.schema).toEqual({})
  })
})
