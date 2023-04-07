import { DateTime } from 'luxon'
import User from '../../../src/test-app/app/models/user'

describe('Dream initialization', () => {
  it('sets attributes', () => {
    const user = new User({ email: 'fred' })
    expect(user.email).toEqual('fred')
    expect(user.attributes.email).toEqual('fred')
  })

  context('an object is marshaled as a date by kysely', () => {
    it('converts the date to a luxon date', async () => {
      const user = await User.create({ email: 'fred@', password: 'howyadoin' })
      const u = await User.find(user.id)
      expect(u!.created_at.constructor).toEqual(DateTime)
    })
  })
})
