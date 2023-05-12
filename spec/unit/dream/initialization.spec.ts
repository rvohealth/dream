import { DateTime } from 'luxon'
import User from '../../../test-app/app/models/User'
import Mylar from '../../../test-app/app/models/Balloon/Mylar'

describe('Dream initialization', () => {
  it('sets attributes', () => {
    const user = User.new({ email: 'fred' })
    expect(user.email).toEqual('fred')
    expect(user.attributes().email).toEqual('fred')
  })

  context('an object is marshaled as a date by kysely', () => {
    it('converts the date to a luxon date', async () => {
      const user = await User.create({ email: 'fred@', password: 'howyadoin' })
      const u = await User.find(user.id)
      expect(u!.created_at.constructor).toEqual(DateTime)
    })
  })

  context('a decimal is marshaled as a string by kysely', () => {
    it('converts the string to a number', async () => {
      const user = await User.create({ email: 'fred@', password: 'howyadoin' })
      const balloon = await Mylar.create({ color: 'blue', volume: 1.43, user })
      const b = await Mylar.find(balloon.id)
      expect(b!.volume.constructor).toEqual(Number)
    })
  })
})
