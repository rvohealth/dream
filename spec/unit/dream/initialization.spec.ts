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
    it('converts the string to a number limited to the number of decimal places in the schema', async () => {
      const user = await User.create({ email: 'fred@', password: 'howyadoin' })
      const balloon = await Mylar.create({ color: 'blue', volume: 1.4343666, user })
      const b = await Mylar.find(balloon.id)
      expect(b!.volume).toEqual(1.434)
    })

    it('when initializing without a save, it does not truncate the decimal', () => {
      const balloon = Mylar.new({ volume: 4.34343434 })
      expect(balloon.volume).toEqual(4.34343434)
    })

    it('the decimal value is set to null', () => {
      const balloon = Mylar.new({ volume: null })
      expect(balloon.volume).toBeNull()
    })

    it('the decimal value is set to undefined', () => {
      const balloon = Mylar.new({ volume: undefined })
      expect(balloon.volume).toBeUndefined()
    })

    it('the decimal value is set to 0', () => {
      const balloon = Mylar.new({ volume: 0 })
      expect(balloon.volume).toEqual(0)
    })
  })
})
