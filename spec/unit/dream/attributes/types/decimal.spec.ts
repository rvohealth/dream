import Mylar from '../../../../../test-app/app/models/Balloon/Mylar.js'
import User from '../../../../../test-app/app/models/User.js'

describe('marshalling postgres decimals from db', () => {
  let user: User

  beforeEach(async () => {
    user = await User.create({ email: 'fred@', password: 'howyadoin' })
  })

  it('converts to a number limited to the number of decimal places in the schema', async () => {
    const balloon = await Mylar.create({ volume: 1.4343666, user })
    const reloadedBalloon = await Mylar.find(balloon.id)
    expect(reloadedBalloon!.volume).toEqual(1.434)
  })

  context('when decimal value is set to null', () => {
    it('is null', async () => {
      const balloon = await Mylar.create({ volume: null, user })
      const reloadedBalloon = await Mylar.find(balloon.id)
      expect(reloadedBalloon!.volume).toEqual(null)
    })
  })

  context('when decimal value is set to undefined', () => {
    it('is null', async () => {
      const balloon = await Mylar.create({ volume: undefined as any, user })
      const reloadedBalloon = await Mylar.find(balloon.id)
      expect(reloadedBalloon!.volume).toEqual(null)
    })
  })

  context('when decimal value is set to zero', () => {
    it('it is zero', async () => {
      const balloon = await Mylar.create({ volume: 0, user })
      const reloadedBalloon = await Mylar.find(balloon.id)
      expect(reloadedBalloon!.volume).toEqual(0)
    })
  })

  context('when initializing without a save', () => {
    it('it does not truncate the decimal', () => {
      const balloon = Mylar.new({ volume: 4.34343434 })
      expect(balloon.volume).toEqual(4.34343434)
    })

    context('when decimal value is set to null', () => {
      it('is null', () => {
        const balloon = Mylar.new({ volume: null })
        expect(balloon.volume).toBeNull()
      })
    })

    context('when decimal value is set to undefined', () => {
      it('is undefined', () => {
        const balloon = Mylar.new({ volume: undefined as any })
        expect(balloon.volume).toBeUndefined()
      })
    })

    context('when decimal value is set to zero', () => {
      it('it is zero', () => {
        const balloon = Mylar.new({ volume: 0 })
        expect(balloon.volume).toEqual(0)
      })
    })
  })
})
