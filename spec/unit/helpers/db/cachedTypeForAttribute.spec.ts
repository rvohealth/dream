import cachedTypeForAttribute from '../../../../src/helpers/db/cachedTypeForAttribute.js'
import User from '../../../../test-app/app/models/User.js'

describe('cachedTypeForAttribute', () => {
  it('returns the db type for a varchar column', () => {
    expect(cachedTypeForAttribute(User, 'email' as any)).toEqual('character varying')
  })

  it('returns the db type for an array column', () => {
    expect(cachedTypeForAttribute(User, 'favoriteDates' as any)).toEqual('date[]')
  })

  it('returns the db type for a bigint column', () => {
    expect(cachedTypeForAttribute(User, 'id')).toEqual('bigint')
  })
})
