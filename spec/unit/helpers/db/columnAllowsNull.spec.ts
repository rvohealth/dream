import columnAllowsNull from '../../../../src/helpers/db/columnAllowsNull.js'
import User from '../../../../test-app/app/models/User.js'

describe('columnAllowsNull', () => {
  it('returns false for a non-nullable column', () => {
    expect(columnAllowsNull(User, 'email' as any)).toBe(false)
  })

  it('returns true for a nullable column', () => {
    expect(columnAllowsNull(User, 'name' as any)).toBe(true)
  })
})
